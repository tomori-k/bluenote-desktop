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

use crate::{error::Error, init, Result, RUNTIME, UUID_BLUENOTE_RFCOMM_INIT};

pub static ACCEPT_SENDER: Mutex<Option<oneshot::Sender<bool>>> = Mutex::new(None);
pub static ON_PAIRING_REQUESTED: Mutex<Option<ThreadsafeFunction<RequestParamPairing>>> =
    Mutex::new(None);

pub struct Defer<D>(D)
where
    D: Fn() -> ();

impl<D> Drop for Defer<D>
where
    D: Fn() -> (),
{
    fn drop(&mut self) {
        (self.0)();
    }
}

pub struct RequestParamPairing {
    pub device_name: String,
    pub pin: String,
}

pub async fn init(windows_device_id: &str, device_uuid: &str) -> Result<String> {
    let bluetooth_device = BluetoothDevice::FromIdAsync(&HSTRING::from(windows_device_id))?.await?;
    let rfcomm_services = bluetooth_device
        .GetRfcommServicesForIdWithCacheModeAsync(
            &RfcommServiceId::FromUuid(GUID::from(UUID_BLUENOTE_RFCOMM_INIT))?,
            BluetoothCacheMode::Uncached,
        )?
        .await?;

    // 特定のサービスIDをもっているデバイスのみ対象
    if rfcomm_services.Services()?.Size()? == 0 {
        return Err(Error::SyncError(format!(
            "Device seems not to have Bluenote app"
        )));
    }

    let pairing = bluetooth_device.DeviceInformation()?.Pairing()?;
    let is_paired = pairing.IsPaired()?;

    println!("{}", if is_paired { "Paired" } else { "Not Paired" });

    // ペアリングがまだならペアリングを先にする
    if !is_paired {
        pair(&bluetooth_device).await?;
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

        init::exchange_uuid(device_uuid, &socket.InputStream()?, &socket.OutputStream()?).await?
    };

    println!("Connection closed.");
    println!("UUID: {}", uuid);

    Ok(uuid)
}

async fn pair(bluetooth_device: &BluetoothDevice) -> Result<()> {
    let pairing = bluetooth_device.DeviceInformation()?.Pairing()?;
    let custom_pairing = pairing.Custom()?;

    custom_pairing.PairingRequested(&TypedEventHandler::new(on_pairing_requested))?;

    let result = custom_pairing
        .PairWithProtectionLevelAsync(
            DevicePairingKinds::ConfirmPinMatch,
            DevicePairingProtectionLevel::Default,
        )?
        .await?;

    let status = result.Status()?;

    println!("Pairing result: {:?}", status);

    match status {
        DevicePairingResultStatus::Paired => Ok(()),
        _ => Err(Error::SyncError(format!("Pairing failed: {:?}", status))),
    }
}

fn on_pairing_requested(
    _: &Option<DeviceInformationCustomPairing>,
    e: &Option<DevicePairingRequestedEventArgs>,
) -> windows::core::Result<()> {
    let e = e.as_ref().unwrap();

    println!("On pairing requested");

    if e.PairingKind()? != DevicePairingKinds::ConfirmPinMatch {
        panic!("Only ConfirmPinMatch is allowed for a pairing kind.");
    }

    let rx: tokio::sync::oneshot::Receiver<bool>;
    {
        let mut accept_sender = ACCEPT_SENDER.lock().unwrap();

        if accept_sender.is_some() {
            // 別のデバイスのペアリング中
            // もしくはなにもせずに return (=ペアリング拒否) もあり？
            println!("Another device is pairing.");
            return Ok(());
        }

        let tx: tokio::sync::oneshot::Sender<bool>;

        (tx, rx) = oneshot::channel();
        *accept_sender = Some(tx);
    }

    let device_name = e.DeviceInformation()?.Name()?.to_string();
    let pin = e.Pin()?.to_string();

    println!("PIN: {}", pin);

    let on_pairing_requested = ON_PAIRING_REQUESTED.lock().unwrap();

    if let Some(on_pairing_requested) = &*on_pairing_requested {
        on_pairing_requested.call(
            Ok(RequestParamPairing { device_name, pin }),
            napi::threadsafe_function::ThreadsafeFunctionCallMode::NonBlocking,
        );
    }

    let e = e.clone();
    let deferral = e.GetDeferral()?;

    RUNTIME.spawn(async move {
        let _defer = Defer(|| match deferral.Complete() {
            Ok(_) => {
                println!("deferral completed");
            }
            Err(e) => {
                println!("Completing deferral failed: {}", e);
            }
        });

        println!("waiting for the user response...");

        let accept =
            tokio::time::timeout(Duration::from_secs(10), async { rx.await.unwrap() }).await;

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
        };

        Ok::<(), Error>(())
    });

    println!("spawned");

    Ok(())
}
