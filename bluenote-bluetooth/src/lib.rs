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
static UUID_RFCOMM_SERVICE_SYNC_INIT: &str = "c144d029-2a62-4cfc-b39c-ca6ce173cb3f";

static SYNC_SERVER: SyncServer = SyncServer {
    inner: Mutex::new(None),
    request_updates: Mutex::new(None),
    tx: Mutex::new(None),
};
static SYNC_REQUEST_LISTENER: SyncRequestListener = SyncRequestListener {
    inner: Mutex::new(None),
    on_sync_enabled: Mutex::new(None),
};

static PAIRING: Pairing = Pairing {
    tx_accept: Mutex::new(None),
    request_accept: Mutex::new(None),
    on_sync_enabled: Mutex::new(None),
};

static BLUETOOTH_SCANNER: BluetoothScanner = BluetoothScanner {
    watcher: Mutex::new(None),
    on_added: Mutex::new(None),
};

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

#[napi(ts_return_type = "Promise<void>")]
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

#[napi]
pub fn listen_sync_request(my_uuid: String) -> AsyncTask<SyncRequestListenerStartTask> {
    AsyncTask::new(SyncRequestListenerStartTask { my_uuid })
}

#[napi]
pub fn stop_listen_sync_request() -> Result<()> {
    match SYNC_REQUEST_LISTENER.stop() {
        Ok(_) => Ok(()),
        Err(e) => Err(napi::Error::from_reason(e.message().to_string())),
    }
}

#[napi(
    ts_args_type = "callback: (err: null | Error, deviceName: string, deviceId: string) => void"
)]
pub fn set_on_bluetooth_device_found(callback: JsFunction) -> Result<()> {
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

#[napi(ts_args_type = "callback: (err: null | Error, deviceName: string, pin: string) => void")]
pub fn set_on_bond_requested(callback: JsFunction) -> Result<()> {
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

#[napi(
    ts_args_type = "callback: (err: null | Error, deviceName: string, deviceUuid: string) => void"
)]
pub fn set_on_sync_enabled(callback: JsFunction) -> Result<()> {
    // wwww
    let tsfn1 = callback.create_threadsafe_function(
        0,
        |ctx: ThreadSafeCallContext<(String, String)>| {
            vec![ctx.value.0, ctx.value.1]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        },
    )?;
    let tsfn2 = callback.create_threadsafe_function(
        0,
        |ctx: ThreadSafeCallContext<(String, String)>| {
            vec![ctx.value.0, ctx.value.1]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        },
    )?;

    let mut callback1 = SYNC_REQUEST_LISTENER.on_sync_enabled.lock().unwrap();
    let mut callback2 = PAIRING.on_sync_enabled.lock().unwrap();

    *callback1 = Some(tsfn1);
    *callback2 = Some(tsfn2);

    Ok(())
}

// デバイス<UUID> から更新分の送信リクエストが来た時のコールバックを設定
#[napi(ts_args_type = "callback: (err: null | Error, uuid: string) => void")]
pub fn set_on_note_updates_requested(callback: JsFunction) -> Result<()> {
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

// -> request_sync_init
#[napi(ts_return_type = "Promise<void>")]
pub fn request_sync(windows_device_id: String, my_uuid: String) -> AsyncTask<PairTask> {
    AsyncTask::new(PairTask {
        windows_device_id,
        my_uuid,
    })
}

#[napi]
pub fn respond_to_bond_request(accept: bool) {
    let mut tx = PAIRING.tx_accept.lock().unwrap();

    if let Some(tx) = tx.take() {
        tx.send(accept).unwrap();
    }
}

// 更新分の送信リクエストに対する返信用関数
#[napi]
pub fn respond_to_note_updates_request(json: Option<String>) -> Result<()> {
    let mut tx = SYNC_SERVER.tx.lock().unwrap();

    if let Some(tx) = tx.take() {
        tx.send(json).unwrap();
    }

    Ok(())
}

#[napi(ts_return_type = "Promise<string[]>")]
pub fn fetch_note_updates_from_nearby_devices(my_uuid: String) -> AsyncTask<SyncTask> {
    AsyncTask::new(SyncTask { uuid: my_uuid })
}

struct SyncRequestListnerState {
    my_device_uuid: String,
    listener: StreamSocketListener,
    provider: RfcommServiceProvider,
}

struct SyncRequestListener {
    inner: Mutex<Option<SyncRequestListnerState>>,
    on_sync_enabled: Mutex<Option<ThreadsafeFunction<(String, String)>>>,
}

impl SyncRequestListener {
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

        let my_uuid = self
            .inner
            .lock()
            .unwrap()
            .as_ref()
            .unwrap()
            .my_device_uuid
            .to_owned();
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
            // 自身のデバイスIDを送信

            writer.WriteString(&HSTRING::from(my_uuid))?;
            writer.StoreAsync()?.await?;
            writer.FlushAsync()?.await?;

            // 相手のデバイスの UUID を受信

            reader.LoadAsync(36)?.await?;
            let uuid = reader.ReadString(36)?.to_string();

            println!("UUID: {}", uuid);

            // ACK 送信

            writer.WriteByte(0)?;
            writer.StoreAsync()?.await?;
            writer.FlushAsync()?.await?;

            // ACK 受信

            reader.LoadAsync(1)?.await?;
            reader.ReadByte()?;

            let device =
                BluetoothDevice::FromHostNameAsync(&socket.Information()?.RemoteHostName()?)?
                    .await?;
            let device_name = device.Name()?.to_string();

            if let Some(on_sync_enabled) = self.on_sync_enabled.lock().unwrap().as_ref() {
                on_sync_enabled.call(
                    Ok((device_name, uuid)),
                    napi::threadsafe_function::ThreadsafeFunctionCallMode::NonBlocking,
                );
            }

            drop(socket);

            println!("Connection closed.");

            Ok::<(), windows::core::Error>(())
        });

        rt.block_on(local);

        Ok(())
    }

    async fn start(&'static self, device_uuid: String) -> windows::core::Result<()> {
        let mut inner = self.inner.lock().unwrap();

        if inner.is_some() {
            return Ok(());
        }

        let rfcomm_service_id =
            RfcommServiceId::FromUuid(GUID::from(UUID_RFCOMM_SERVICE_SYNC_INIT))?;
        let provider = RfcommServiceProvider::CreateAsync(&rfcomm_service_id)?.await?;
        let listener = StreamSocketListener::new()?;

        *inner = Some(SyncRequestListnerState {
            my_device_uuid: device_uuid,
            listener,
            provider,
        });

        let listener = &inner.as_ref().unwrap().listener;
        let provider = &inner.as_ref().unwrap().provider;

        listener.ConnectionReceived(&TypedEventHandler::new(|s, e| self.on_received(s, e)))?;
        listener
            .BindServiceNameWithProtectionLevelAsync(
                &provider.ServiceId()?.AsString()?,
                SocketProtectionLevel::BluetoothEncryptionWithAuthentication, /* Androidの設定と合わせる */
            )?
            .await?;

        provider.StartAdvertisingWithRadioDiscoverability(listener, true)?; // 必要

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

pub struct SyncRequestListenerStartTask {
    my_uuid: String,
}

impl Task for SyncRequestListenerStartTask {
    type Output = ();
    type JsValue = JsUndefined;

    fn compute(&mut self) -> Result<Self::Output> {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        let future = SYNC_REQUEST_LISTENER.start(self.my_uuid.to_owned());

        match rt.block_on(future) {
            Ok(_) => Ok(()),
            Err(e) => Err(napi::Error::from_reason(e.message().to_string())),
        }
    }

    fn resolve(&mut self, env: Env, _: Self::Output) -> Result<Self::JsValue> {
        env.get_undefined()
    }
}

// ↑↑↑

struct SyncServerState {
    listener: StreamSocketListener,
    provider: RfcommServiceProvider,
}

struct SyncServer {
    inner: Mutex<Option<SyncServerState>>,
    request_updates: Mutex<Option<ThreadsafeFunction<String>>>,
    tx: Mutex<Option<oneshot::Sender<Option<String>>>>,
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

            if let Some(json) = json {
                // JSON 書き込み
                let json = json.as_bytes();

                writer.WriteUInt32(json.len() as u32)?;
                writer.WriteBytes(json)?;
                writer.StoreAsync()?.await?;
                writer.FlushAsync()?.await?;
            } else {
                // 拒否
                // 0 を送信する
                writer.WriteUInt32(0)?;
                writer.StoreAsync()?.await?;
                writer.FlushAsync()?.await?;
            }

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

async fn _sync(uuid: &str) -> windows::core::Result<Vec<String>> {
    let selector = BluetoothDevice::GetDeviceSelectorFromPairingState(true)?;
    let devices = DeviceInformation::FindAllAsyncAqsFilter(&selector)?.await?;
    let mut note_jsons = Vec::<String>::new();

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

            note_jsons.push(json.to_string());

            writer.WriteByte(0)?;
            writer.StoreAsync()?.await?;
            writer.FlushAsync()?.await?;
        }
        println!("Connection closed.");
    }

    if note_jsons.len() == 0 {
        println!("No bonded devices found.");
    }

    Ok(note_jsons)
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
            Ok(note_jsons) => Ok(note_jsons),
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
    on_sync_enabled: Mutex<Option<ThreadsafeFunction<(String, String)>>>,
}

impl Pairing {
    async fn pair(
        &'static self,
        windows_device_id: &str,
        device_uuid: &str,
    ) -> windows::core::Result<()> {
        let bluetooth_device =
            BluetoothDevice::FromIdAsync(&HSTRING::from(windows_device_id))?.await?;
        let rfcomm_services = bluetooth_device
            .GetRfcommServicesForIdWithCacheModeAsync(
                &RfcommServiceId::FromUuid(GUID::from(UUID_RFCOMM_SERVICE_SYNC_INIT))?,
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

                if result.Status()? != DevicePairingResultStatus::Paired {
                    return Ok(()); // 全然 OK じゃないけどとりあえず OK にしとく
                }
            }

            let service = rfcomm_services.Services()?.GetAt(0)?;
            let device_name = bluetooth_device.Name()?.to_string();
            let uuid: String;

            println!("{}", device_name);

            {
                let socket = StreamSocket::new()?;

                socket
                    .ConnectWithProtectionLevelAsync(
                        &service.ConnectionHostName()?,
                        &service.ConnectionServiceName()?,
                        SocketProtectionLevel::BluetoothEncryptionWithAuthentication,
                    )?
                    .await?;

                println!("Connected!");

                let writer = DataWriter::CreateDataWriter(&socket.OutputStream()?)?;
                let reader = DataReader::CreateDataReader(&socket.InputStream()?)?;

                writer.SetByteOrder(ByteOrder::LittleEndian)?;
                reader.SetByteOrder(ByteOrder::LittleEndian)?;

                // 自身のデバイスIDを送信

                writer.WriteString(&HSTRING::from(device_uuid))?;
                writer.StoreAsync()?.await?;
                writer.FlushAsync()?.await?;

                // 相手のデバイスの UUID を受信

                reader.LoadAsync(36)?.await?;
                uuid = reader.ReadString(36)?.to_string();

                println!("UUID: {}", uuid);

                // ACK 送信

                writer.WriteByte(0)?;
                writer.StoreAsync()?.await?;
                writer.FlushAsync()?.await?;

                // ACK 受信

                reader.LoadAsync(1)?.await?;
                reader.ReadByte()?;
            }

            println!("Connection closed.");

            if let Some(on_sync_enabled) = self.on_sync_enabled.lock().unwrap().as_ref() {
                on_sync_enabled.call(
                    Ok((device_name, uuid)),
                    napi::threadsafe_function::ThreadsafeFunctionCallMode::NonBlocking,
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
    windows_device_id: String,
    my_uuid: String,
}

impl Task for PairTask {
    type Output = ();
    type JsValue = JsUndefined;

    fn compute(&mut self) -> Result<Self::Output> {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        let future = PAIRING.pair(&self.windows_device_id, &self.my_uuid);

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
