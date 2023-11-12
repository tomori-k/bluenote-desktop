use napi::{bindgen_prelude::AsyncTask, Env, JsString, JsUndefined, Task};
use napi_derive::napi;
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

use super::{PROTOCOL_VERSION, SYNC_ALLOWED, SYNC_FAILED, SYNC_SUCCESS};

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
    socket: StreamSocket,
    reader: DataReader,
    writer: DataWriter,
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

    async fn begin_sync_impl(&mut self) -> Result<()> {
        let socket = Self::connect(&self.companion_device_id).await?;

        let reader = DataReader::CreateDataReader(&socket.InputStream()?)?;
        let writer = DataWriter::CreateDataWriter(&socket.OutputStream()?)?;

        reader.SetByteOrder(ByteOrder::LittleEndian)?;
        writer.SetByteOrder(ByteOrder::LittleEndian)?;

        // 1. プロトコルバージョンのチェック
        reader.LoadAsync(4)?.await?;
        let version = reader.ReadUInt32()?;

        writer.WriteUInt32(PROTOCOL_VERSION)?;
        writer.StoreAsync()?.await?;
        writer.FlushAsync()?.await?;

        if version != PROTOCOL_VERSION {
            return Err(Error::SyncError(format!(
                "The companion uses different protocol: {}",
                version
            )));
        }

        // 2. UUID の送信
        writer.WriteBytes(self.my_uuid.as_bytes())?;
        writer.StoreAsync()?.await?;
        writer.FlushAsync()?.await?;

        // 3. 同期が許可されたかどうかの確認
        reader.LoadAsync(1)?.await?;
        let response = reader.ReadByte()?;

        if response != SYNC_ALLOWED {
            // todo: 自作の Error 型を使いたい
            return Err(Error::SyncError(format!("Sync not allowed")));
        }

        self.state = Some(SyncClientState {
            socket,
            reader,
            writer,
        });

        Ok(())
    }

    /// 同期を開始する
    #[napi(ts_return_type = "Promise<void>")]
    pub fn begin_sync(&mut self) -> AsyncTask<BeginSyncTask> {
        AsyncTask::new(BeginSyncTask { client: self })
    }

    async fn request_data_impl(&self, request_id: u8, uuid: &Option<String>) -> Result<String> {
        match &self.state {
            Some(state) => {
                // 1. リクエスト ID の送信
                state.writer.WriteByte(request_id)?;

                // （必要であれば）UUID の送信
                if let Some(uuid) = uuid {
                    state.writer.WriteBytes(uuid.as_bytes())?;
                }

                state.writer.StoreAsync()?.await?;
                state.writer.FlushAsync()?.await?;

                // 2. データサイズ (4バイト) を取得
                state.reader.LoadAsync(4)?.await?;
                let size = state.reader.ReadUInt32()?;

                // 3. JSON 文字列の読み込み
                let mut buffer = vec![0u8; size as usize];
                state.reader.LoadAsync(size)?.await?;
                state.reader.ReadBytes(&mut buffer)?;

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
        match self.state.take() {
            Some(state) => {
                // 同期の成功 or 失敗を送信
                state
                    .writer
                    .WriteByte(if success { SYNC_SUCCESS } else { SYNC_FAILED })?;
                state.writer.StoreAsync()?.await?;
                state.writer.FlushAsync()?.await?;

                if success {
                    // 相手側の DB 更新のACKを受信
                    state.reader.LoadAsync(1)?.await?;
                    let ack = state.reader.ReadByte()?;

                    match ack {
                        SYNC_SUCCESS => Ok(()),
                        // 相手側が DB の保存に失敗した
                        // 同期時刻の保存に失敗した=次回の同期に少し無駄が生じる
                        // まああまり問題ではない
                        _ => Err(Error::SyncError(format!(
                            "The sync companion responded an error: {}",
                            ack
                        ))),
                    }
                } else {
                    // 同期エラーのときはエラー通知をして接続を終了
                    Ok(())
                }
            }
            None => Ok(()),
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

pub struct BeginSyncTask<'a> {
    client: &'a mut SyncClient,
}

impl<'a> Task for BeginSyncTask<'a> {
    type Output = ();
    type JsValue = JsUndefined;

    fn compute(&mut self) -> napi::Result<Self::Output> {
        Ok(RUNTIME.block_on(self.client.begin_sync_impl())?)
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
