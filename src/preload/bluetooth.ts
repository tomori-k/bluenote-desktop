import { ipcRenderer } from 'electron'
import { IpcChannel, IpcNotificationChannel, NewIpcChannel } from './channel'

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
type OnInitServerStateChanged = (isRunning: boolean) => void

let respondToBondRequest: RespondToBondRequest | null = null
const callbacksBluetoothDeviceFound: OnBluetoothDeviceFound[] = []
const callbacksBluetoothScanStateChanged: OnBluetoothScanStateChanged[] = []
const callbacksInitServerStateChanged: OnInitServerStateChanged[] = []

ipcRenderer.on(
  IpcNotificationChannel.BondRequested,
  async (_, deviceName, pin) => {
    const accept =
      respondToBondRequest != null
        ? await respondToBondRequest(deviceName, pin)
        : false
    ipcRenderer.invoke(NewIpcChannel.RespondToBondRequest, accept)
  }
)

ipcRenderer.on(IpcChannel.BluetoothDeviceFound, (_, bluetoohDevice) => {
  for (const callback of callbacksBluetoothDeviceFound) callback(bluetoohDevice)
})

ipcRenderer.on(IpcChannel.StateBluetoothScan, (_, isScanning) => {
  for (const callback of callbacksBluetoothScanStateChanged)
    callback(isScanning)
})

ipcRenderer.on(
  IpcNotificationChannel.InitServerStateChanged,
  (_, isListening) => {
    for (const callback of callbacksInitServerStateChanged)
      callback(isListening)
  }
)

export const bluetooth = {
  startBluetoothScan() {
    ipcRenderer.invoke(NewIpcChannel.StartBluetoothScan)
  },
  stopBluetoothScan() {
    ipcRenderer.invoke(NewIpcChannel.StopBluetoothScan)
  },

  async initSync(windowsDeviceId: string) {
    await ipcRenderer.invoke(NewIpcChannel.InitSync, windowsDeviceId)
  },
  async startInitServer() {
    await ipcRenderer.invoke(NewIpcChannel.StartInitServer)
  },
  stopInitServer() {
    ipcRenderer.invoke(NewIpcChannel.StopInitServer)
  },

  addOnInitServerStateChanged(callback: OnInitServerStateChanged) {
    callbacksInitServerStateChanged.push(callback)
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
  removeOnInitServerStateChanged(callback: OnInitServerStateChanged) {
    const i = callbacksInitServerStateChanged.indexOf(callback)
    if (i !== -1) callbacksInitServerStateChanged.splice(i, 1)
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
