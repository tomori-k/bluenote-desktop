import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import {
  startBluetoothScan,
  setOnFound,
  setOnPairingRequested,
  pair,
  respondToPairRequest,
  stopBluetoothScan,
  sync,
  startSyncServer,
  stopSyncServer,
  setOnUpdatesRequested,
  passUpdates,
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

  setOnUpdatesRequested(async (_, uuid) => {
    console.log(`Update requested from: ${uuid}`)
    await new Promise((x) => setTimeout(x, 3000))
    passUpdates('[]')
  })

  ipcMain.handle(IpcChannel.StartBluetoothScan, async () => {
    startBluetoothScan()
    window.webContents.send(IpcChannel.StateBluetoothScan, true)
    setTimeout(() => {
      stopBluetoothScan()
      window.webContents.send(IpcChannel.StateBluetoothScan, false)
    }, 60000)
  })

  ipcMain.handle(IpcChannel.RespondToPairingRequest, (_, accept) => {
    console.log('accept: ' + accept)
    respondToPairRequest(accept)
  })

  ipcMain.handle(IpcChannel.RequestPairing, async (_, deviceId) => {
    console.log('request: ' + deviceId)
    await pair(deviceId)
  })

  ipcMain.handle(IpcChannel.GetAllNotes, async (_) => {
    const notes = await sync(
      'b2ee7fae-e0dd-4f44-9171-92980fc5f84c' /* 自分のUUID */
    )
    console.log(notes)
    return []
  })

  // データ同期サーバ起動
  startSyncServer()

  window.loadURL('http://localhost:5173')
}

app.whenReady().then(() => {
  createWindow()
})

app.on('before-quit', () => {
  console.log('quitting...')
  stopSyncServer()
})
