mod error;
mod init;
mod scanner;
mod sync;

use init::server::InitServer;
use napi::threadsafe_function::{ThreadSafeCallContext, ThreadsafeFunction};
use napi::{bindgen_prelude::*, JsString, JsUndefined};
use napi_derive::napi;
use once_cell::sync::Lazy;
use std::sync::Mutex;
use sync::server::{
    RequestParamAllNotesInThread, RequestParamAllNotesInTree, RequestParamNoteUpdatesInThread,
    RequestParamNoteUpdatesInTree, RequestParamSyncPermission, RequestParamThreadUpdates,
    RequestParamUpdateSyncedAt,
};
use tokio::runtime::Runtime;

/// Bluenote Result
type Result<T> = std::result::Result<T, crate::error::Error>;

/// 同期の RFCOMM サービス UUID
static UUID_BLUENOTE_RFCOMM: &str = "41f4bde2-0492-4bf5-bae2-4451be148999";

/// 同期初期化の RFCOMM サービス UUID
static UUID_BLUENOTE_RFCOMM_INIT: &str = "c144d029-2a62-4cfc-b39c-ca6ce173cb3f";

static RUNTIME: Lazy<Runtime> = Lazy::new(|| {
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap()
});

static INIT_CLIENT: crate::init::client::InitClient = crate::init::client::InitClient {
    accept_sender: Mutex::new(None),
    on_pairing_requested: Mutex::new(None),
};

static INIT_SERVER: InitServer = InitServer::new();

static BLUETOOTH_SCANNER: crate::scanner::BluetoothScanner =
    crate::scanner::BluetoothScanner::new();

/// 指定したデバイスに RFCOMM で接続し、UUID を交換
#[napi(ts_return_type = "Promise<string>")]
pub fn init_client(windows_device_id: String, my_uuid: String) -> AsyncTask<InitClientTask> {
    AsyncTask::new(InitClientTask {
        windows_device_id,
        my_uuid,
    })
}

/// ペアリングをリクエストされたときのコールバックの設定
/// このコールバックが呼ばれたとき、ユーザに PIN を表示してペアリングの
/// 許可・不許可の判定をしてもらい、`respond_to_bond_request` でその
/// 結果を受け取る
#[napi(ts_args_type = "callback: (err: null | Error, deviceName: string, pin: string) => void")]
pub fn set_on_bond_requested(callback: JsFunction) -> napi::Result<()> {
    let tsfn = callback.create_threadsafe_function(
        0,
        |ctx: ThreadSafeCallContext<(String, String)>| {
            vec![ctx.value.0, ctx.value.1]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        },
    )?;

    let mut callback = INIT_CLIENT.on_pairing_requested.lock().unwrap();
    *callback = Some(tsfn);

    Ok(())
}

/// ペアリングリクエストに対する応答を返す
#[napi]
pub fn respond_to_bond_request(accept: bool) {
    let mut tx = INIT_CLIENT.accept_sender.lock().unwrap();

    if let Some(tx) = tx.take() {
        if let Err(_) = tx.send(accept) {
            // 例外出すのはなんか違う気がするんだよなー
            println!("Warning: failed to send pairing response. May be already timed out?")
        }
    }
}

/// デバイスのスキャンを開始する
#[napi]
pub fn start_bluetooth_scan() -> napi::Result<()> {
    match BLUETOOTH_SCANNER.start() {
        Ok(_) => Ok(()),
        Err(e) => Err(napi::Error::from_reason(e.message().to_string())),
    }
}

/// デバイスのスキャンを停止する
#[napi]
pub fn stop_bluetooth_scan() -> napi::Result<()> {
    match BLUETOOTH_SCANNER.stop() {
        Ok(_) => Ok(()),
        Err(e) => Err(napi::Error::from_reason(e.message().to_string())),
    }
}

/// スキャンの状態が変化したときのコールバックを設定する
#[napi(ts_args_type = "callback: (err: null | Error, isScanning: Boolean) => void")]
pub fn set_on_scan_state_changed(callback: JsFunction) -> napi::Result<()> {
    let tsfn = callback.create_threadsafe_function(0, |ctx: ThreadSafeCallContext<bool>| {
        vec![ctx.value]
            .iter()
            .map(|x| ctx.env.get_boolean(x.clone()))
            .collect()
    })?;

    let mut callback = BLUETOOTH_SCANNER.on_scan_state_changed.lock().unwrap();
    *callback = Some(tsfn);

    Ok(())
}

/// デバイスが見つかった時のコールバックを設定する
#[napi(
    ts_args_type = "callback: (err: null | Error, deviceName: string, deviceId: string) => void"
)]
pub fn set_on_bluetooth_device_found(callback: JsFunction) -> napi::Result<()> {
    let tsfn = callback.create_threadsafe_function(
        0,
        |ctx: ThreadSafeCallContext<(String, String)>| {
            vec![ctx.value.0, ctx.value.1]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        },
    )?;

    let mut on_found = BLUETOOTH_SCANNER.on_found.lock().unwrap();
    *on_found = Some(tsfn);

    Ok(())
}

/// 同期設定の受付を開始する
#[napi]
pub fn start_init_server(my_uuid: String) -> AsyncTask<SyncRequestListenerStartTask> {
    AsyncTask::new(SyncRequestListenerStartTask { my_uuid })
}

/// 同期設定の受付を停止する
#[napi]
pub fn stop_init_server() -> napi::Result<()> {
    match INIT_SERVER.stop() {
        Ok(_) => Ok(()),
        Err(e) => Err(napi::Error::from_reason(e.message().to_string())),
    }
}

/// 同期受付の状態が変化したときのコールバックを設定する
#[napi(ts_args_type = "callback: (err: null | Error, isRunning: Boolean) => void")]
pub fn set_on_init_server_state_changed(callback: JsFunction) -> napi::Result<()> {
    let tsfn = callback.create_threadsafe_function(0, |ctx: ThreadSafeCallContext<bool>| {
        vec![ctx.value]
            .iter()
            .map(|x| ctx.env.get_boolean(x.clone()))
            .collect()
    })?;

    let mut callback = INIT_SERVER.on_state_changed.lock().unwrap();
    *callback = Some(tsfn);

    Ok(())
}

/// UUID の交換が終わった時に呼ばれるコールバックを設定する
#[napi(
    ts_args_type = "callback: (err: null | Error, deviceName: string, deviceUuid: string) => void"
)]
pub fn set_on_uuid_exchanged(callback: JsFunction) -> napi::Result<()> {
    // wwww
    let tsfn = callback.create_threadsafe_function(
        0,
        |ctx: ThreadSafeCallContext<(String, String)>| {
            vec![ctx.value.0, ctx.value.1]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        },
    )?;

    let mut callback = INIT_SERVER.on_uuid_exchanged.lock().unwrap();

    *callback = Some(tsfn);

    Ok(())
}

/// 同期対象のデバイスのデバイスIDを列挙する
#[napi(ts_return_type = "Promise<string[]>")]
pub fn enumerate_sync_companions() -> AsyncTask<EnumerateSyncCompanionsTask> {
    AsyncTask::new(EnumerateSyncCompanionsTask {})
}

/// 同期サーバを起動する
#[napi(ts_return_type = "Promise<void>")]
pub fn start_sync_server() -> AsyncTask<SyncServerStartTask> {
    AsyncTask::new(SyncServerStartTask {})
}

pub struct SyncServerStartTask {}

impl Task for SyncServerStartTask {
    type Output = ();
    type JsValue = JsUndefined;

    fn compute(&mut self) -> napi::Result<Self::Output> {
        RUNTIME.block_on(crate::sync::server::start())?;
        Ok(())
    }

    fn resolve(&mut self, env: Env, _: Self::Output) -> napi::Result<Self::JsValue> {
        env.get_undefined()
    }
}

/// 同期サーバを停止する
#[napi]
pub fn stop_sync_server() -> Result<()> {
    crate::sync::server::stop()
}

/// 同期がリクエストされたときのコールバックを設定する
#[napi(ts_args_type = "callback: (err: null | Error, uuid: string) => void")]
pub fn set_on_sync_requested(callback: JsFunction) -> napi::Result<()> {
    let tsfn = callback.create_threadsafe_function(
        0,
        |ctx: ThreadSafeCallContext<RequestParamSyncPermission>| {
            vec![ctx.value.uuid]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        },
    )?;

    crate::sync::server::SYNC_SERVICE
        .on_sync_requested
        .set_callback(tsfn);

    Ok(())
}

/// 同期リクエストに対する応答を返す
#[napi]
pub fn respond_to_sync_request(allow: bool) {
    crate::sync::server::SYNC_SERVICE
        .on_sync_requested
        .send_result(allow);
}

/// 現在時刻がリクエストされたときのコールバックを設定する
#[napi(ts_args_type = "callback: (err: null | Error) => void")]
pub fn set_on_now_requested(callback: JsFunction) -> napi::Result<()> {
    let tsfn = callback.create_threadsafe_function(0, |ctx: ThreadSafeCallContext<()>| {
        Ok::<Vec<()>, napi::Error>(vec![])
    })?;

    crate::sync::server::SYNC_SERVICE
        .on_now_requested
        .set_callback(tsfn);

    Ok(())
}

/// 現在時刻リクエストに対する応答を返す
#[napi]
pub fn respond_to_now_request(now: String) {
    crate::sync::server::SYNC_SERVICE
        .on_now_requested
        .send_result(now);
}

/// スレッドの更新差分がリクエストされたときのコールバックを設定する
#[napi(ts_args_type = "callback: (err: null | Error, uuid: string, updatedEnd: string) => void")]
pub fn set_on_thread_updates_requested(callback: JsFunction) -> napi::Result<()> {
    let tsfn = callback.create_threadsafe_function(
        0,
        |ctx: ThreadSafeCallContext<RequestParamThreadUpdates>| {
            vec![ctx.value.uuid, ctx.value.updated_end]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        },
    )?;

    let mut callback = crate::sync::server::SYNC_SERVICE
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
    crate::sync::server::SYNC_SERVICE
        .on_thread_updates_requested
        .send_result(json);
}

/// 指定スレッド内のメモの内容の送信をリクエストされたときのコールバックを設定する
#[napi(ts_args_type = "callback: (err: null | Error, threadId: string) => void")]
pub fn set_on_all_notes_in_thread_requested(callback: JsFunction) -> napi::Result<()> {
    let tsfn = callback.create_threadsafe_function(
        0,
        |ctx: ThreadSafeCallContext<RequestParamAllNotesInThread>| {
            vec![ctx.value.thread_id]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        },
    )?;

    crate::sync::server::SYNC_SERVICE
        .on_all_notes_in_thread_requested
        .set_callback(tsfn);

    Ok(())
}

/// 指定スレッド内のメモの内容の送信リクエストに対する応答を返す
#[napi]
pub fn respond_to_all_notes_in_thread_request(json: String) {
    crate::sync::server::SYNC_SERVICE
        .on_all_notes_in_thread_requested
        .send_result(json);
}

/// 指定ツリー内のメモの内容の送信をリクエストされたときのコールバックを設定する
#[napi(ts_args_type = "callback: (err: null | Error, parentId: string) => void")]
pub fn set_on_all_notes_in_tree_requested(callback: JsFunction) -> napi::Result<()> {
    let tsfn = callback.create_threadsafe_function(
        0,
        |ctx: ThreadSafeCallContext<RequestParamAllNotesInTree>| {
            vec![ctx.value.parent_id]
                .iter()
                .map(|x| ctx.env.create_string(&x))
                .collect()
        },
    )?;

    crate::sync::server::SYNC_SERVICE
        .on_all_notes_in_tree_requested
        .set_callback(tsfn);

    Ok(())
}

/// 指定ツリー内のメモの内容の送信リクエストに対する応答を返す
#[napi]
pub fn respond_to_all_notes_in_tree_request(json: String) {
    crate::sync::server::SYNC_SERVICE
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

    crate::sync::server::SYNC_SERVICE
        .on_note_updates_in_thread_requested
        .set_callback(tsfn);

    Ok(())
}

/// 指定スレッド内のメモの更新差分の送信リクエストに対する応答を返す
#[napi]
pub fn respond_to_note_updates_in_thread_request(json: String) {
    crate::sync::server::SYNC_SERVICE
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

    crate::sync::server::SYNC_SERVICE
        .on_note_updates_in_tree_requested
        .set_callback(tsfn);

    Ok(())
}

/// 指定ツリー内のメモの更新差分の送信リクエストに対する応答を返す
#[napi]
pub fn respond_to_note_updates_in_tree_request(json: String) {
    crate::sync::server::SYNC_SERVICE
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

    crate::sync::server::SYNC_SERVICE
        .on_update_synced_at_requested
        .set_callback(tsfn);

    Ok(())
}

/// 同期時刻の保存リクエストに対する応答を返す
#[napi]
pub fn respond_to_update_synced_at_request() {
    crate::sync::server::SYNC_SERVICE
        .on_update_synced_at_requested
        .send_result(());
}

pub struct SyncRequestListenerStartTask {
    my_uuid: String,
}

impl Task for SyncRequestListenerStartTask {
    type Output = ();
    type JsValue = JsUndefined;

    fn compute(&mut self) -> napi::Result<Self::Output> {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        let future = INIT_SERVER.start(self.my_uuid.to_owned());

        match rt.block_on(future) {
            Ok(_) => Ok(()),
            Err(e) => Err(napi::Error::from_reason(e.message().to_string())),
        }
    }

    fn resolve(&mut self, env: Env, _: Self::Output) -> napi::Result<Self::JsValue> {
        env.get_undefined()
    }
}

pub struct InitClientTask {
    windows_device_id: String,
    my_uuid: String,
}

impl Task for InitClientTask {
    type Output = String;
    type JsValue = JsString;

    fn compute(&mut self) -> napi::Result<Self::Output> {
        let future = INIT_CLIENT.init(&self.windows_device_id, &self.my_uuid);

        match RUNTIME.block_on(future) {
            Ok(v) => Ok(v),
            Err(e) => Err(napi::Error::from_reason(e.message().to_string())),
        }
    }

    fn resolve(&mut self, env: Env, uuid: Self::Output) -> napi::Result<Self::JsValue> {
        env.create_string(&uuid)
    }
}

pub struct EnumerateSyncCompanionsTask {}

impl Task for EnumerateSyncCompanionsTask {
    type Output = Vec<String>;
    type JsValue = Array;

    fn compute(&mut self) -> napi::Result<Self::Output> {
        match RUNTIME.block_on(crate::sync::client::enumerate_sync_companions()) {
            Ok(v) => Ok(v),
            Err(e) => Err(napi::Error::from_reason(e.message().to_string())),
        }
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> napi::Result<Self::JsValue> {
        let mut array = env.create_array(output.len() as u32)?;

        for i in 0..output.len() {
            array.set(i as u32, env.create_string(&output[i]))?;
        }

        Ok(array)
    }
}

/// napi-rs の ThreadsafeFunction の戻り値を得たい！
pub struct NonBlockingThreadsafeFunctionWithReturn<TParam, TResult>
where
    TParam: 'static,
{
    func: Mutex<Option<ThreadsafeFunction<TParam>>>,
    result_sender: Mutex<Option<tokio::sync::oneshot::Sender<TResult>>>,
}

impl<TParam, TReturn> NonBlockingThreadsafeFunctionWithReturn<TParam, TReturn> {
    pub const fn new() -> Self {
        Self {
            func: Mutex::new(None),
            result_sender: Mutex::new(None),
        }
    }

    pub async fn call(&self, param: TParam) -> Result<TReturn> {
        // 応答の送受信チャンネルを作成
        let rx: tokio::sync::oneshot::Receiver<TReturn>;
        {
            let mut sender = self.result_sender.lock().unwrap();

            if sender.is_some() {
                return Err(crate::error::Error::SyncError(format!(
                    "There exists another call"
                )));
            }

            let tx: tokio::sync::oneshot::Sender<TReturn>;

            (tx, rx) = tokio::sync::oneshot::channel();
            *sender = Some(tx);
        }

        let func = self.func.lock().unwrap();

        match &*func {
            Some(func) => {
                func.call(
                    Ok(param),
                    napi::threadsafe_function::ThreadsafeFunctionCallMode::NonBlocking,
                );
            }
            None => {
                return Err(crate::error::Error::SyncError(format!(
                    "Callback function is found"
                )));
            }
        }

        Ok(rx.await.unwrap())
    }

    pub fn send_result(&self, result: TReturn) {
        let mut tx = self.result_sender.lock().unwrap();

        if let Some(tx) = tx.take() {
            if let Err(_) = tx.send(result) {
                // 例外出すのはなんか違う気がするんだよなー
                println!("Warning: failed to send response. May be already timed out?")
            }
        }
    }

    pub fn set_callback(&self, tsfn: ThreadsafeFunction<TParam>) {
        let mut callback = self.func.lock().unwrap();
        *callback = Some(tsfn);
    }
}
