use std::{sync::Mutex, time::Duration};

use napi::threadsafe_function::ThreadsafeFunction;
use tokio::task::LocalSet;
use windows::{
    core::GUID,
    Devices::Bluetooth::{
        BluetoothDevice,
        Rfcomm::{RfcommServiceId, RfcommServiceProvider},
    },
    Foundation::TypedEventHandler,
    Networking::Sockets::{
        SocketProtectionLevel, StreamSocketListener,
        StreamSocketListenerConnectionReceivedEventArgs,
    },
};

use crate::{init::exchange_uuid, RUNTIME, UUID_BLUENOTE_RFCOMM_INIT};

struct InitServerState {
    my_device_uuid: String,
    listener: StreamSocketListener,
    provider: RfcommServiceProvider,
}

pub struct InitServer {
    state: Mutex<Option<InitServerState>>,
    pub on_uuid_exchanged: Mutex<Option<ThreadsafeFunction<(String, String)>>>,
    pub on_state_changed: Mutex<Option<ThreadsafeFunction<bool>>>,
}

impl InitServer {
    pub const fn new() -> Self {
        Self {
            state: Mutex::new(None),
            on_uuid_exchanged: Mutex::new(None),
            on_state_changed: Mutex::new(None),
        }
    }

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
            .state
            .lock()
            .unwrap()
            .as_ref()
            .unwrap()
            .my_device_uuid
            .to_owned();
        let socket = e.as_ref().unwrap().Socket()?;

        std::thread::spawn(move || {
            let local = LocalSet::new();

            local.spawn_local(async move {
                let device =
                    BluetoothDevice::FromHostNameAsync(&socket.Information()?.RemoteHostName()?)?
                        .await?;
                let device_name = device.Name()?.to_string();

                let uuid = {
                    let uuid =
                        exchange_uuid(&my_uuid, &socket.InputStream()?, &socket.OutputStream()?)
                            .await?;
                    drop(socket);
                    uuid
                };

                println!("Connection closed.");
                println!("UUID: {}", uuid);

                if let Some(on_uuid_exchanged) = self.on_uuid_exchanged.lock().unwrap().as_ref() {
                    on_uuid_exchanged.call(
                        Ok((device_name, uuid)),
                        napi::threadsafe_function::ThreadsafeFunctionCallMode::NonBlocking,
                    );
                }

                Ok::<(), windows::core::Error>(())
            });

            RUNTIME.block_on(local);
        });

        Ok(())
    }

    pub async fn start(&'static self, device_uuid: String) -> windows::core::Result<()> {
        let mut inner = self.state.lock().unwrap();

        if inner.is_some() {
            return Ok(());
        }

        let rfcomm_service_id = RfcommServiceId::FromUuid(GUID::from(UUID_BLUENOTE_RFCOMM_INIT))?;
        let provider = RfcommServiceProvider::CreateAsync(&rfcomm_service_id)?.await?;
        let listener = StreamSocketListener::new()?;

        *inner = Some(InitServerState {
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

        self.on_state_changed(true);

        // 1分後に停止
        RUNTIME.spawn(async {
            tokio::time::sleep(Duration::from_secs(60)).await;
            if let Err(e) = self.stop() {
                println!("Warning: failed to stop init server: {}", e);
            }
        });

        Ok(())
    }

    pub fn stop(&self) -> windows::core::Result<()> {
        let mut inner = self.state.lock().unwrap();

        if let Some(state) = inner.as_ref() {
            state.provider.StopAdvertising()?;
            *inner = None;
        }

        self.on_state_changed(false);

        Ok(())
    }

    fn on_state_changed(&self, is_running: bool) {
        let on_state_changed = self.on_state_changed.lock().unwrap();

        if let Some(on_state_changed) = &*on_state_changed {
            on_state_changed.call(
                Ok(is_running),
                napi::threadsafe_function::ThreadsafeFunctionCallMode::NonBlocking,
            );
        }
    }
}
