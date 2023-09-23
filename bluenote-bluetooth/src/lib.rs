#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

use napi::threadsafe_function::{ThreadSafeCallContext, ThreadsafeFunction};
use napi::{bindgen_prelude::*, JsString, JsUndefined};
use napi_derive::napi;
use std::collections::HashSet;
use std::rc::Rc;
use std::sync::{mpsc, Arc};
use tokio::sync::{oneshot, Mutex};
use windows::core::{h, GUID, HRESULT, HSTRING};
use windows::Devices::Bluetooth::Advertisement::*;
use windows::Devices::Bluetooth::Rfcomm::*;
use windows::Devices::Bluetooth::*;
use windows::Devices::Enumeration::{
    DeviceInformation, DeviceInformationCustomPairing, DeviceInformationKind, DevicePairingKinds,
    DevicePairingProtectionLevel, DevicePairingRequestedEventArgs, DevicePairingResultStatus,
    DeviceWatcher,
};
use windows::Foundation::TypedEventHandler;
use windows::Networking::Sockets::*;
use windows::Storage::Streams::{ByteOrder, DataReader, DataWriter, IBuffer};

static UUID_RFCOMM_SERVICE: &str = "41f4bde2-0492-4bf5-bae2-4451be148999";
static UUID_GATT_SERVICE: &str = "ed8fff89-dabf-4ff5-b962-cb6f3c52c7ec";
static UUID_GATT_CHARACTERISTIC: &str = "ca821ce5-e766-4ae5-af9f-be2dab7b0871";

static CALLBACK_BONDED: std::sync::Mutex<Option<ThreadsafeFunction<String>>> =
    std::sync::Mutex::new(None);

static CALLBACK_FOUND: std::sync::Mutex<Option<ThreadsafeFunction<MyDevice>>> =
    std::sync::Mutex::new(None);

static CALLBACK_PAIRING_REQUESTED: std::sync::Mutex<Option<ThreadsafeFunction<(String, String)>>> =
    std::sync::Mutex::new(None);

static PAIRING: std::sync::Mutex<Pairing> = std::sync::Mutex::new(Pairing {
    provider: None,
    listener: None,
});

static PAIRING_CONNECT_STATE: std::sync::Mutex<PairingConnectState> =
    std::sync::Mutex::new(PairingConnectState { request: None });

static BL_SCANNER: std::sync::Mutex<BluetoothScanner> =
    std::sync::Mutex::new(BluetoothScanner { watcher: None });

struct MyDevice {
    name: String,
    id: String,
}

// export

#[napi(ts_args_type = "callback: (err: null | Error, uuid: string) => void")]
pub fn set_on_bonded(env: Env, callback: JsFunction) -> Result<()> {
    let tsfn =
        env.create_threadsafe_function(&callback, 0, |ctx: ThreadSafeCallContext<String>| {
            // Callbackの引数のRustの型をJavaScriptの型（のVec）へ変換する！
            vec![ctx.value]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        })?;

    let mut callback_bonded = CALLBACK_BONDED.lock().unwrap();
    *callback_bonded = Some(tsfn);

    Ok(())
}

#[napi(
    ts_args_type = "callback: (err: null | Error, deviceName: string, deviceId: string) => void"
)]
pub fn set_on_found(callback: JsFunction) -> Result<()> {
    let tsfn = callback.create_threadsafe_function(0, |ctx: ThreadSafeCallContext<MyDevice>| {
        vec![ctx.value.name, ctx.value.id]
            .iter()
            .map(|x| ctx.env.create_string(&x))
            .collect()
    })?;

    let mut callback_found = CALLBACK_FOUND.lock().unwrap();
    *callback_found = Some(tsfn);

    Ok(())
}

#[napi(ts_args_type = "callback: (err: null | Error, deviceName: string, pin: string) => void")]
pub fn set_on_pairing_requested(callback: JsFunction) -> Result<()> {
    let tsfn = callback.create_threadsafe_function(
        0,
        |ctx: ThreadSafeCallContext<(String, String)>| {
            vec![ctx.value.0, ctx.value.1]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        },
    )?;

    let mut callback = CALLBACK_PAIRING_REQUESTED.lock().unwrap();
    *callback = Some(tsfn);

    Ok(())
}

#[napi]
pub fn start_bluetooth_scan() {
    let mut scanner = BL_SCANNER.lock().unwrap();
    scanner.start();
}

#[napi]
pub fn stop_bluetooth_scan() {
    let mut scanner = BL_SCANNER.lock().unwrap();
    scanner.stop();
}

#[napi]
pub fn pair_async(id: String) -> AsyncTask<AsyncConnect> {
    AsyncTask::new(AsyncConnect { device_id: id })
}

#[napi]
pub fn accept_pairing() {
    let mut state = PAIRING_CONNECT_STATE.lock().unwrap();
    if state.is_pairing() {
        println!("accept!");
        state.accept();
    }
}

#[napi]
pub fn reject_pairing() {
    let mut state = PAIRING_CONNECT_STATE.lock().unwrap();
    if state.is_pairing() {
        println!("reject!");
        state.reject();
    }
}

#[napi]
pub fn fetch_notes_async() -> AsyncTask<AsyncFetch> {
    AsyncTask::new(AsyncFetch {})
}

#[napi]
pub fn make_discoverable(device_id: String) -> AsyncTask<AsyncDiscoverable> {
    AsyncTask::new(AsyncDiscoverable { device_id })
}

#[napi]
pub fn unmake_discoverable() {
    let mut pairing = PAIRING.lock().unwrap();
    pairing.unmake_discoverable();
}

// RFCOMM listener

fn on_received(
    _: &Option<StreamSocketListener>,
    e: &Option<StreamSocketListenerConnectionReceivedEventArgs>,
) -> std::result::Result<(), windows::core::Error> {
    println!("Connected via RFCOMM");

    let mut pairing = PAIRING.lock().unwrap();

    pairing.unmake_discoverable()?;

    let socket = e.as_ref().unwrap().Socket()?;
    let input_stream = socket.InputStream().unwrap();
    let output_stream = socket.OutputStream().unwrap();
    let writer = DataWriter::CreateDataWriter(&output_stream).unwrap();
    let reader = DataReader::CreateDataReader(&input_stream).unwrap();
    let local = tokio::task::LocalSet::new();
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap();

    writer.SetByteOrder(ByteOrder::LittleEndian)?;
    reader.SetByteOrder(ByteOrder::LittleEndian)?;

    let writer_sender = Rc::new(writer);
    let reader_sender = Rc::new(reader);
    let writer_receiver = writer_sender.clone();
    let reader_receiver = reader_sender.clone();

    local.spawn_local(async move {
        // todo: ちゃんと書く

        let uuid_bytes = "19259453-a905-45a6-aeef-93c29b5fc598".as_bytes();

        println!("{}", uuid_bytes.len());

        // 自身のデバイスID(UUID v4)の書き込み
        writer_sender.WriteBytes(uuid_bytes).unwrap();
        writer_sender.StoreAsync().unwrap().await;
        writer_sender.FlushAsync().unwrap().await.unwrap();

        // 相手のデバイスIDの受け取り
        let mut buffer = [0u8; 36];
        reader_receiver.LoadAsync(36).unwrap().await; // 36バイト固定
        reader_receiver.ReadBytes(buffer.as_mut_slice()).unwrap();

        let uuid = String::from_utf8(buffer.to_vec()).unwrap();

        println!("{}", uuid);

        // ACK を返す
        writer_receiver.WriteByte(0);
        writer_receiver.StoreAsync().unwrap().await;
        writer_receiver.FlushAsync().unwrap().await; // 必要

        // ACK 確認
        reader_sender.LoadAsync(1).unwrap().await;
        reader_sender.ReadByte();

        println!("Finished");

        // callback
        let callback = CALLBACK_BONDED.lock().unwrap();

        if let Some(f) = &*callback {
            f.call(
                Ok(uuid),
                napi::threadsafe_function::ThreadsafeFunctionCallMode::Blocking,
            );
        }

        println!("Callback called.");
    });

    rt.block_on(local);

    Ok(())
}

// Bluetooth デバイス検出

fn on_added(
    _: &Option<DeviceWatcher>,
    info: &Option<DeviceInformation>,
) -> windows::core::Result<()> {
    let info = info.as_ref().unwrap();
    let name = info.Name()?;
    let id = info.Id()?;

    let local = tokio::task::LocalSet::new();
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap();

    // 普通に tokio::spawn() するとコンパイルは通るけど panic する...。tokio わからん
    local.spawn_local(async move {
        let bluetooth_device = BluetoothDevice::FromIdAsync(&id).unwrap().await.unwrap();
        let rfcomm_services = bluetooth_device
            .GetRfcommServicesForIdWithCacheModeAsync(
                &RfcommServiceId::FromUuid(GUID::from(UUID_RFCOMM_SERVICE)).unwrap(),
                BluetoothCacheMode::Uncached,
            )
            .unwrap()
            .await
            .unwrap();

        if rfcomm_services.Services().unwrap().Size().unwrap() == 0 {
            return;
        }

        let callback = CALLBACK_FOUND.lock().unwrap();

        if let Some(f) = &*callback {
            let device = MyDevice {
                name: name.to_string(),
                id: id.to_string(),
            };

            f.call(
                Ok(device),
                napi::threadsafe_function::ThreadsafeFunctionCallMode::Blocking,
            );
        }
    });

    rt.block_on(local);

    Ok(())
}

// ペアリングリクエスト

fn on_pairing_requested(
    _: &Option<DeviceInformationCustomPairing>,
    e: &Option<DevicePairingRequestedEventArgs>,
) -> windows::core::Result<()> {
    let e = e.as_ref().unwrap();

    println!("On pairing requested");

    if e.PairingKind()? != DevicePairingKinds::ConfirmPinMatch {
        return Err(windows::core::Error::new(
            HRESULT(0x80004004u32 as i32),
            h!("Only ConfirmPinMatch is allowed for a pairing kind.").to_owned(),
        ));
    }

    let rx: oneshot::Receiver<bool>;

    {
        let mut state = PAIRING_CONNECT_STATE.lock().unwrap();

        if state.is_pairing() {
            // もしくはなにもせずに return (=ペアリング拒否) もあり？
            return Err(windows::core::Error::new(
                HRESULT(0x80004004u32 as i32),
                h!("Another device is pairing.").to_owned(),
            ));
        }

        let tx: oneshot::Sender<bool>;

        (tx, rx) = oneshot::channel();
        state.request = Some(tx);
    }

    // We show the PIN here and the user responds with whether the PIN matches what they see
    // on the target device. Response comes back and we set it on the PinComparePairingRequestedData
    // then complete the deferral.

    let device_name = e.DeviceInformation()?.Name()?.to_string();
    let pin = e.Pin()?.to_string();

    println!("PIN: {}", pin);

    let callback = CALLBACK_PAIRING_REQUESTED.lock().unwrap();

    if let Some(f) = &*callback {
        f.call(
            Ok((device_name, pin)),
            napi::threadsafe_function::ThreadsafeFunctionCallMode::NonBlocking,
        );
    }

    let accept = rx.blocking_recv().unwrap();

    if accept {
        e.Accept()?;
    }

    Ok(())
}

async fn pair(id: &str) -> windows::core::Result<()> {
    let device = BluetoothDevice::FromIdAsync(&HSTRING::from(id))?.await?;
    let service_id = RfcommServiceId::FromUuid(GUID::from(UUID_RFCOMM_SERVICE))?;
    let services = device
        .GetRfcommServicesForIdWithCacheModeAsync(&service_id, BluetoothCacheMode::Uncached)?
        .await?;

    if services.Services()?.Size()? == 0 {
        return Err(windows::core::Error::new(
            HRESULT(0x80004004u32 as i32),
            h!("The device doesn't have the specified service.").to_owned(),
        ));
    }

    let is_paired = device.DeviceInformation()?.Pairing()?.IsPaired()?;

    println!("{}", if is_paired { "Paired" } else { "Not paired" });

    if !is_paired {
        let custom_pairing = device.DeviceInformation()?.Pairing()?.Custom()?;

        custom_pairing.PairingRequested(&TypedEventHandler::new(on_pairing_requested))?;

        println!("Pairing...");

        let result = custom_pairing
            .PairWithProtectionLevelAsync(
                DevicePairingKinds::ConfirmPinMatch,
                DevicePairingProtectionLevel::Default,
            )?
            .await?;

        println!(
            "Pairing Result: {}",
            match result.Status()? {
                DevicePairingResultStatus::Paired => "Success",
                _ => "Failed",
            }
        );

        if result.Status()? != DevicePairingResultStatus::Paired {
            return Err(windows::core::Error::new(
                HRESULT(0x80004004u32 as i32),
                h!("Pairing failed.").to_owned(),
            ));
        }
    }

    let service = services.Services()?.GetAt(0)?;
    let socket = StreamSocket::new()?;

    socket
        .ConnectAsync(
            &service.ConnectionHostName()?,
            &service.ConnectionServiceName()?,
        )?
        .await?;

    println!("Connected!");

    // UUIDのやりとり

    let input_stream = socket.InputStream()?;
    let output_stream = socket.OutputStream()?;
    let writer = DataWriter::CreateDataWriter(&output_stream)?;
    let reader = DataReader::CreateDataReader(&input_stream)?;
    let uuid_bytes = "19259453-a905-45a6-aeef-93c29b5fc598".as_bytes();

    writer.SetByteOrder(ByteOrder::LittleEndian)?;
    reader.SetByteOrder(ByteOrder::LittleEndian)?;

    // 自身のデバイスID(UUID v4)の書き込み
    writer.WriteBytes(uuid_bytes)?;
    writer.StoreAsync()?.await?;
    writer.FlushAsync()?.await?;

    // 相手のデバイスIDの受け取り
    let mut buffer = [0u8; 36];
    reader.LoadAsync(36)?.await?; // 36バイト固定
    reader.ReadBytes(buffer.as_mut_slice())?;

    let uuid = String::from_utf8(buffer.to_vec()).unwrap();

    println!("{}", uuid);

    // ACK を返す
    writer.WriteByte(0)?;
    writer.StoreAsync()?.await?;
    writer.FlushAsync()?.await?; // 必要

    // ACK 確認
    reader.LoadAsync(1)?.await?;
    reader.ReadByte()?;

    println!("Pairing Finished!");

    Ok(())
}

struct PairingConnectState {
    request: Option<oneshot::Sender<bool>>,
}

impl PairingConnectState {
    fn is_pairing(&self) -> bool {
        self.request.is_some()
    }

    fn accept(&mut self) {
        let tx = self.request.take();

        if let Some(tx) = tx {
            tx.send(true);
            self.request = None;
        }
    }

    fn reject(&mut self) {
        let tx = self.request.take();

        if let Some(tx) = tx {
            tx.send(false);
            self.request = None;
        }
    }
}

pub struct AsyncConnect {
    device_id: String,
}

impl Task for AsyncConnect {
    type Output = ();
    type JsValue = JsUndefined;

    fn compute(&mut self) -> Result<Self::Output> {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        let future = pair(&self.device_id);

        rt.block_on(future).unwrap();

        Ok(())
    }

    fn resolve(&mut self, env: Env, _: Self::Output) -> Result<Self::JsValue> {
        env.get_undefined()
    }
}

pub struct AsyncDiscoverable {
    device_id: String,
}

impl Task for AsyncDiscoverable {
    type Output = ();
    type JsValue = JsUndefined;

    fn compute(&mut self) -> Result<Self::Output> {
        let mut pairing = PAIRING.lock().unwrap();
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        let future = pairing.make_discoverable(&self.device_id);

        rt.block_on(future);

        Ok(())
    }

    fn resolve(&mut self, env: Env, _: Self::Output) -> Result<Self::JsValue> {
        env.get_undefined()
    }
}

struct Pairing {
    provider: Option<RfcommServiceProvider>,
    listener: Option<StreamSocketListener>,
}

impl Pairing {
    async fn make_discoverable(&mut self, device_id: &str) -> windows::core::Result<()> {
        // すでに開始済み
        if let Some(_) = &self.provider {
            return Ok(());
        }

        let rfcomm_service_id = RfcommServiceId::FromUuid(GUID::from(UUID_RFCOMM_SERVICE))?;
        let provider = RfcommServiceProvider::CreateAsync(&rfcomm_service_id)?.await?;
        let service_id_str = provider.ServiceId()?.AsString()?;
        let listener = StreamSocketListener::new()?;

        listener.ConnectionReceived(&TypedEventHandler::new(on_received))?;
        listener
            .BindServiceNameWithProtectionLevelAsync(
                &service_id_str,
                SocketProtectionLevel::PlainSocket, /* Androidの設定と合わせる */
            )?
            .await?;

        provider.StartAdvertisingWithRadioDiscoverability(&listener, true)?; // 必要

        self.provider = Some(provider);
        self.listener = Some(listener);

        Ok(())
    }

    fn unmake_discoverable(&mut self) -> windows::core::Result<()> {
        if let Some(provider) = &self.provider {
            provider.StopAdvertising()?;
            self.provider = None;
            self.listener = None;
        }

        Ok(())
    }
}

struct BluetoothScanner {
    watcher: Option<DeviceWatcher>,
}

impl BluetoothScanner {
    fn start(&mut self) -> windows::core::Result<()> {
        if let Some(_) = &self.watcher {
            return Ok(());
        }

        let watcher = DeviceInformation::CreateWatcherWithKindAqsFilterAndAdditionalProperties(
            h!("(System.Devices.Aep.ProtocolId:=\"{e0cbf06c-cd8b-4647-bb8a-263b43f0f974}\")"),
            None,
            DeviceInformationKind::AssociationEndpoint,
        )?;

        watcher.Added(&TypedEventHandler::new(on_added))?;
        watcher.Start()?;

        self.watcher = Some(watcher);

        Ok(())
    }

    fn stop(&mut self) -> windows::core::Result<()> {
        if let Some(watcher) = &self.watcher {
            watcher.Stop()?;
            self.watcher = None;
        }
        Ok(())
    }
}

pub struct AsyncFetch {}

impl Task for AsyncFetch {
    type Output = String;
    type JsValue = JsString;

    fn compute(&mut self) -> Result<Self::Output> {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        let json = rt.block_on(fetch_notes()).unwrap();

        Ok(json)
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
        env.create_string(&output)
    }
}

async fn fetch_notes() -> windows::core::Result<String> {
    let watcher = BluetoothLEAdvertisementWatcher::new()?;
    let advertisement = BluetoothLEAdvertisement::new()?;
    let filter = BluetoothLEAdvertisementFilter::new()?;
    let uuids = advertisement.ServiceUuids()?;
    let mut scanned = HashSet::<u64>::new();
    let (tx, rx) = mpsc::channel::<u64>();

    uuids.Append(GUID::from(UUID_GATT_SERVICE))?;
    filter.SetAdvertisement(&advertisement)?;
    watcher.SetScanningMode(BluetoothLEScanningMode::Active)?;
    watcher.SetAdvertisementFilter(&filter)?;
    watcher.Received(&TypedEventHandler::new(
        move |_, e: &Option<BluetoothLEAdvertisementReceivedEventArgs>| {
            let e = e.as_ref().unwrap();
            let name = e.Advertisement()?.LocalName()?;
            let address = e.BluetoothAddress()?;

            println!("{}", name);

            if !scanned.contains(&address) {
                tx.send(address).unwrap();
                scanned.insert(address);
            }

            Ok(())
        },
    ))?;

    watcher.Start()?;
    println!("Scanning...");

    tokio::time::sleep(tokio::time::Duration::from_millis(10000)).await;

    watcher.Stop()?;
    println!("Stopped.");

    for received in rx.try_iter() {
        println!("Bluetooth Address: {}", received);

        let ble_device = BluetoothLEDevice::FromBluetoothAddressAsync(received)?.await?;
        let services = ble_device
            .GetGattServicesForUuidAsync(GUID::from(UUID_GATT_SERVICE))?
            .await?;

        println!("Service: {:?}", services.Status());

        let characteristics = services
            .Services()?
            .GetAt(0)?
            .GetCharacteristicsForUuidAsync(GUID::from(UUID_GATT_CHARACTERISTIC))?
            .await?;

        println!("Characteristics: {:?}", characteristics.Status());

        let (tx_listen, rx_listen) = oneshot::channel();
        let listen_task = tokio::spawn(async move {
            let mut rfcomm_listen = RfcommListen {
                tx: Some(tx_listen),
            };
            rfcomm_listen.listen().await.unwrap()
        });

        rx_listen.await;

        let characteristic = characteristics.Characteristics()?.GetAt(0)?;
        let data = characteristic.ReadValueAsync()?.await?.Value()?;
        let message = ibuffer_to_string(&data)?;

        println!("Value: {}", message);

        let json = listen_task.await.unwrap();

        println!("Received: {}", json);

        return Ok(json);
    }

    Ok(String::from("ERROR"))
}

fn ibuffer_to_string(buffer: &IBuffer) -> windows::core::Result<String> {
    // DataReader を使用して IBuffer から読み取る
    let reader = DataReader::FromBuffer(buffer)?;

    // バッファのサイズを取得
    let length = buffer.Length()? as usize;

    // バイトデータを格納するベクトルを用意
    let mut vec = vec![0u8; length];

    // バイトデータをベクトルに読み込む
    reader.ReadBytes(&mut vec)?;

    // UTF-8 として文字列に変換
    let result = String::from_utf8(vec).unwrap();

    Ok(result)
}

struct RfcommListen {
    tx: Option<oneshot::Sender<()>>,
}

impl RfcommListen {
    async fn listen(&mut self) -> windows::core::Result<String> {
        let rfcomm_service_id = RfcommServiceId::FromUuid(GUID::from(UUID_RFCOMM_SERVICE))?;
        let provider = RfcommServiceProvider::CreateAsync(&rfcomm_service_id)?.await?;
        let service_id_str = provider.ServiceId()?.AsString()?;
        let provider = Arc::new(Mutex::new(provider));
        let provider_handler = Arc::clone(&provider);
        // let provider_ref = &provider;
        let listener = StreamSocketListener::new()?;
        let (tx, rx) = oneshot::channel();
        let mut tx = Some(tx);

        listener.ConnectionReceived(&TypedEventHandler::new(
            move |s: &Option<StreamSocketListener>,
                  e: &Option<StreamSocketListenerConnectionReceivedEventArgs>| {
                println!("Connected via RFCOMM");

                let s = s.as_ref().unwrap();
                let e = e.as_ref().unwrap();
                let mut tx = tx.take();

                // Stop advertising/listening so that we're only serving one client
                provider_handler.blocking_lock().StopAdvertising();
                drop(s);

                // データ受信

                let socket = e.Socket()?;
                let local = tokio::task::LocalSet::new();
                let rt = tokio::runtime::Builder::new_current_thread()
                    .enable_all()
                    .build()
                    .unwrap();

                local.spawn_local(async move {
                    let input_stream = socket.InputStream().unwrap();
                    let output_stream = socket.OutputStream().unwrap();
                    let reader = DataReader::CreateDataReader(&input_stream).unwrap();

                    reader.SetByteOrder(ByteOrder::LittleEndian);

                    // 1. 自身のデバイスID(UUID v4)の書き込み

                    let writer = DataWriter::new().unwrap();
                    writer.WriteBytes("19259453-a905-45a6-aeef-93c29b5fc598".as_bytes());
                    let buffer = writer.DetachBuffer().unwrap();

                    output_stream.WriteAsync(&buffer).unwrap().await;
                    output_stream.FlushAsync().unwrap().await;

                    // 2. 文字列サイズの受け取り
                    reader.LoadAsync(4).unwrap().await;
                    let size = reader.ReadInt32().unwrap() as usize;

                    // 3. データ読み取り
                    let mut buffer = vec![0u8; size];
                    reader.LoadAsync(size as u32).unwrap().await.unwrap();
                    reader.ReadBytes(buffer.as_mut_slice()).unwrap();
                    let json = String::from_utf8(buffer).unwrap();

                    // 4.  ACK を返す
                    let writer = DataWriter::new().unwrap();
                    writer.WriteByte(0);
                    let buffer = writer.DetachBuffer().unwrap();

                    output_stream.WriteAsync(&buffer).unwrap().await;
                    output_stream.FlushAsync().unwrap().await; // 必要

                    // 通信完了の通知を行う
                    tx.take().unwrap().send(json).unwrap();
                });

                rt.block_on(local);

                Ok(())
            },
        ))?;
        listener
            .BindServiceNameWithProtectionLevelAsync(
                &service_id_str,
                SocketProtectionLevel::PlainSocket, /* Androidの設定と合わせる */
            )?
            .await?;
        provider.lock().await.StartAdvertising(&listener)?; // 必要

        // Listen開始通知
        self.tx.take().unwrap().send(());

        // 通信終了まで待つ
        Ok(rx.await.unwrap())
    }
}
