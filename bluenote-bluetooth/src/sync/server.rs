use crate::{
    sync::{async_reader::AsyncReader, async_writer::AsyncWriter},
    NonBlockingThreadsafeFunctionWithReturn, Result, RUNTIME, UUID_BLUENOTE_RFCOMM,
};
use async_trait::async_trait;
use std::{sync::Mutex, time::Duration};
use tokio::{
    io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt},
    task::LocalSet,
};
use windows::{
    core::GUID,
    Devices::Bluetooth::Rfcomm::{RfcommServiceId, RfcommServiceProvider},
    Foundation::TypedEventHandler,
    Networking::Sockets::{
        SocketProtectionLevel, StreamSocketListener,
        StreamSocketListenerConnectionReceivedEventArgs,
    },
};

static SERVER_STATE: Mutex<Option<SyncServerState>> = Mutex::new(None);
pub static SYNC_SERVICE: SyncServiceImpl = SyncServiceImpl {
    on_sync_requested: NonBlockingThreadsafeFunctionWithReturn::new(),
    on_now_requested: NonBlockingThreadsafeFunctionWithReturn::new(),
    on_thread_updates_requested: NonBlockingThreadsafeFunctionWithReturn::new(),
    on_all_notes_in_thread_requested: NonBlockingThreadsafeFunctionWithReturn::new(),
    on_all_notes_in_tree_requested: NonBlockingThreadsafeFunctionWithReturn::new(),
    on_note_updates_in_thread_requested: NonBlockingThreadsafeFunctionWithReturn::new(),
    on_note_updates_in_tree_requested: NonBlockingThreadsafeFunctionWithReturn::new(),
    on_update_synced_at_requested: NonBlockingThreadsafeFunctionWithReturn::new(),
    on_my_uuid_requested: NonBlockingThreadsafeFunctionWithReturn::new(),
};

struct SyncServerState {
    #[allow(dead_code)] // drop してサーバが落ちると困るのでリスナのインスタンスを保持しておく
    listener: StreamSocketListener,
    provider: RfcommServiceProvider,
}

fn check_server_state() -> Result<()> {
    let state = SERVER_STATE.lock().unwrap();

    match *state {
        Some(_) => Err(crate::error::Error::SyncError(format!(
            "Sync server already started"
        ))),
        None => Ok(()),
    }
}

pub async fn start() -> Result<()> {
    check_server_state()?;

    let rfcomm_service_id = RfcommServiceId::FromUuid(GUID::from(UUID_BLUENOTE_RFCOMM))?;
    let provider = RfcommServiceProvider::CreateAsync(&rfcomm_service_id)?.await?;
    let listener = StreamSocketListener::new()?;

    listener.ConnectionReceived(&TypedEventHandler::new(|s, e| on_received(s, e)))?;
    listener
        .BindServiceNameWithProtectionLevelAsync(
            &provider.ServiceId()?.AsString()?,
            SocketProtectionLevel::BluetoothEncryptionWithAuthentication, /* Androidの設定と合わせる */
        )?
        .await?;

    provider.StartAdvertisingWithRadioDiscoverability(&listener, true)?; // 必要

    let mut state = SERVER_STATE.lock().unwrap();
    *state = Some(SyncServerState { listener, provider });

    Ok(())
}

pub fn stop() -> Result<()> {
    let mut state = SERVER_STATE.lock().unwrap();

    if let Some(state) = state.take() {
        state.provider.StopAdvertising()?;
    }

    Ok(())
}

fn on_received(
    _: &Option<StreamSocketListener>,
    e: &Option<StreamSocketListenerConnectionReceivedEventArgs>,
) -> windows::core::Result<()> {
    let socket = e.as_ref().unwrap().Socket()?;

    std::thread::spawn(move || {
        let local = LocalSet::new();

        local.spawn_local(async move {
            let result = async {
                let mut reader = AsyncReader::new(&socket.InputStream()?)?;
                let mut writer = AsyncWriter::new(&socket.OutputStream()?)?;

                serve(&mut reader, &mut writer, &SYNC_SERVICE).await
            }
            .await;

            match result {
                Ok(_) => {
                    println!("Connection closed.");
                }
                Err(e) => {
                    println!("Sync failed: {}", e);
                }
            };
        });

        RUNTIME.block_on(local);
    });

    Ok(())
}

/// JavaScript との通信の抽象化
#[async_trait(?Send)]
trait SyncService {
    /// デバイスに対する同期を許可しているか
    async fn is_sync_allowed(&self, uuid: &str) -> Result<bool>;

    /// 自身のデバイス ID を取得
    async fn get_my_uuid(&self) -> Result<String>;

    /// 現在時刻を取得
    async fn now(&self) -> Result<String>;

    /// スレッドの更新分（の JSON）を取得
    async fn get_thread_updates(&self, uuid: &str, updated_end: &str) -> Result<String>;

    /// 指定したスレッドのメモ（の JSON）をすべて取得する
    async fn get_all_notes_in_thread(&self, thread_id: &str) -> Result<String>;

    /// 指定したツリーのメモ（の JSON）をすべて取得する
    async fn get_all_notes_in_tree(&self, parent_id: &str) -> Result<String>;

    /// 指定したスレッド直下のメモの更新分（の JSON）を取得
    async fn get_note_updates_in_thread(
        &self,
        uuid: &str,
        thread_id: &str,
        updated_end: &str,
    ) -> Result<String>;

    /// 指定したツリーのメモの更新分（の JSON）を取得
    ///
    /// ## 引数
    ///
    /// - `uuid` - 同期相手の ID
    async fn get_note_updates_in_tree(
        &self,
        uuid: &str,
        parent_id: &str,
        updated_end: &str,
    ) -> Result<String>;

    /// DB に同期時刻を保存する
    async fn update_synced_at(&self, uuid: &str, updated_end: &str) -> Result<()>;
}

/// ストリームから UUID 文字列を読み取る
async fn read_uuid<R>(reader: &mut R) -> tokio::io::Result<String>
where
    R: AsyncRead + Unpin,
{
    let mut buffer = vec![0u8; 36];

    reader.read_exact(&mut buffer[..]).await?;

    match String::from_utf8(buffer) {
        Ok(v) => Ok(v),
        Err(e) => Err(tokio::io::Error::new(tokio::io::ErrorKind::Interrupted, e)),
    }
}

/// データを送信して flush する
/// 先頭に 4 バイト、リトルエンディアンでデータのサイズを書き込み、以降データを書き込む
async fn write_data_and_flush<W>(
    request_uuid: &String,
    writer: &mut W,
    data: &[u8],
) -> tokio::io::Result<()>
where
    W: AsyncWrite + Unpin,
{
    let request_uuid = request_uuid.as_bytes();
    writer.write_all(request_uuid).await?;
    writer.write_u32_le(data.len() as u32).await?;
    writer.write_all(data).await?;
    writer.flush().await?;

    Ok(())
}

/// 同期サーバの実装本体
async fn serve<R, W, S>(reader: &mut R, writer: &mut W, sync_service: &S) -> Result<()>
where
    R: AsyncRead + Unpin,
    W: AsyncWrite + Unpin,
    S: SyncService,
{
    let my_uuid = sync_service.get_my_uuid().await?;

    // 1. UUID の交換
    let (send_result, uuid): (Result<()>, Result<String>) = futures::join!(
        async {
            // 自身のデバイスIDを送信
            let my_uuid = my_uuid.as_bytes();
            writer.write_all(&my_uuid).await?;
            writer.flush().await?;

            Ok(())
        },
        async {
            // 相手のデバイスの UUID を受信
            let uuid = read_uuid(reader).await?;

            Ok(uuid)
        }
    );

    send_result?;
    let uuid = uuid?;

    println!("UUID: {}", uuid);

    // 2. 同期設定を取得

    // 登録されてないデバイス、もしくは同期がオフになっている相手なら同期を拒否
    if !sync_service.is_sync_allowed(&uuid).await? {
        writer.write_u8(crate::sync::SYNC_REJECTED).await?;
        writer.flush().await?;

        return Err(crate::error::Error::SyncError(format!("Sync rejected")));
    } else {
        // 許可
        writer.write_u8(crate::sync::SYNC_ALLOWED).await?;
        writer.flush().await?;
    }

    // 最終同期時刻、現在時刻を取得し、返却するデータの範囲を決定

    let updated_end = sync_service.now().await?;

    // 4. 相手のリクエストに応じてデータを返す
    loop {
        let request_id = reader.read_u8().await?;

        match request_id {
            // スレッドの更新を送信
            crate::sync::REQUEST_THREAD_UPDATES => {
                let updated = sync_service.get_thread_updates(&uuid, &updated_end).await?;
                let request_uuid = " ".repeat(36);

                write_data_and_flush(&request_uuid, writer, updated.as_bytes()).await?;
            }
            // スレッド内のメモを送信
            crate::sync::REQUEST_ALL_NOTES_IN_THREAD => {
                let thread_id = read_uuid(reader).await?;
                let notes = sync_service.get_all_notes_in_thread(&thread_id).await?;

                write_data_and_flush(&thread_id, writer, notes.as_bytes()).await?;
            }
            crate::sync::REQUEST_ALL_NOTES_IN_TREE => {
                let note_id = read_uuid(reader).await?;
                let notes = sync_service.get_all_notes_in_tree(&note_id).await?;

                write_data_and_flush(&note_id, writer, notes.as_bytes()).await?;
            }
            crate::sync::REQUEST_NOTE_UPDATES_IN_THREAD => {
                let thread_id = read_uuid(reader).await?;
                let notes = sync_service
                    .get_note_updates_in_thread(&uuid, &thread_id, &updated_end)
                    .await?;

                write_data_and_flush(&thread_id, writer, notes.as_bytes()).await?;
            }
            crate::sync::REQUEST_NOTE_UPDATES_IN_TREE => {
                let note_id = read_uuid(reader).await?;
                let notes = sync_service
                    .get_note_updates_in_tree(&uuid, &note_id, &updated_end)
                    .await?;

                write_data_and_flush(&note_id, writer, notes.as_bytes()).await?;
            }
            // 相手側で同期が正常に終了した
            crate::sync::SYNC_SUCCESS => {
                sync_service.update_synced_at(&uuid, &updated_end).await?;

                // DB の更新が成功したことを示す ACK を返し
                // 接続を終了

                writer.write_u8(crate::sync::SYNC_SUCCESS).await?;
                writer.flush().await?;

                break;
            }
            // 相手側で同期が失敗した or EOF
            crate::sync::SYNC_FAILED => {
                // 接続を終了
                break;
            }
            _ => {
                println!("Unknown request: $requestId");
            }
        }
    }

    Ok(())
}

/// JavaScript との通信部分の実装
pub struct SyncServiceImpl {
    pub on_sync_requested:
        NonBlockingThreadsafeFunctionWithReturn<RequestParamSyncPermission, bool>,
    pub on_now_requested: NonBlockingThreadsafeFunctionWithReturn<(), String>,
    pub on_thread_updates_requested:
        NonBlockingThreadsafeFunctionWithReturn<RequestParamThreadUpdates, String>,
    pub on_all_notes_in_thread_requested:
        NonBlockingThreadsafeFunctionWithReturn<RequestParamAllNotesInThread, String>,
    pub on_all_notes_in_tree_requested:
        NonBlockingThreadsafeFunctionWithReturn<RequestParamAllNotesInTree, String>,
    pub on_note_updates_in_thread_requested:
        NonBlockingThreadsafeFunctionWithReturn<RequestParamNoteUpdatesInThread, String>,
    pub on_note_updates_in_tree_requested:
        NonBlockingThreadsafeFunctionWithReturn<RequestParamNoteUpdatesInTree, String>,
    pub on_update_synced_at_requested:
        NonBlockingThreadsafeFunctionWithReturn<RequestParamUpdateSyncedAt, ()>,
    pub on_my_uuid_requested: NonBlockingThreadsafeFunctionWithReturn<(), String>,
}

pub struct RequestParamSyncPermission {
    pub uuid: String,
}

pub struct RequestParamThreadUpdates {
    pub uuid: String,
    pub updated_end: String,
}

pub struct RequestParamAllNotesInThread {
    pub thread_id: String,
}

pub struct RequestParamAllNotesInTree {
    pub parent_id: String,
}

pub struct RequestParamNoteUpdatesInThread {
    pub uuid: String,
    pub thread_id: String,
    pub updated_end: String,
}

pub struct RequestParamNoteUpdatesInTree {
    pub uuid: String,
    pub parent_id: String,
    pub updated_end: String,
}

pub struct RequestParamUpdateSyncedAt {
    pub uuid: String,
    pub updated_end: String,
}

impl SyncServiceImpl {
    async fn is_sync_allowed_impl(&self, uuid: &str) -> Result<bool> {
        self.on_sync_requested
            .call(RequestParamSyncPermission {
                uuid: uuid.to_owned(),
            })
            .await
    }

    async fn now_impl(&self) -> Result<String> {
        self.on_now_requested.call(()).await
    }

    async fn get_thread_updates_impl(&self, uuid: &str, updated_end: &str) -> Result<String> {
        self.on_thread_updates_requested
            .call(RequestParamThreadUpdates {
                uuid: uuid.to_owned(),
                updated_end: updated_end.to_owned(),
            })
            .await
    }
}

#[async_trait(?Send)]
impl SyncService for SyncServiceImpl {
    async fn is_sync_allowed(&self, uuid: &str) -> Result<bool> {
        tokio::time::timeout(Duration::from_secs(5), self.is_sync_allowed_impl(uuid)).await?
    }

    async fn now(&self) -> Result<String> {
        tokio::time::timeout(Duration::from_secs(5), self.now_impl()).await?
    }

    async fn get_thread_updates(&self, uuid: &str, updated_end: &str) -> Result<String> {
        tokio::time::timeout(
            Duration::from_secs(10),
            self.get_thread_updates_impl(uuid, updated_end),
        )
        .await?
    }

    async fn get_all_notes_in_thread(&self, thread_id: &str) -> Result<String> {
        self.on_all_notes_in_thread_requested
            .call(RequestParamAllNotesInThread {
                thread_id: thread_id.to_owned(),
            })
            .await
    }

    async fn get_all_notes_in_tree(&self, parent_id: &str) -> Result<String> {
        self.on_all_notes_in_tree_requested
            .call(RequestParamAllNotesInTree {
                parent_id: parent_id.to_owned(),
            })
            .await
    }

    async fn get_note_updates_in_thread(
        &self,
        uuid: &str,
        thread_id: &str,
        updated_end: &str,
    ) -> Result<String> {
        self.on_note_updates_in_thread_requested
            .call(RequestParamNoteUpdatesInThread {
                uuid: uuid.to_owned(),
                thread_id: thread_id.to_owned(),
                updated_end: updated_end.to_owned(),
            })
            .await
    }

    async fn get_note_updates_in_tree(
        &self,
        uuid: &str,
        parent_id: &str,
        updated_end: &str,
    ) -> Result<String> {
        self.on_note_updates_in_tree_requested
            .call(RequestParamNoteUpdatesInTree {
                uuid: uuid.to_owned(),
                parent_id: parent_id.to_owned(),
                updated_end: updated_end.to_owned(),
            })
            .await
    }

    async fn update_synced_at(&self, uuid: &str, updated_end: &str) -> Result<()> {
        tokio::time::timeout(
            Duration::from_secs(10),
            self.on_update_synced_at_requested
                .call(RequestParamUpdateSyncedAt {
                    uuid: uuid.to_owned(),
                    updated_end: updated_end.to_owned(),
                }),
        )
        .await?
    }

    async fn get_my_uuid(&self) -> Result<String> {
        tokio::time::timeout(Duration::from_secs(5), self.on_my_uuid_requested.call(())).await?
    }
}
