use std::sync::Arc;

use napi::{bindgen_prelude::AsyncTask, Env, JsString, JsUndefined, Task};
use napi_derive::napi;
use tokio::{
    sync::{broadcast, mpsc, Mutex},
    task::JoinHandle,
};
use windows::{
    core::{GUID, HSTRING},
    Devices::{
        Bluetooth::{BluetoothCacheMode, BluetoothDevice, Rfcomm::RfcommServiceId},
        Enumeration::DeviceInformation,
    },
    Networking::Sockets::{SocketProtectionLevel, StreamSocket},
    Storage::Streams::{ByteOrder, DataReader, DataWriter},
};

use crate::{error::Error, Result, RUNTIME, UUID_BLUENOTE_RFCOMM};

use super::{SYNC_ALLOWED, SYNC_FAILED, SYNC_SUCCESS};

/// Bluetooth ペアリング済み & Bluenote の UUID をもつデバイスを列挙
pub async fn enumerate_sync_companions() -> windows::core::Result<Vec<String>> {
    let mut device_ids = Vec::<String>::new();

    let selector = BluetoothDevice::GetDeviceSelectorFromPairingState(true)?;
    let devices = DeviceInformation::FindAllAsyncAqsFilter(&selector)?.await?;

    for d in devices {
        println!("Device: {}", d.Name()?.to_string());

        let id = d.Id()?;
        let device = BluetoothDevice::FromIdAsync(&id)?.await?;
        let service_id = RfcommServiceId::FromUuid(GUID::from(UUID_BLUENOTE_RFCOMM))?;
        let rfcomm_services = device
            .GetRfcommServicesForIdWithCacheModeAsync(&service_id, BluetoothCacheMode::Uncached)?
            .await?
            .Services()?;

        if rfcomm_services.Size()? == 0 {
            println!("The device seems not to have Bluenote App");
            continue;
        }

        device_ids.push(id.to_string());
    }

    Ok(device_ids)
}

struct SyncClientState {
    #[allow(dead_code)] // インスタンスを持っておいて、socket が drop して接続が切れないようにする
    socket: Arc<Mutex<StreamSocket>>,
    reader: Arc<Mutex<DataReader>>,
    writer: Arc<Mutex<DataWriter>>,
    tx_finish: Arc<mpsc::Sender<String>>,
    tx_uuid: Arc<broadcast::Sender<String>>,
    handle: JoinHandle<Result<()>>,
}

#[napi]
pub struct SyncClient {
    state: Option<SyncClientState>,
    my_uuid: String,
    companion_device_id: String,
}

/// 同期クライアント
#[napi]
impl SyncClient {
    /// `SyncClient` のインスタンスを生成する
    #[napi(factory)]
    pub fn create_instance(my_uuid: String, companion_device_id: String) -> Self {
        Self {
            state: None,
            my_uuid,
            companion_device_id,
        }
    }

    /// 同期サーバに接続し、その接続の StreamSocket を返す
    async fn connect(companion_device_id: &str) -> Result<StreamSocket> {
        let device = BluetoothDevice::FromIdAsync(&HSTRING::from(companion_device_id))?.await?;
        let service_id = RfcommServiceId::FromUuid(GUID::from(UUID_BLUENOTE_RFCOMM))?;
        let rfcomm_services = device
            .GetRfcommServicesForIdWithCacheModeAsync(&service_id, BluetoothCacheMode::Uncached)?
            .await?
            .Services()?;

        if rfcomm_services.Size()? == 0 {
            return Err(Error::SyncError(format!(
                "The device seems not to have Bluenote App"
            )));
        }

        println!("Connecting...");

        let service = rfcomm_services.GetAt(0)?;
        let socket = StreamSocket::new()?;

        socket
            .ConnectWithProtectionLevelAsync(
                &service.ConnectionHostName()?,
                &service.ConnectionServiceName()?,
                SocketProtectionLevel::BluetoothEncryptionWithAuthentication,
            )?
            .await?;

        println!("Connected!");

        Ok(socket)
    }

    async fn begin_sync_impl(&mut self, sync_enabled_uuids: &Vec<String>) -> Result<()> {
        let socket = Self::connect(&self.companion_device_id).await?;

        let reader = DataReader::CreateDataReader(&socket.InputStream()?)?;
        let writer = DataWriter::CreateDataWriter(&socket.OutputStream()?)?;

        reader.SetByteOrder(ByteOrder::LittleEndian)?;
        writer.SetByteOrder(ByteOrder::LittleEndian)?;

        // 1. UUID を交換し、同期が有効な相手か確認 & 相手の同期の許可を得る
        self.exchange_uuid(&sync_enabled_uuids, &reader, &writer)
            .await?;

        // 2. 同期が許可されたかどうかの確認
        reader.LoadAsync(1)?.await?;
        let response = reader.ReadByte()?;

        if response != SYNC_ALLOWED {
            // todo: 自作の Error 型を使いたい
            return Err(Error::SyncError(format!("Sync not allowed")));
        }

        let (tx_uuid, _) = broadcast::channel(16);
        let (tx_finish, rx_finish) = mpsc::channel::<String>(16);

        let socket = Arc::new(Mutex::new(socket));
        let reader = Arc::new(Mutex::new(reader));
        let writer = Arc::new(Mutex::new(writer));
        let tx_finish = Arc::new(tx_finish);
        let tx_uuid = Arc::new(tx_uuid);

        let reader_response_receiver = Arc::clone(&reader);
        let tx_uuid_response_receiver = Arc::clone(&tx_uuid);
        let socket_closer = Arc::clone(&socket);

        // レスポンスを受信するタスクの起動
        let handle: JoinHandle<Result<()>> = tokio::spawn(async move {
            tokio::select! {
                _ = Self::receive_response(
                    reader_response_receiver,
                    tx_uuid_response_receiver,
                    rx_finish,
                ) => {}
                _ = async {
                    tokio::time::sleep(std::time::Duration::from_secs(60)).await;
                } => {
                    socket_closer.lock().await.Close()?;
                }
            }
            Ok(())
        });

        self.state = Some(SyncClientState {
            socket,
            reader,
            writer,
            tx_finish,
            tx_uuid,
            handle,
        });

        Ok(())
    }

    /// レスポンスを受信し、リクエスト待ちに対して通知を送る
    async fn receive_response(
        reader: Arc<Mutex<DataReader>>,
        tx_uuid: Arc<broadcast::Sender<String>>,
        mut rx_finish: mpsc::Receiver<String>,
    ) -> Result<()> {
        loop {
            // UUID 取得

            let mut buffer = vec![0u8; 36];

            {
                let reader = reader.lock().await;

                reader.LoadAsync(36)?.await?;
                reader.ReadBytes(&mut buffer)?;
            }

            let uuid = match String::from_utf8(buffer) {
                Ok(v) => Ok(v),
                Err(e) => Err(Error::SyncError(format!("{}", e))),
            }?;

            println!("received response uuid: {}", uuid);

            // レスポンスが来たという通知を送る
            tx_uuid.send(uuid.to_owned()).unwrap(); // 一旦 unwrap

            // レスポンスに対する処理完了を待つ
            loop {
                if let Some(finish_id) = rx_finish.recv().await {
                    if finish_id == uuid {
                        break;
                    }
                }
            }

            println!("finish: {}", uuid);
        }
    }

    /// UUID を交換し、同期が有効な相手か確認 & 相手の同期の許可を得る
    async fn exchange_uuid(
        &self,
        sync_enabled_uuids: &Vec<String>, // デバイスそんなに多くならないのでこれでいいっしょ、多分
        reader: &DataReader,
        writer: &DataWriter,
    ) -> Result<()> {
        let (send_result, uuid): (Result<()>, Result<String>) = futures::join!(
            async {
                // 自身のデバイスIDを送信
                writer.WriteString(&HSTRING::from(&self.my_uuid))?;
                writer.StoreAsync()?.await?;
                writer.FlushAsync()?.await?;

                Ok(())
            },
            async {
                // 相手のデバイスの UUID を受信
                reader.LoadAsync(36)?.await?;
                Ok(reader.ReadString(36)?.to_string())
            }
        );

        send_result?;
        let uuid = uuid?;

        sync_enabled_uuids
            .iter()
            .find(|&v| v == &uuid)
            .ok_or(Error::SyncError(format!("Sync not enabled: {}", &uuid)))?;

        Ok(())
    }

    /// 同期を開始する
    #[napi(ts_return_type = "Promise<void>")]
    pub fn begin_sync(&mut self, sync_enabled_uuids: Vec<String>) -> AsyncTask<BeginSyncTask> {
        AsyncTask::new(BeginSyncTask {
            client: self,
            sync_enabled_uuids,
        })
    }

    async fn request_data_impl(&self, request_id: u8, uuid: &Option<String>) -> Result<String> {
        match &self.state {
            Some(state) => {
                println!("request id = {}", request_id);

                // レスポンスを待つ用の受信チャネルを作成
                let mut rx_uuid = state.tx_uuid.subscribe();

                // リクエストの送信
                {
                    let writer = state.writer.lock().await;

                    // 1. リクエスト ID の送信
                    writer.WriteByte(request_id)?;

                    // （必要であれば）UUID の送信
                    if let Some(uuid) = uuid {
                        writer.WriteBytes(uuid.as_bytes())?;
                    }

                    writer.StoreAsync()?.await?;
                    writer.FlushAsync()?.await?;
                }

                println!("request sent");

                // レスポンスを待つ
                // スレッドの更新差分リクエストの時は UUID の代わりに 36 バイトの空白が送られる
                let uuid = match uuid {
                    Some(uuid) => uuid.to_owned(),
                    None => " ".repeat(36).to_owned(),
                };
                {
                    loop {
                        if let Ok(response_id) = rx_uuid.recv().await {
                            if response_id == uuid {
                                break;
                            }
                        }
                    }
                }

                println!("response received");

                let reader = state.reader.lock().await;

                // 2. データサイズ (4バイト) を取得
                reader.LoadAsync(4)?.await?;
                let size = reader.ReadUInt32()?;

                // 3. JSON 文字列の読み込み
                let mut buffer = vec![0u8; size as usize];
                reader.LoadAsync(size)?.await?;
                reader.ReadBytes(&mut buffer)?;

                // レスポンスの処理完了を通知
                state.tx_finish.send(uuid).await.unwrap(); // 一旦 unwrap

                match String::from_utf8(buffer) {
                    Ok(v) => Ok(v),
                    Err(e) => Err(Error::SyncError(format!("{}", e))),
                }
            }
            None => Err(Error::SyncError(format!("Not connected."))),
        }
    }

    /// 同期サーバにメモの更新をリクエストする
    /// データは JSON で返される
    #[napi(ts_return_type = "Promise<string>")]
    pub fn request_data(&self, request_id: u8, uuid: Option<String>) -> AsyncTask<RequestDataTask> {
        AsyncTask::new(RequestDataTask {
            client: self,
            request_id,
            uuid,
        })
    }

    async fn end_sync_impl(&mut self, success: bool) -> Result<()> {
        // state で持っている socket を drop して接続を切る
        match self.state.take() {
            Some(state) => {
                // レスポンス受付タスクを終了

                state.handle.abort();

                // 同期の成功 or 失敗を送信
                {
                    let writer = state.writer.lock().await;

                    writer.WriteByte(if success { SYNC_SUCCESS } else { SYNC_FAILED })?;
                    writer.StoreAsync()?.await?;
                    writer.FlushAsync()?.await?;
                }

                if success {
                    // 相手がデータを読むまでに切断してしまうと、こちらから送った
                    // 同期の成功可否が届かないことがあるため、相手からの ACK を
                    // 待つという体で、相手が切断するのを待つ

                    let _: Result<()> = async {
                        let reader = state.reader.lock().await;
                        reader.LoadAsync(1)?.await?;
                        Ok(())
                    }
                    .await;
                }

                Ok(())
            }
            None => Err(Error::SyncError(format!("Sync not started."))),
        }
    }

    /// 同期の成功・失敗を送信し、接続を終了する
    #[napi(ts_return_type = "Promise<void>")]
    pub fn end_sync(&mut self, success: bool) -> AsyncTask<EndSyncTask> {
        AsyncTask::new(EndSyncTask {
            client: self,
            success,
        })
    }
}

impl Drop for SyncClient {
    fn drop(&mut self) {
        if let Some(state) = self.state.take() {
            state.handle.abort();
        }
    }
}

pub struct BeginSyncTask<'a> {
    client: &'a mut SyncClient,
    sync_enabled_uuids: Vec<String>,
}

impl<'a> Task for BeginSyncTask<'a> {
    type Output = ();
    type JsValue = JsUndefined;

    fn compute(&mut self) -> napi::Result<Self::Output> {
        Ok(RUNTIME.block_on(self.client.begin_sync_impl(&self.sync_enabled_uuids))?)
    }

    fn resolve(&mut self, env: Env, _: Self::Output) -> napi::Result<Self::JsValue> {
        env.get_undefined()
    }
}

pub struct RequestDataTask<'a> {
    client: &'a SyncClient,
    request_id: u8,
    uuid: Option<String>,
}

impl<'a> Task for RequestDataTask<'a> {
    type Output = String;
    type JsValue = JsString;

    fn compute(&mut self) -> napi::Result<Self::Output> {
        Ok(RUNTIME.block_on(self.client.request_data_impl(self.request_id, &self.uuid))?)
    }

    fn resolve(&mut self, env: Env, json: Self::Output) -> napi::Result<Self::JsValue> {
        env.create_string(&json)
    }
}

pub struct EndSyncTask<'a> {
    client: &'a mut SyncClient,
    success: bool,
}

impl<'a> Task for EndSyncTask<'a> {
    type Output = ();
    type JsValue = JsUndefined;

    fn compute(&mut self) -> napi::Result<Self::Output> {
        Ok(RUNTIME.block_on(self.client.end_sync_impl(self.success))?)
    }

    fn resolve(&mut self, env: Env, _: Self::Output) -> napi::Result<Self::JsValue> {
        env.get_undefined()
    }
}
