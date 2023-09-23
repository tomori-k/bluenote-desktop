import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import {
  makeDiscoverable,
  startBluetoothScan,
  setOnFound,
  setOnPairingRequested,
  pairAsync,
  acceptPairing,
  rejectPairing,
  stopBluetoothScan,
  unmakeDiscoverable,
} from 'bluenote-bluetooth'
import { IpcChannel } from '../preload/channel'

const createWindow = () => {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  setOnFound(async (_, deviceName, deviceId) => {
    window.webContents.send(
      IpcChannel.BluetoothDeviceFound,
      deviceName,
      deviceId
    )
  })

  setOnPairingRequested((_, deviceName, pin) => {
    window.webContents.send(IpcChannel.PairingRequested, deviceName, pin)
  })

  ipcMain.handle(IpcChannel.StartBluetoothScan, async () => {
    startBluetoothScan()
    window.webContents.send(IpcChannel.StateBluetoothScan, true)
    setTimeout(() => {
      stopBluetoothScan()
      window.webContents.send(IpcChannel.StateBluetoothScan, false)
    }, 60000)
  })

  ipcMain.handle(IpcChannel.MakeDiscoverable, () => {
    makeDiscoverable('d2488522-e4ef-4e09-91be-08b561b5dc6d')
    window.webContents.send(IpcChannel.StateBluetoothDiscoverable, true)
    setTimeout(() => {
      unmakeDiscoverable()
      window.webContents.send(IpcChannel.StateBluetoothDiscoverable, false)
    }, 300000)
  })

  ipcMain.handle(IpcChannel.RespondToPairingRequest, (_, accept) => {
    console.log('accept: ' + accept)
    if (accept) {
      acceptPairing()
    } else {
      rejectPairing()
    }
  })

  ipcMain.handle(IpcChannel.RequestPairing, async (_, deviceId) => {
    console.log('request: ' + deviceId)
    await pairAsync(deviceId)
  })

  window.loadURL('http://localhost:5173')
}

app.whenReady().then(() => {
  createWindow()
})
