use crate::{
    sync::{async_reader::AsyncReader, async_writer::AsyncWriter},
    NonBlockingThreadsafeFunctionWithReturn, Result, RUNTIME, UUID_BLUENOTE_RFCOMM,
};
use async_trait::async_trait;
use napi::{
    bindgen_prelude::AsyncTask,
    threadsafe_function::{ThreadSafeCallContext, ThreadsafeFunction},
    Env, JsFunction, JsUndefined, Task,
};
use napi_derive::napi;
use std::{sync::Mutex, time::Duration};
use tokio::{
    io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt},
    sync::oneshot,
    task::LocalSet,
};
use windows::{
    core::{GUID, HRESULT, HSTRING},
    Devices::Bluetooth::Rfcomm::{RfcommServiceId, RfcommServiceProvider},
    Foundation::TypedEventHandler,
    Networking::Sockets::{
        SocketProtectionLevel, StreamSocketListener,
        StreamSocketListenerConnectionReceivedEventArgs,
    },
};

static SERVER_STATE: Mutex<Option<SyncServerState>> = Mutex::new(None);
static SYNC_SERVICE: SyncServiceImpl = SyncServiceImpl {
    sync_permission_sender: Mutex::new(None),
    now_sender: Mutex::new(None),
    on_sync_requested: Mutex::new(None),
    on_now_requested: Mutex::new(None),
    on_thread_updates_requested: NonBlockingThreadsafeFunctionWithReturn::new(),
    on_all_notes_in_thread_requested: NonBlockingThreadsafeFunctionWithReturn::new(),
    on_all_notes_in_tree_requested: NonBlockingThreadsafeFunctionWithReturn::new(),
    on_note_updates_in_thread_requested: NonBlockingThreadsafeFunctionWithReturn::new(),
    on_note_updates_in_tree_requested: NonBlockingThreadsafeFunctionWithReturn::new(),
    on_update_synced_at_requested: NonBlockingThreadsafeFunctionWithReturn::new(),
};

fn abort_error(message: &str) -> windows::core::Error {
    windows::core::Error::new(HRESULT(0x80004004u32 as i32), HSTRING::from(message))
}

fn check_server_state() -> windows::core::Result<()> {
    let state = SERVER_STATE.lock().unwrap();

    match *state {
        Some(_) => Err(abort_error("Sync server already started")),
        None => Ok(()),
    }
}

async fn start_impl() -> Result<()> {
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

    provider.StartAdvertising(&listener)?; // 必要

    let mut state = SERVER_STATE.lock().unwrap();
    *state = Some(SyncServerState { listener, provider });

    Ok(())
}

/// 同期サーバを起動する
#[napi(ts_return_type = "Promise<void>")]
pub fn start_sync_server() -> AsyncTask<SyncServerStartTask> {
    AsyncTask::new(SyncServerStartTask {})
}

/// 同期サーバを停止する
#[napi]
pub fn stop_sync_server() -> Result<()> {
    let mut state = SERVER_STATE.lock().unwrap();

    if let Some(state) = state.take() {
        state.provider.StopAdvertising()?;
    }

    Ok(())
}

/// 同期がリクエストされたときのコールバックを設定する
#[napi(ts_args_type = "callback: (err: null | Error, uuid: string) => void")]
pub fn set_on_sync_requested(callback: JsFunction) -> napi::Result<()> {
    let tsfn = callback.create_threadsafe_function(0, |ctx: ThreadSafeCallContext<String>| {
        vec![ctx.value]
            .iter()
            .map(|x| ctx.env.create_string(&x))
            .collect()
    })?;

    let mut callback = SYNC_SERVICE.on_sync_requested.lock().unwrap();
    *callback = Some(tsfn);

    Ok(())
}

/// 同期リクエストに対する応答を返す
#[napi]
pub fn respond_to_sync_request(allow: bool) {
    let mut tx = SYNC_SERVICE.sync_permission_sender.lock().unwrap();

    if let Some(tx) = tx.take() {
        if let Err(_) = tx.send(allow) {
            // 例外出すのはなんか違う気がするんだよなー
            println!("Warning: failed to send sync response. May be already timed out?")
        }
    }
}

/// 現在時刻がリクエストされたときのコールバックを設定する
#[napi(ts_args_type = "callback: (err: null | Error) => void")]
pub fn set_on_now_requested(callback: JsFunction) -> napi::Result<()> {
    let tsfn = callback.create_threadsafe_function(0, |ctx: ThreadSafeCallContext<()>| {
        Ok::<Vec<()>, napi::Error>(vec![])
    })?;

    let mut callback = SYNC_SERVICE.on_now_requested.lock().unwrap();
    *callback = Some(tsfn);

    Ok(())
}

/// 現在時刻リクエストに対する応答を返す
#[napi]
pub fn respond_to_now_request(now: String) {
    let mut tx = SYNC_SERVICE.now_sender.lock().unwrap();

    if let Some(tx) = tx.take() {
        if let Err(_) = tx.send(now) {
            // 例外出すのはなんか違う気がするんだよなー
            println!("Warning: failed to send response. May be already timed out?")
        }
    }
}

/// スレッドの更新差分がリクエストされたときのコールバックを設定する
#[napi(ts_args_type = "callback: (err: null | Error, uuid: string, updatedEnd: string) => void")]
pub fn set_on_thread_updates_requested(callback: JsFunction) -> napi::Result<()> {
    let tsfn = callback.create_threadsafe_function(
        0,
        |ctx: ThreadSafeCallContext<(String, String)>| {
            vec![ctx.value.0, ctx.value.1]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        },
    )?;

    let mut callback = SYNC_SERVICE
        .on_thread_updates_requested
        .func
        .lock()
        .unwrap();
    *callback = Some(tsfn);

    Ok(())
}

/// スレッド更新差分リクエストに対する応答を返す
#[napi]
pub fn respond_to_thread_updates_request(json: String) {
    SYNC_SERVICE.on_thread_updates_requested.send_result(json);
}

/// 指定スレッド内のメモの内容の送信をリクエストされたときのコールバックを設定する
#[napi(ts_args_type = "callback: (err: null | Error, uuid: string, threadId: string) => void")]
pub fn set_on_all_notes_in_thread_requested(callback: JsFunction) -> napi::Result<()> {
    let tsfn = callback.create_threadsafe_function(
        0,
        |ctx: ThreadSafeCallContext<(String, String)>| {
            vec![ctx.value.0, ctx.value.1]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        },
    )?;

    SYNC_SERVICE
        .on_all_notes_in_thread_requested
        .set_callback(tsfn);

    Ok(())
}

/// 指定スレッド内のメモの内容の送信リクエストに対する応答を返す
#[napi]
pub fn respond_to_all_notes_in_thread_request(json: String) {
    SYNC_SERVICE
        .on_all_notes_in_thread_requested
        .send_result(json);
}

/// 指定ツリー内のメモの内容の送信をリクエストされたときのコールバックを設定する
#[napi(ts_args_type = "callback: (err: null | Error, uuid: string, parentId: string) => void")]
pub fn set_on_all_notes_in_tree_requested(callback: JsFunction) -> napi::Result<()> {
    let tsfn = callback.create_threadsafe_function(
        0,
        |ctx: ThreadSafeCallContext<(String, String)>| {
            vec![ctx.value.0, ctx.value.1]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        },
    )?;

    SYNC_SERVICE
        .on_all_notes_in_tree_requested
        .set_callback(tsfn);

    Ok(())
}

/// 指定ツリー内のメモの内容の送信リクエストに対する応答を返す
#[napi]
pub fn respond_to_all_notes_in_tree_request(json: String) {
    SYNC_SERVICE
        .on_all_notes_in_tree_requested
        .send_result(json);
}

/// 指定スレッド内のメモの更新差分の送信をリクエストされたときのコールバックを設定する
#[napi(
    ts_args_type = "callback: (err: null | Error, uuid: string, threadId: string, updatedEnd: String) => void"
)]
pub fn set_on_note_updates_in_thread_requested(callback: JsFunction) -> napi::Result<()> {
    let tsfn = callback.create_threadsafe_function(
        0,
        |ctx: ThreadSafeCallContext<RequestParamNoteUpdatesInThread>| {
            vec![ctx.value.uuid, ctx.value.thread_id, ctx.value.updated_end]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        },
    )?;

    SYNC_SERVICE
        .on_note_updates_in_thread_requested
        .set_callback(tsfn);

    Ok(())
}

/// 指定スレッド内のメモの更新差分の送信リクエストに対する応答を返す
#[napi]
pub fn respond_to_note_updates_in_thread_request(json: String) {
    SYNC_SERVICE
        .on_note_updates_in_thread_requested
        .send_result(json);
}

/// 指定ツリー内のメモの更新差分の送信をリクエストされたときのコールバックを設定する
#[napi(
    ts_args_type = "callback: (err: null | Error, uuid: string, parentId: string, updatedEnd: String) => void"
)]
pub fn set_on_note_updates_in_tree_requested(callback: JsFunction) -> napi::Result<()> {
    let tsfn = callback.create_threadsafe_function(
        0,
        |ctx: ThreadSafeCallContext<RequestParamNoteUpdatesInTree>| {
            vec![ctx.value.uuid, ctx.value.parent_id, ctx.value.updated_end]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        },
    )?;

    SYNC_SERVICE
        .on_note_updates_in_tree_requested
        .set_callback(tsfn);

    Ok(())
}

/// 指定ツリー内のメモの更新差分の送信リクエストに対する応答を返す
#[napi]
pub fn respond_to_note_updates_in_tree_request(json: String) {
    SYNC_SERVICE
        .on_note_updates_in_tree_requested
        .send_result(json);
}

/// 同期時刻の保存をリクエストされたときのコールバックを設定する
#[napi(ts_args_type = "callback: (err: null | Error, uuid: string, updatedEnd: String) => void")]
pub fn set_on_update_synced_at_requested(callback: JsFunction) -> napi::Result<()> {
    let tsfn = callback.create_threadsafe_function(
        0,
        |ctx: ThreadSafeCallContext<RequestParamUpdateSyncedAt>| {
            vec![ctx.value.uuid, ctx.value.updated_end]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        },
    )?;

    SYNC_SERVICE
        .on_update_synced_at_requested
        .set_callback(tsfn);

    Ok(())
}

/// 同期時刻の保存リクエストに対する応答を返す
#[napi]
pub fn respond_to_update_synced_at_request() {
    SYNC_SERVICE.on_update_synced_at_requested.send_result(());
}

fn on_received(
    _: &Option<StreamSocketListener>,
    e: &Option<StreamSocketListenerConnectionReceivedEventArgs>,
) -> windows::core::Result<()> {
    let socket = e.as_ref().unwrap().Socket()?;

    std::thread::spawn(move || {
        let local = LocalSet::new();

        local.spawn_local(async move {
            println!("a");

            let result = async {
                let mut reader = AsyncReader::new(&socket.InputStream()?)?;
                let mut writer = AsyncWriter::new(&socket.OutputStream()?)?;

                println!("b");

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

#[async_trait(?Send)]
trait SyncService {
    /// デバイスに対する同期を許可しているか
    async fn is_sync_allowed(&self, uuid: &str) -> Result<bool>;

    /// 現在時刻を取得
    async fn now(&self) -> Result<String>;

    /// スレッドの更新分（の JSON）を取得
    async fn get_thread_updates(&self, uuid: &str, updated_end: &str) -> Result<String>;

    /// 指定したスレッドのメモ（の JSON）をすべて取得する
    async fn get_all_notes_in_thread(&self, uuid: &str, thread_id: &str) -> Result<String>;

    /// 指定したツリーのメモ（の JSON）をすべて取得する
    async fn get_all_notes_in_tree(&self, uuid: &str, parent_id: &str) -> Result<String>;

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

fn interrupted_error_with_message(message: &str) -> tokio::io::Error {
    tokio::io::Error::new(tokio::io::ErrorKind::Interrupted, message)
}

fn interrupted_error() -> tokio::io::Error {
    tokio::io::Error::from(tokio::io::ErrorKind::Interrupted)
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
async fn write_data_and_flush<W>(writer: &mut W, data: &[u8]) -> tokio::io::Result<()>
where
    W: AsyncWrite + Unpin,
{
    writer.write_u32_le(data.len() as u32).await?;
    writer.write_all(data).await?;
    writer.flush().await?;

    Ok(())
}

async fn serve<R, W, S>(reader: &mut R, writer: &mut W, sync_service: &S) -> Result<()>
where
    R: AsyncRead + Unpin,
    W: AsyncWrite + Unpin,
    S: SyncService,
{
    // 1. プロトコルバージョンの交換

    writer.write_u32_le(crate::sync::PROTOCOL_VERSION).await?;
    writer.flush().await?;

    let version = reader.read_u32_le().await?;

    // 違ければ接続を終了
    if version != crate::sync::PROTOCOL_VERSION {
        return Err(crate::error::Error::SyncError(format!(
            "The sync companion uses different protocol: {}",
            version
        )));
    }

    // 2. 相手の UUID を受信
    let uuid = read_uuid(reader).await?;

    println!("UUID: {}", uuid);

    // 3. 同期設定を取得

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

        dbg!(request_id);

        match request_id {
            // スレッドの更新を送信
            crate::sync::REQUEST_THREAD_UPDATES => {
                let updated = sync_service.get_thread_updates(&uuid, &updated_end).await?;

                write_data_and_flush(writer, updated.as_bytes()).await?;
            }
            // スレッド内のメモを送信
            crate::sync::REQUEST_ALL_NOTES_IN_THREAD => {
                let thread_id = read_uuid(reader).await?;
                let notes = sync_service
                    .get_all_notes_in_thread(&uuid, &thread_id)
                    .await?;

                write_data_and_flush(writer, notes.as_bytes()).await?;
            }
            crate::sync::REQUEST_ALL_NOTES_IN_TREE => {
                let note_id = read_uuid(reader).await?;
                let notes = sync_service.get_all_notes_in_tree(&uuid, &note_id).await?;

                write_data_and_flush(writer, notes.as_bytes()).await?;
            }
            crate::sync::REQUEST_NOTE_UPDATES_IN_THREAD => {
                let thread_id = read_uuid(reader).await?;
                let notes = sync_service
                    .get_note_updates_in_thread(&uuid, &thread_id, &updated_end)
                    .await?;

                write_data_and_flush(writer, notes.as_bytes()).await?;
            }
            crate::sync::REQUEST_NOTE_UPDATES_IN_TREE => {
                let note_id = read_uuid(reader).await?;
                let notes = sync_service
                    .get_note_updates_in_tree(&uuid, &note_id, &updated_end)
                    .await?;

                write_data_and_flush(writer, notes.as_bytes()).await?;
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

pub struct SyncServerStartTask {}

impl Task for SyncServerStartTask {
    type Output = ();
    type JsValue = JsUndefined;

    fn compute(&mut self) -> napi::Result<Self::Output> {
        RUNTIME.block_on(start_impl())?;

        Ok(())
    }

    fn resolve(&mut self, env: Env, _: Self::Output) -> napi::Result<Self::JsValue> {
        env.get_undefined()
    }
}

struct SyncServerState {
    listener: StreamSocketListener,
    provider: RfcommServiceProvider,
}

struct RequestParamNoteUpdatesInThread {
    uuid: String,
    thread_id: String,
    updated_end: String,
}

struct RequestParamNoteUpdatesInTree {
    uuid: String,
    parent_id: String,
    updated_end: String,
}

struct RequestParamUpdateSyncedAt {
    uuid: String,
    updated_end: String,
}

struct SyncServiceImpl {
    pub sync_permission_sender: Mutex<Option<oneshot::Sender<bool>>>,
    pub now_sender: Mutex<Option<oneshot::Sender<String>>>,
    pub on_sync_requested: Mutex<Option<ThreadsafeFunction<String>>>,
    pub on_now_requested: Mutex<Option<ThreadsafeFunction<()>>>,
    pub on_thread_updates_requested:
        NonBlockingThreadsafeFunctionWithReturn<(String, String), String>,
    pub on_all_notes_in_thread_requested:
        NonBlockingThreadsafeFunctionWithReturn<(String, String), String>,
    pub on_all_notes_in_tree_requested:
        NonBlockingThreadsafeFunctionWithReturn<(String, String), String>,
    pub on_note_updates_in_thread_requested:
        NonBlockingThreadsafeFunctionWithReturn<RequestParamNoteUpdatesInThread, String>,
    pub on_note_updates_in_tree_requested:
        NonBlockingThreadsafeFunctionWithReturn<RequestParamNoteUpdatesInTree, String>,
    pub on_update_synced_at_requested:
        NonBlockingThreadsafeFunctionWithReturn<RequestParamUpdateSyncedAt, ()>,
}

impl SyncServiceImpl {
    async fn is_sync_allowed_impl(&self, uuid: &str) -> Result<bool> {
        // 応答の送受信チャンネルを作成
        let rx: oneshot::Receiver<bool>;
        {
            let mut sender = self.sync_permission_sender.lock().unwrap();

            if sender.is_some() {
                return Err(crate::error::Error::SyncError(format!(
                    "There exists another call"
                )));
            }

            let tx: oneshot::Sender<bool>;

            (tx, rx) = oneshot::channel();
            *sender = Some(tx);
        }

        let on_sync_requested = self.on_sync_requested.lock().unwrap();

        if let Some(on_sync_requested) = &*on_sync_requested {
            on_sync_requested.call(
                Ok(uuid.to_owned()),
                napi::threadsafe_function::ThreadsafeFunctionCallMode::NonBlocking,
            );
        }

        Ok(rx.await.unwrap())
    }

    async fn now_impl(&self) -> Result<String> {
        // 応答の送受信チャンネルを作成
        let rx: oneshot::Receiver<String>;
        {
            let mut sender = self.now_sender.lock().unwrap();

            if sender.is_some() {
                return Err(crate::error::Error::SyncError(format!(
                    "There exists another call"
                )));
            }

            let tx: oneshot::Sender<String>;

            (tx, rx) = oneshot::channel();
            *sender = Some(tx);
        }

        let on_now_requested = self.on_now_requested.lock().unwrap();

        if let Some(on_now_requested) = &*on_now_requested {
            on_now_requested.call(
                Ok(()),
                napi::threadsafe_function::ThreadsafeFunctionCallMode::NonBlocking,
            );
        }

        Ok(rx.await.unwrap())
    }

    async fn get_thread_updates_impl(&self, uuid: &str, updated_end: &str) -> Result<String> {
        self.on_thread_updates_requested
            .call((uuid.to_owned(), updated_end.to_owned()))
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

    async fn get_all_notes_in_thread(&self, uuid: &str, thread_id: &str) -> Result<String> {
        self.on_all_notes_in_thread_requested
            .call((uuid.to_owned(), thread_id.to_owned()))
            .await
    }

    async fn get_all_notes_in_tree(&self, uuid: &str, parent_id: &str) -> Result<String> {
        self.on_all_notes_in_tree_requested
            .call((uuid.to_owned(), parent_id.to_owned()))
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
}
