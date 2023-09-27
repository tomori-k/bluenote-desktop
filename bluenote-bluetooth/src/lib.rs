// #![deny(clippy::all)]

// #[macro_use]
// extern crate napi_derive;

use napi::threadsafe_function::{ThreadSafeCallContext, ThreadsafeFunction};
use napi::{bindgen_prelude::*, JsUndefined};
use napi_derive::napi;
use std::sync::Mutex;
use tokio::sync::oneshot;
use windows::core::{h, GUID, HRESULT, HSTRING};
use windows::Devices::Bluetooth::Rfcomm::*;
use windows::Devices::Bluetooth::*;
use windows::Devices::Enumeration::{
    DeviceInformation, DeviceInformationCustomPairing, DeviceInformationKind, DevicePairingKinds,
    DevicePairingProtectionLevel, DevicePairingRequestedEventArgs, DevicePairingResultStatus,
    DeviceWatcher,
};
use windows::Foundation::TypedEventHandler;
use windows::Networking::Sockets::*;
use windows::Storage::Streams::{ByteOrder, DataReader, DataWriter};

static UUID_RFCOMM_SERVICE: &str = "41f4bde2-0492-4bf5-bae2-4451be148999";

static SYNC_SERVER: SyncServer = SyncServer {
    inner: Mutex::new(None),
    request_updates: Mutex::new(None),
    tx: Mutex::new(None),
};

static PAIRING: Pairing = Pairing {
    tx_accept: Mutex::new(None),
    request_accept: Mutex::new(None),
};

static BLUETOOTH_SCANNER: BluetoothScanner = BluetoothScanner {
    watcher: Mutex::new(None),
    on_added: Mutex::new(None),
};

#[napi]
pub fn start_sync_server() -> AsyncTask<SyncServerStartTask> {
    AsyncTask::new(SyncServerStartTask {})
}

#[napi]
pub fn stop_sync_server() -> Result<()> {
    match SYNC_SERVER.stop() {
        Ok(_) => Ok(()),
        Err(e) => Err(napi::Error::from_reason(e.message().to_string())),
    }
}

// デバイス<UUID> から更新分の送信リクエストが来た時のコールバックを設定
#[napi(ts_args_type = "callback: (err: null | Error, uuid: string) => void")]
pub fn set_on_updates_requested(callback: JsFunction) -> Result<()> {
    let tsfn = callback.create_threadsafe_function(0, |ctx: ThreadSafeCallContext<String>| {
        vec![ctx.value]
            .iter()
            .map(|x| ctx.env.create_string(&x))
            .collect()
    })?;

    let mut request_updates = SYNC_SERVER.request_updates.lock().unwrap();
    *request_updates = Some(tsfn);

    Ok(())
}

// 更新分の送信リクエストに対する返信用関数
#[napi]
pub fn pass_updates(json: String) -> Result<()> {
    let mut tx = SYNC_SERVER.tx.lock().unwrap();

    if let Some(tx) = tx.take() {
        tx.send(json).unwrap();
    }

    Ok(())
}

#[napi]
pub fn sync(device_id: String) -> AsyncTask<SyncTask> {
    AsyncTask::new(SyncTask { uuid: device_id })
}

// bond?

#[napi]
pub fn pair(device_id: String) -> AsyncTask<PairTask> {
    AsyncTask::new(PairTask {
        device_id: device_id,
    })
}

#[napi]
pub fn respond_to_pair_request(accept: bool) {
    let mut tx = PAIRING.tx_accept.lock().unwrap();

    if let Some(tx) = tx.take() {
        tx.send(accept).unwrap();
    }
}

#[napi(
    ts_args_type = "callback: (err: null | Error, deviceName: string, deviceId: string) => void"
)]
pub fn set_on_found(callback: JsFunction) -> Result<()> {
    let tsfn = callback.create_threadsafe_function(
        0,
        |ctx: ThreadSafeCallContext<(String, String)>| {
            vec![ctx.value.0, ctx.value.1]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        },
    )?;

    let mut on_found = BLUETOOTH_SCANNER.on_added.lock().unwrap();
    *on_found = Some(tsfn);

    Ok(())
}

#[napi]
pub fn start_bluetooth_scan() -> Result<()> {
    match BLUETOOTH_SCANNER.start() {
        Ok(_) => Ok(()),
        Err(e) => Err(napi::Error::from_reason(e.message().to_string())),
    }
}

#[napi]
pub fn stop_bluetooth_scan() -> Result<()> {
    match BLUETOOTH_SCANNER.stop() {
        Ok(_) => Ok(()),
        Err(e) => Err(napi::Error::from_reason(e.message().to_string())),
    }
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

    let mut callback = PAIRING.request_accept.lock().unwrap();
    *callback = Some(tsfn);

    Ok(())
}

// ↑↑↑

struct SyncServerState {
    listener: StreamSocketListener,
    provider: RfcommServiceProvider,
}

struct SyncServer {
    inner: Mutex<Option<SyncServerState>>,
    request_updates: Mutex<Option<ThreadsafeFunction<String>>>,
    tx: Mutex<Option<oneshot::Sender<String>>>,
}

impl SyncServer {
    fn on_received(
        &'static self,
        _: &Option<StreamSocketListener>,
        e: &Option<StreamSocketListenerConnectionReceivedEventArgs>,
    ) -> windows::core::Result<()> {
        println!(
            "Connected to: {}",
            e.as_ref()
                .unwrap()
                .Socket()?
                .Information()?
                .RemoteHostName()?
                .DisplayName()?
        );

        let socket = e.as_ref().unwrap().Socket()?;
        let input_stream = socket.InputStream().unwrap();
        let output_stream = socket.OutputStream().unwrap();
        let reader = DataReader::CreateDataReader(&input_stream)?;
        let writer = DataWriter::CreateDataWriter(&output_stream)?;
        let local = tokio::task::LocalSet::new();
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();

        reader.SetByteOrder(ByteOrder::LittleEndian)?;
        writer.SetByteOrder(ByteOrder::LittleEndian)?;

        local.spawn_local(async move {
            reader.LoadAsync(36)?.await?;
            let uuid = reader.ReadString(36)?.to_string();

            println!("UUID: {}", uuid);

            // 更新分を JS 側から取得

            let (tx, rx) = oneshot::channel();
            {
                let mut tx_self = self.tx.lock().unwrap();
                *tx_self = Some(tx);
            }

            if let Some(request_updates) = self.request_updates.lock().unwrap().as_ref() {
                request_updates.call(
                    Ok(uuid),
                    napi::threadsafe_function::ThreadsafeFunctionCallMode::NonBlocking,
                );
            }

            let json = rx.await.unwrap();

            // JSON 書き込み
            let json = json.as_bytes();

            writer.WriteUInt32(json.len() as u32)?;
            writer.WriteBytes(json)?;
            writer.StoreAsync()?.await?;
            writer.FlushAsync()?.await?;

            // ACK 読み取り
            reader.LoadAsync(1)?.await?;
            reader.ReadByte()?;

            drop(socket);

            println!("Connection closed.");

            Ok::<(), windows::core::Error>(())
        });

        rt.block_on(local);

        Ok(())
    }

    async fn start(&'static self) -> windows::core::Result<()> {
        let mut inner = self.inner.lock().unwrap();

        if inner.is_some() {
            return Ok(());
        }

        let rfcomm_service_id = RfcommServiceId::FromUuid(GUID::from(UUID_RFCOMM_SERVICE))?;
        let provider = RfcommServiceProvider::CreateAsync(&rfcomm_service_id)?.await?;
        let listener = StreamSocketListener::new()?;

        *inner = Some(SyncServerState { listener, provider });

        let listener = &inner.as_ref().unwrap().listener;
        let provider = &inner.as_ref().unwrap().provider;

        listener.ConnectionReceived(&TypedEventHandler::new(|s, e| self.on_received(s, e)))?;
        listener
            .BindServiceNameWithProtectionLevelAsync(
                &provider.ServiceId()?.AsString()?,
                SocketProtectionLevel::PlainSocket, /* Androidの設定と合わせる */
            )?
            .await?;

        provider.StartAdvertising(listener)?; // 必要

        Ok(())
    }

    fn stop(&self) -> windows::core::Result<()> {
        let mut inner = self.inner.lock().unwrap();

        if let Some(state) = inner.as_ref() {
            state.provider.StopAdvertising()?;
            *inner = None;
        }

        Ok(())
    }
}

pub struct SyncServerStartTask {}

impl Task for SyncServerStartTask {
    type Output = ();
    type JsValue = JsUndefined;

    fn compute(&mut self) -> Result<Self::Output> {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        let future = SYNC_SERVER.start();

        match rt.block_on(future) {
            Ok(_) => Ok(()),
            Err(e) => Err(napi::Error::from_reason(e.message().to_string())),
        }
    }

    fn resolve(&mut self, env: Env, _: Self::Output) -> Result<Self::JsValue> {
        env.get_undefined()
    }
}

// ↓↓↓

async fn _sync(uuid: &str) -> windows::core::Result<()> {
    let selector = BluetoothDevice::GetDeviceSelectorFromPairingState(true)?;
    let devices = DeviceInformation::FindAllAsyncAqsFilter(&selector)?.await?;
    let mut synced = 0;

    for d in devices {
        let device = BluetoothDevice::FromIdAsync(&d.Id()?)?.await?;
        let service_id = RfcommServiceId::FromUuid(GUID::from(UUID_RFCOMM_SERVICE))?;
        let rfcomm_services = device
            .GetRfcommServicesForIdWithCacheModeAsync(&service_id, BluetoothCacheMode::Uncached)?
            .await?
            .Services()?;

        if rfcomm_services.Size()? == 0 {
            continue;
        }

        println!("{}", device.Name()?);

        let service = rfcomm_services.GetAt(0)?;
        {
            let socket = StreamSocket::new()?;

            socket
                .ConnectWithProtectionLevelAsync(
                    &service.ConnectionHostName()?,
                    &service.ConnectionServiceName()?,
                    SocketProtectionLevel::PlainSocket,
                )?
                .await?;

            // The socket is connected. At this point the App can wait for
            // the user to take some action, for example, click a button to send a
            // file to the device, which could invoke the Picker and then
            // send the picked file. The transfer itself would use the
            // Sockets API and not the Rfcomm API, and so is omitted here for
            // brevity.

            println!("Connected!");

            let writer = DataWriter::CreateDataWriter(&socket.OutputStream()?)?;
            let reader = DataReader::CreateDataReader(&socket.InputStream()?)?;

            writer.SetByteOrder(ByteOrder::LittleEndian)?;
            reader.SetByteOrder(ByteOrder::LittleEndian)?;

            writer.WriteBytes(uuid.as_bytes())?;
            writer.StoreAsync()?.await?;
            writer.FlushAsync()?.await?;

            reader.LoadAsync(4)?.await?;
            let size = reader.ReadUInt32()?;
            reader.LoadAsync(size)?.await?;
            let json = reader.ReadString(size)?;

            println!("Received: {}", json);

            writer.WriteByte(0)?;
            writer.StoreAsync()?.await?;
            writer.FlushAsync()?.await?;
        }
        println!("Connection closed.");
        synced += 1;
    }

    if synced == 0 {
        println!("No bonded devices found.");
    }

    Ok(())
}

pub struct SyncTask {
    uuid: String,
}

impl Task for SyncTask {
    type Output = Vec<String>;
    type JsValue = Array;

    fn compute(&mut self) -> Result<Self::Output> {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        let future = _sync(&self.uuid);

        match rt.block_on(future) {
            Ok(_) => Ok(vec!["[]".to_string()]),
            Err(e) => Err(napi::Error::from_reason(e.message().to_string())),
        }
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
        let mut array = env.create_array(output.len() as u32)?;

        for i in 0..output.len() {
            array.set(i as u32, env.create_string(&output[i]))?;
        }

        Ok(array)
    }
}

struct Pairing {
    tx_accept: Mutex<Option<oneshot::Sender<bool>>>,
    request_accept: Mutex<Option<ThreadsafeFunction<(String, String)>>>,
}

impl Pairing {
    async fn pair(&'static self, device_id: &str) -> windows::core::Result<()> {
        let bluetooth_device = BluetoothDevice::FromIdAsync(&HSTRING::from(device_id))?.await?;
        let rfcomm_services = bluetooth_device
            .GetRfcommServicesForIdWithCacheModeAsync(
                &RfcommServiceId::FromUuid(GUID::from(UUID_RFCOMM_SERVICE))?,
                BluetoothCacheMode::Uncached,
            )?
            .await?;

        // 特定のサービスIDをもっているデバイスのみ対象
        if rfcomm_services.Services()?.Size()? > 0 {
            let pairing = bluetooth_device.DeviceInformation()?.Pairing()?;
            let is_paired = pairing.IsPaired()?;

            println!("{}", if is_paired { "Paired" } else { "Not Paired" });

            if !is_paired {
                let custom_pairing = pairing.Custom()?;
                custom_pairing.PairingRequested(&TypedEventHandler::new(|s, e| {
                    self.on_pairing_requested(s, e)
                }))?;

                let result = custom_pairing
                    .PairWithProtectionLevelAsync(
                        DevicePairingKinds::ConfirmPinMatch,
                        DevicePairingProtectionLevel::Default,
                    )?
                    .await?;

                println!(
                    "Pairing result: {}",
                    if result.Status()? == DevicePairingResultStatus::Paired {
                        "Success"
                    } else {
                        "Failed"
                    }
                );
            }
        } else {
            println!("Device seems not to have Bluenote app.");
        }

        Ok(())
    }

    fn on_pairing_requested(
        &'static self,
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
            let mut tx_accept = self.tx_accept.lock().unwrap();

            if tx_accept.is_some() {
                // 別のデバイスのペアリング中
                // もしくはなにもせずに return (=ペアリング拒否) もあり？
                return Err(windows::core::Error::new(
                    HRESULT(0x80004004u32 as i32),
                    h!("Another device is pairing.").to_owned(),
                ));
            }

            let tx: oneshot::Sender<bool>;

            (tx, rx) = oneshot::channel();
            *tx_accept = Some(tx);
        }

        let device_name = e.DeviceInformation()?.Name()?.to_string();
        let pin = e.Pin()?.to_string();

        println!("PIN: {}", pin);

        let request_accept = self.request_accept.lock().unwrap();

        if let Some(request_accept) = &*request_accept {
            request_accept.call(
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
}

pub struct PairTask {
    device_id: String,
}

impl Task for PairTask {
    type Output = ();
    type JsValue = JsUndefined;

    fn compute(&mut self) -> Result<Self::Output> {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        let future = PAIRING.pair(&self.device_id);

        match rt.block_on(future) {
            Ok(_) => Ok(()),
            Err(e) => Err(napi::Error::from_reason(e.message().to_string())),
        }
    }

    fn resolve(&mut self, env: Env, _: Self::Output) -> Result<Self::JsValue> {
        env.get_undefined()
    }
}

struct BluetoothScanner {
    watcher: Mutex<Option<DeviceWatcher>>,
    on_added: Mutex<Option<ThreadsafeFunction<(String, String)>>>,
}

impl BluetoothScanner {
    fn start(&'static self) -> windows::core::Result<()> {
        let mut watcher = self.watcher.lock().unwrap();

        if watcher.is_some() {
            return Ok(());
        }

        let w = DeviceInformation::CreateWatcherWithKindAqsFilterAndAdditionalProperties(
            h!("(System.Devices.Aep.ProtocolId:=\"{e0cbf06c-cd8b-4647-bb8a-263b43f0f974}\")"),
            None,
            DeviceInformationKind::AssociationEndpoint,
        )?;

        w.Added(&TypedEventHandler::new(|s, e| self.on_added(s, e)))?;
        w.Start()?;

        *watcher = Some(w);

        Ok(())
    }

    fn stop(&self) -> windows::core::Result<()> {
        let mut watcher = self.watcher.lock().unwrap();

        if let Some(watcher) = watcher.take() {
            watcher.Stop()?;
        }

        Ok(())
    }

    fn on_added(
        &'static self,
        _: &Option<DeviceWatcher>,
        info: &Option<DeviceInformation>,
    ) -> windows::core::Result<()> {
        let info = info.as_ref().unwrap();
        let name = info.Name()?.to_string();
        let id = info.Id()?.to_string();

        let on_added = self.on_added.lock().unwrap();

        if let Some(on_added) = &*on_added {
            on_added.call(
                Ok((name, id)),
                napi::threadsafe_function::ThreadsafeFunctionCallMode::NonBlocking,
            );
        }

        Ok(())
    }
}
