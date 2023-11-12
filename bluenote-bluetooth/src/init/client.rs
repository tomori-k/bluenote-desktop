use napi::threadsafe_function::ThreadsafeFunction;
use std::{sync::Mutex, time::Duration};
use tokio::sync::oneshot;
use windows::{
    core::{GUID, HSTRING},
    Devices::{
        Bluetooth::{BluetoothCacheMode, BluetoothDevice, Rfcomm::RfcommServiceId},
        Enumeration::{
            DeviceInformationCustomPairing, DevicePairingKinds, DevicePairingProtectionLevel,
            DevicePairingRequestedEventArgs, DevicePairingResultStatus,
        },
    },
    Foundation::TypedEventHandler,
    Networking::Sockets::{SocketProtectionLevel, StreamSocket},
};

use crate::{
    init::{self, abort_error},
    RUNTIME, UUID_BLUENOTE_RFCOMM_INIT,
};

pub struct InitClient {
    pub accept_sender: Mutex<Option<oneshot::Sender<bool>>>,
    pub on_pairing_requested: Mutex<Option<ThreadsafeFunction<(String, String)>>>,
}

impl InitClient {
    pub async fn init(
        &'static self,
        windows_device_id: &str,
        device_uuid: &str,
    ) -> windows::core::Result<String> {
        let bluetooth_device =
            BluetoothDevice::FromIdAsync(&HSTRING::from(windows_device_id))?.await?;
        let rfcomm_services = bluetooth_device
            .GetRfcommServicesForIdWithCacheModeAsync(
                &RfcommServiceId::FromUuid(GUID::from(UUID_BLUENOTE_RFCOMM_INIT))?,
                BluetoothCacheMode::Uncached,
            )?
            .await?;

        // 特定のサービスIDをもっているデバイスのみ対象
        if rfcomm_services.Services()?.Size()? == 0 {
            return Err(abort_error("Device seems not to have Bluenote app."));
        }

        let pairing = bluetooth_device.DeviceInformation()?.Pairing()?;
        let is_paired = pairing.IsPaired()?;

        println!("{}", if is_paired { "Paired" } else { "Not Paired" });

        // ペアリングがまだならペアリングを先にする
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

            let status = result.Status()?;

            println!("Pairing result: {:?}", status);

            if status != DevicePairingResultStatus::Paired {
                return Err(abort_error(&format!("Pairing failed: {:?}", status)));
            }
        }

        // ペアリングが完了 → UUIDの交換
        let device_name = bluetooth_device.Name()?.to_string();

        println!("{}", device_name);

        let uuid = {
            let service = rfcomm_services.Services()?.GetAt(0)?;
            let socket = StreamSocket::new()?;

            socket
                .ConnectWithProtectionLevelAsync(
                    &service.ConnectionHostName()?,
                    &service.ConnectionServiceName()?,
                    SocketProtectionLevel::BluetoothEncryptionWithAuthentication,
                )?
                .await?;

            println!("Connected!");

            init::exchange_uuid(device_uuid, &socket.InputStream()?, &socket.OutputStream()?)
                .await?
        };

        println!("Connection closed.");
        println!("UUID: {}", uuid);

        Ok(uuid)
    }

    fn on_pairing_requested(
        &'static self,
        _: &Option<DeviceInformationCustomPairing>,
        e: &Option<DevicePairingRequestedEventArgs>,
    ) -> windows::core::Result<()> {
        let e = e.as_ref().unwrap();

        println!("On pairing requested");

        if e.PairingKind()? != DevicePairingKinds::ConfirmPinMatch {
            panic!("Only ConfirmPinMatch is allowed for a pairing kind.");
        }

        let rx: oneshot::Receiver<bool>;
        {
            let mut accept_sender = self.accept_sender.lock().unwrap();

            if accept_sender.is_some() {
                // 別のデバイスのペアリング中
                // もしくはなにもせずに return (=ペアリング拒否) もあり？
                return Err(abort_error("Another device is pairing."));
            }

            let tx: oneshot::Sender<bool>;

            (tx, rx) = oneshot::channel();
            *accept_sender = Some(tx);
        }

        let device_name = e.DeviceInformation()?.Name()?.to_string();
        let pin = e.Pin()?.to_string();

        println!("PIN: {}", pin);

        let on_pairing_requested = self.on_pairing_requested.lock().unwrap();

        if let Some(on_pairing_requested) = &*on_pairing_requested {
            on_pairing_requested.call(
                Ok((device_name, pin)),
                napi::threadsafe_function::ThreadsafeFunctionCallMode::NonBlocking,
            );
        }

        let e = e.clone();
        let deferral = e.GetDeferral()?;

        let _: tokio::task::JoinHandle<Result<(), windows::core::Error>> =
            RUNTIME.spawn(async move {
                println!("waiting for the user response...");

                let accept =
                    tokio::time::timeout(Duration::from_secs(10), async { rx.await.unwrap() })
                        .await;

                println!("acceptance: {:#?}", accept);

                match accept {
                    Ok(true) => {
                        println!("accepted");
                        e.Accept()?;
                    }
                    Ok(false) => {
                        println!("denied");
                    }
                    Err(elapsed) => {
                        println!("timed out: {}", elapsed);
                    }
                }

                deferral.Complete()?;

                println!("deferral completed");

                Ok(())
            });

        println!("spawned");

        Ok(())
    }
}
