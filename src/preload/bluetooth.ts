import { ipcRenderer } from 'electron'
import { IpcChannel, NewIpcChannel } from './channel'

type BluetoothDevice = {
  name: string
  windowsDeviceId: string
}

type RespondToBondRequest = (
  deviceName: string,
  pin: string
) => Promise<boolean>

type OnBluetoothDeviceFound = (device: BluetoothDevice) => void
type OnBluetoothScanStateChanged = (isScanning: boolean) => void
type OnSyncListenStateChanged = (isListening: boolean) => void

let respondToBondRequest: RespondToBondRequest | null = null
const callbacksBluetoothDeviceFound: OnBluetoothDeviceFound[] = []
const callbacksBluetoothScanStateChanged: OnBluetoothScanStateChanged[] = []
const callbacksSyncListenStateChanged: OnSyncListenStateChanged[] = []

ipcRenderer.on(IpcChannel.BondRequested, async (_, deviceName, pin) => {
  const accept =
    respondToBondRequest != null
      ? await respondToBondRequest(deviceName, pin)
      : false
  ipcRenderer.invoke(IpcChannel.RespondToBondRequest, accept)
})

ipcRenderer.on(IpcChannel.BluetoothDeviceFound, (_, bluetoohDevice) => {
  for (const callback of callbacksBluetoothDeviceFound) callback(bluetoohDevice)
})

ipcRenderer.on(IpcChannel.StateBluetoothScan, (_, isScanning) => {
  for (const callback of callbacksBluetoothScanStateChanged)
    callback(isScanning)
})

ipcRenderer.on(IpcChannel.StateSyncRequestListen, (_, isListening) => {
  for (const callback of callbacksSyncListenStateChanged) callback(isListening)
})

export const bluetooth = {
  listenSyncRequest() {
    ipcRenderer.invoke(IpcChannel.ListenSyncRequest)
  },
  startBluetoothScan() {
    ipcRenderer.invoke(NewIpcChannel.StartBluetoothScan)
  },
  stopBluetoothScan() {
    ipcRenderer.invoke(NewIpcChannel.StopBluetoothScan)
  },
  requestSync(windowsDeviceId: string) {
    ipcRenderer.invoke(IpcChannel.RequestSync, windowsDeviceId)
  },

  addOnSyncListenStateChanged(callback: OnSyncListenStateChanged) {
    callbacksSyncListenStateChanged.push(callback)
  },
  addOnBluetoothScanStateChanged(callback: OnBluetoothScanStateChanged) {
    callbacksBluetoothScanStateChanged.push(callback)
  },
  addOnBluetoothDeviceFound(callback: OnBluetoothDeviceFound) {
    callbacksBluetoothDeviceFound.push(callback)
  },
  setOnBondRequested(respond: RespondToBondRequest) {
    respondToBondRequest = respond
  },
  removeOnSyncListenStateChanged(callback: OnSyncListenStateChanged) {
    const i = callbacksSyncListenStateChanged.indexOf(callback)
    if (i !== -1) callbacksSyncListenStateChanged.splice(i, 1)
  },
  removeOnBluetoothScanStateChanged(callback: OnBluetoothScanStateChanged) {
    const i = callbacksBluetoothScanStateChanged.indexOf(callback)
    if (i !== -1) callbacksBluetoothScanStateChanged.splice(i, 1)
  },
  removeOnBluetoothDeviceFound(callback: OnBluetoothDeviceFound) {
    const i = callbacksBluetoothDeviceFound.indexOf(callback)
    if (i !== -1) callbacksBluetoothDeviceFound.splice(i, 1)
  },
  removeOnBondRequested(respond: RespondToBondRequest) {
    if (respondToBondRequest === respond) {
      respondToBondRequest = null
    }
  },
}

export type Bluetooth = typeof bluetooth
