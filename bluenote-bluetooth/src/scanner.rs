use std::{sync::Mutex, time::Duration};

use napi::threadsafe_function::ThreadsafeFunction;
use tokio::task::JoinHandle;
use windows::{
    core::{h, GUID},
    Devices::{
        Bluetooth::{BluetoothCacheMode, BluetoothDevice, Rfcomm::RfcommServiceId},
        Enumeration::{DeviceInformation, DeviceInformationKind, DeviceWatcher},
    },
    Foundation::TypedEventHandler,
};

use crate::{RUNTIME, UUID_BLUENOTE_RFCOMM_INIT};

pub struct BluetoothScanner {
    watcher: Mutex<Option<DeviceWatcher>>,
    pub on_found: Mutex<Option<ThreadsafeFunction<(String, String)>>>,
    pub on_scan_state_changed: Mutex<Option<ThreadsafeFunction<bool>>>,
}

impl BluetoothScanner {
    pub const fn new() -> Self {
        Self {
            watcher: Mutex::new(None),
            on_found: Mutex::new(None),
            on_scan_state_changed: Mutex::new(None),
        }
    }

    pub fn start(&'static self) -> windows::core::Result<()> {
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

        self.on_scan_state_changed(true);

        RUNTIME.spawn(async {
            tokio::time::sleep(Duration::from_secs(60)).await;
            if let Err(e) = self.stop() {
                println!("Warning: failed to stop scanning: {}", e);
            }
        });

        Ok(())
    }

    pub fn stop(&self) -> windows::core::Result<()> {
        let mut watcher = self.watcher.lock().unwrap();

        if let Some(watcher) = watcher.take() {
            watcher.Stop()?;
        }

        self.on_scan_state_changed(false);

        Ok(())
    }

    fn on_added(
        &'static self,
        _: &Option<DeviceWatcher>,
        info: &Option<DeviceInformation>,
    ) -> windows::core::Result<()> {
        let info = info.as_ref().unwrap();
        let name = info.Name()?.to_string();
        let id = info.Id()?;

        let _: JoinHandle<windows::core::Result<()>> = RUNTIME.spawn(async move {
            let bluetooth_device = BluetoothDevice::FromIdAsync(&id)?.await?;
            let rfcomm_services = bluetooth_device
                .GetRfcommServicesForIdWithCacheModeAsync(
                    &RfcommServiceId::FromUuid(GUID::from(UUID_BLUENOTE_RFCOMM_INIT))?,
                    BluetoothCacheMode::Uncached,
                )?
                .await?;

            if rfcomm_services.Services()?.Size()? == 0 {
                return Ok(());
            }

            let on_found = self.on_found.lock().unwrap();

            if let Some(on_found) = &*on_found {
                on_found.call(
                    Ok((name, id.to_string())),
                    napi::threadsafe_function::ThreadsafeFunctionCallMode::NonBlocking,
                );
            }

            Ok(())
        });

        Ok(())
    }

    fn on_scan_state_changed(&self, scan_state: bool) {
        let on_scan_state_changed = self.on_scan_state_changed.lock().unwrap();

        if let Some(on_scan_state_changed) = &*on_scan_state_changed {
            on_scan_state_changed.call(
                Ok(scan_state),
                napi::threadsafe_function::ThreadsafeFunctionCallMode::NonBlocking,
            );
        }
    }
}
