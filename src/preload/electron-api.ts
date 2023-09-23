import { ipcRenderer } from 'electron'
import { IpcChannel } from './channel'

type BluetoothDevice = {
  name: string
  id: string
}
type RespondToPairingRequest = (
  deviceName: string,
  pin: string
) => Promise<boolean>
type OnBluetoothDeviceFound = (device: BluetoothDevice) => void
type OnBluetoothScanStateChanged = (isScanning: boolean) => void
type OnBluetoothDiscoverableStateChanged = (isDiscoverable: boolean) => void

let respondToPairingRequest: RespondToPairingRequest | null = null
const callbacksBluetoothDeviceFound: OnBluetoothDeviceFound[] = []
const callbacksBluetoothScanStateChanged: OnBluetoothScanStateChanged[] = []
const callbacksBluetoothDiscoverableStateChanged: OnBluetoothDiscoverableStateChanged[] =
  []

ipcRenderer.on(IpcChannel.PairingRequested, async (_, deviceName, pin) => {
  const accept =
    respondToPairingRequest != null
      ? await respondToPairingRequest(deviceName, pin)
      : false
  ipcRenderer.invoke(IpcChannel.RespondToPairingRequest, accept)
})

ipcRenderer.on(IpcChannel.BluetoothDeviceFound, (_, deviceName, deviceId) => {
  for (const callback of callbacksBluetoothDeviceFound)
    callback({ name: deviceName, id: deviceId })
})

ipcRenderer.on(IpcChannel.StateBluetoothScan, (_, isScanning) => {
  for (const callback of callbacksBluetoothScanStateChanged)
    callback(isScanning)
})

ipcRenderer.on(IpcChannel.StateBluetoothDiscoverable, (_, isDiscoverable) => {
  for (const callback of callbacksBluetoothDiscoverableStateChanged)
    callback(isDiscoverable)
})

export const electronApi = {
  startBluetoothScan() {
    ipcRenderer.invoke(IpcChannel.StartBluetoothScan)
  },
  makeDiscoverable() {
    ipcRenderer.invoke(IpcChannel.MakeDiscoverable)
  },
  requestPairing(deviceId: string) {
    ipcRenderer.invoke(IpcChannel.RequestPairing, deviceId)
  },
  setOnPairingRequested(respond: RespondToPairingRequest) {
    respondToPairingRequest = respond
  },
  setOnBluetoothDeviceFound(callback: OnBluetoothDeviceFound) {
    callbacksBluetoothDeviceFound.push(callback)
  },
  setOnBluetoothScanStateChanged(callback: OnBluetoothScanStateChanged) {
    callbacksBluetoothScanStateChanged.push(callback)
  },
  setOnBluetoothDiscoverableStateChanged(
    callback: OnBluetoothDiscoverableStateChanged
  ) {
    callbacksBluetoothDiscoverableStateChanged.push(callback)
  },
  removeOnPairingRequested(respond: RespondToPairingRequest) {
    if (respondToPairingRequest === respond) {
      respondToPairingRequest = null
    }
  },
  removeOnBluetoothDeviceFound(callback: OnBluetoothDeviceFound) {
    const i = callbacksBluetoothDeviceFound.indexOf(callback)
    if (i !== -1) callbacksBluetoothDeviceFound.splice(i, 1)
  },
  removeOnBluetoothScanStateChanged(callback: OnBluetoothScanStateChanged) {
    const i = callbacksBluetoothScanStateChanged.indexOf(callback)
    if (i !== -1) callbacksBluetoothScanStateChanged.splice(i, 1)
  },
  removeOnBluetoothDiscoverableStateChanged(
    callback: OnBluetoothDiscoverableStateChanged
  ) {
    const i = callbacksBluetoothDiscoverableStateChanged.indexOf(callback)
    if (i !== -1) callbacksBluetoothDiscoverableStateChanged.splice(i, 1)
  },
}

export type ElectronApi = typeof electronApi
