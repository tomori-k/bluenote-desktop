import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import * as bluetooth from 'bluenote-bluetooth'
import { IpcNotificationChannel, IpcInvokeChannel } from '../preload/channel'
import { Note, PrismaClient, Thread } from '@prisma/client'
import { DeviceService } from './services/device_service'
import { ThreadService } from './services/thread_service'
import { NoteService } from './services/note_service'
import { SyncService } from './services/sync_service'
import { SettingsService } from './services/settings_service'
import { SyncCompanion } from './sync/companion'
import { diff } from './sync/diff'
import { validateSettings } from '../common/settings'

const prisma = new PrismaClient()
const deviceService = new DeviceService(prisma)
const threadService = new ThreadService(prisma)
const noteService = new NoteService(prisma)
const syncService = new SyncService(prisma)
const settingsService = new SettingsService(app.getPath('userData'))

const createWindow = async () => {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#E0E3E1',
      height: 36,
    },
  })

  // メモ内の URL をクリックしたときにブラウザを外部で開く
  window.webContents.on('will-navigate', (event, url) => {
    event.preventDefault()
    shell.openExternal(url)
  })

  // ウィンドウがアクティブになった時
  // todo: 一旦レンダラにアクティブになったことを通知して、同期するかどうかレンダラで判断するみたいなのがよさそう？
  // window.webContents.on('focus', async () => {
  //   await sync()
  // })

  bluetooth.setOnBluetoothDeviceFound(async (_, deviceName, deviceId) => {
    window.webContents.send(IpcNotificationChannel.BluetoothDeviceFound, {
      name: deviceName,
      windowsDeviceId: deviceId,
    })
  })

  bluetooth.setOnBondRequested((_, deviceName, pin) => {
    window.webContents.send(
      IpcNotificationChannel.BondRequested,
      deviceName,
      pin
    )
  })

  bluetooth.setOnSyncRequested((_, uuid) => {
    console.log('Sync requested: ' + uuid)
    bluetooth.respondToSyncRequest(true)
  })

  bluetooth.setOnNowRequested((_) => {
    console.log('Now requested')
    bluetooth.respondToNowRequest(new Date().toUTCString())
  })

  bluetooth.setOnThreadUpdatesRequested(async (_, uuid, updatedEnd) => {
    console.log(`Thread updates requested: ${uuid}, ${updatedEnd}`)

    const companion = await deviceService.find(uuid)

    if (companion == null) {
      throw new Error('device is not found')
    }

    const updated = await syncService.getUpdatedThreads(
      companion.syncedAt,
      new Date(updatedEnd)
    )

    const json = JSON.stringify(updated)
    bluetooth.respondToThreadUpdatesRequest(json)
  })

  bluetooth.setOnAllNotesInThreadRequested(async (_, threadId) => {
    console.log('all notes in thread requested')

    const threads = await syncService.getAllNotesInThread(threadId)
    const json = JSON.stringify(threads)
    bluetooth.respondToAllNotesInThreadRequest(json)
  })

  bluetooth.setOnAllNotesInTreeRequested(async (_, parentId) => {
    console.log('All notes in tree requested')

    const threads = await syncService.getAllNotesInTree(parentId)
    const json = JSON.stringify(threads)
    bluetooth.respondToAllNotesInTreeRequest(json)
  })

  bluetooth.setOnNoteUpdatesInThreadRequested(
    async (_, uuid, threadId, updatedEnd) => {
      console.log('Note updates in thread requested')

      const companion = await deviceService.find(uuid)

      if (companion == null) {
        throw new Error('device is not found')
      }

      const updated = await syncService.getUpdatedNotesInThread(
        threadId,
        companion.syncedAt,
        new Date(updatedEnd)
      )

      const json = JSON.stringify(updated)
      bluetooth.respondToNoteUpdatesInThreadRequest(json)
    }
  )

  bluetooth.setOnNoteUpdatesInTreeRequested(
    async (_, uuid, parentId, updatedEnd) => {
      console.log('Note updates in tree requested')

      const companion = await deviceService.find(uuid)

      if (companion == null) {
        throw new Error('device is not found')
      }

      const updated = await syncService.getUpdatedNotesInTree(
        parentId,
        companion.syncedAt,
        new Date(updatedEnd)
      )

      const json = JSON.stringify(updated)
      bluetooth.respondToNoteUpdatesInTreeRequest(json)
    }
  )

  bluetooth.setOnUpdateSyncedAtRequested(async (_, uuid, updatedEnd) => {
    console.log('Update synced at requested')

    const companion = await deviceService.find(uuid)

    if (companion == null) {
      throw new Error('device not found')
    }

    await deviceService.updateSyncedAt(companion, new Date(updatedEnd))

    bluetooth.respondToUpdateSyncedAtRequest()
  })

  bluetooth.setOnUuidExchanged(async (_, name, uuid) => {
    await deviceService.enableSyncWith(uuid, name)
  })

  bluetooth.setOnScanStateChanged((_, isScanning) => {
    window.webContents.send(
      IpcNotificationChannel.StateBluetoothScan,
      isScanning
    )
  })

  bluetooth.setOnInitServerStateChanged((_, isRunning) => {
    window.webContents.send(
      IpcNotificationChannel.InitServerStateChanged,
      isRunning
    )
  })

  // これ完璧では？？
  // 登録忘れがあると登録部分で型エラー
  const IpcHandlers = {
    [IpcInvokeChannel.StartBluetoothScan]: () => {
      bluetooth.startBluetoothScan()
    },
    [IpcInvokeChannel.StopBluetoothScan]: () => {
      bluetooth.stopBluetoothScan()
    },
    [IpcInvokeChannel.GetSyncEnabledDevices]: async () => {
      return await deviceService.getAllSyncEnabledDevices()
    },
    [IpcInvokeChannel.DisableSync]: async (
      _: Electron.IpcMainInvokeEvent,
      deviceUuid: string
    ) => {
      await deviceService.disableSyncWith(deviceUuid)
    },
    [IpcInvokeChannel.InitSync]: async (
      _: Electron.IpcMainInvokeEvent,
      windowsDeviceId: string
    ) => {
      console.log('request: ' + windowsDeviceId)
      const myUuid = await deviceService.getMyUuid()
      const uuid = await bluetooth.initClient(windowsDeviceId, myUuid)
      console.log(`Exchanged UUID: ${uuid}`)

      await deviceService.enableSyncWith(uuid, 'TODO: READABLE NAME')
    },
    [IpcInvokeChannel.StartInitServer]: async () => {
      bluetooth.startInitServer(await deviceService.getMyUuid())
    },
    [IpcInvokeChannel.StopInitServer]: () => {
      bluetooth.stopInitServer()
    },
    [IpcInvokeChannel.RespondToBondRequest]: (
      _: Electron.IpcMainInvokeEvent,
      accept: boolean
    ) => {
      console.log('accept: ' + accept)
      // TODO: UI からの入力を受け取る
      bluetooth.respondToBondRequest(accept)
    },
    [IpcInvokeChannel.GetAllThreads]: async (
      _: Electron.IpcMainInvokeEvent
    ) => {
      return await threadService.getAllThreads()
    },
    [IpcInvokeChannel.CreateThread]: async (
      _: Electron.IpcMainInvokeEvent,
      thread: Thread // TODO: ほんとは unknown にして値の検証をすべき
    ) => {
      return await threadService.create(thread.name)
    },
    [IpcInvokeChannel.RenameThread]: async (
      _: Electron.IpcMainInvokeEvent,
      thread: Thread
    ) => {
      return await threadService.rename(thread, thread.name)
    },
    [IpcInvokeChannel.ChangeDisplayMode]: async (
      _: Electron.IpcMainInvokeEvent,
      thread: Thread,
      displayMode: string
    ) => {
      if (displayMode !== 'monologue' && displayMode !== 'scrap') {
        throw new Error('invalid display mode')
      }
      return await threadService.changeDisplayMode(thread, displayMode)
    },
    [IpcInvokeChannel.RemoveThread]: async (
      _: Electron.IpcMainInvokeEvent,
      threadId: string
    ) => {
      const thread = await threadService.get(threadId)
      await threadService.remove(thread)
    },

    [IpcInvokeChannel.FindNotes]: async (
      _: Electron.IpcMainInvokeEvent,
      searchText: string,
      lastId: string | null,
      count: number
    ) => {
      return await noteService.findNotes(searchText, lastId, count)
    },

    [IpcInvokeChannel.FindNotesInThread]: async (
      _: Electron.IpcMainInvokeEvent,
      thread: Thread,
      searchText: string,
      lastId: string | null,
      count: number,
      desc: boolean
    ) => {
      return await noteService.findInThread(
        thread,
        searchText,
        lastId,
        count,
        desc
      )
    },
    [IpcInvokeChannel.FindNotesInTree]: async (
      _: Electron.IpcMainInvokeEvent,
      parent: Note,
      searchText: string,
      lastId: string | null,
      count: number,
      desc: boolean
    ) => {
      return await noteService.findInTree(
        parent,
        searchText,
        lastId,
        count,
        desc
      )
    },
    [IpcInvokeChannel.FindNotesInTrash]: async (
      _: Electron.IpcMainInvokeEvent,
      searchText: string,
      lastId: string | null,
      count: number
    ) => {
      return await noteService.findInTrash(searchText, lastId, count)
    },

    [IpcInvokeChannel.CreateNoteInThread]: async (
      _: Electron.IpcMainInvokeEvent,
      content: string,
      thread: Thread
    ) => {
      return await noteService.createInThread(content, thread)
    },

    [IpcInvokeChannel.CreateNoteInTree]: async (
      _: Electron.IpcMainInvokeEvent,
      content: string,
      parent: Note
    ) => {
      return await noteService.createInTree(content, parent)
    },

    [IpcInvokeChannel.EditNote]: async (
      _: Electron.IpcMainInvokeEvent,
      content: string,
      note: Note
    ) => {
      return await noteService.edit(content, note)
    },

    [IpcInvokeChannel.RemoveNote]: async (
      _: Electron.IpcMainInvokeEvent,
      note: Note
    ) => {
      await noteService.remove(note)
    },

    [IpcInvokeChannel.RestoreNote]: async (
      _: Electron.IpcMainInvokeEvent,
      note: Note
    ) => {
      await noteService.restore(note)
    },

    [IpcInvokeChannel.DeleteNote]: async (
      _: Electron.IpcMainInvokeEvent,
      note: Note
    ) => {
      await noteService.deleteNote(note)
    },

    [IpcInvokeChannel.Sync]: async () => {
      await sync()
    },

    [IpcInvokeChannel.GetSettings]: async () => {
      return await settingsService.getSettings()
    },

    [IpcInvokeChannel.TransferToMain]: (
      _: Electron.IpcMainInvokeEvent,
      value: unknown
    ) => {
      const validated = validateSettings(value)
      settingsService.updateSettings(validated)
    },
  }

  // ハンドラの登録
  for (const channel of IpcInvokeChannel.all) {
    ipcMain.handle(channel, IpcHandlers[channel])
  }

  async function sync() {
    // 対象のデバイスに接続し、プロトコルのバージョンや同期の許可のチェックを行う

    const deviceIds = await bluetooth.enumerateSyncCompanions()
    const myUuid = await deviceService.getMyUuid()

    for (const deviceId of deviceIds) {
      const syncClient = bluetooth.SyncClient.createInstance(myUuid, deviceId)
      let success = false

      try {
        await syncClient.beginSync()

        const companion = new SyncCompanion(syncClient)
        const d = await diff(companion, threadService, noteService, new Date())

        console.log('diff', d)

        await syncService.updateByDiff(d)

        success = true
      } finally {
        await syncClient.endSync(success)
      }
    }

    console.log('sync finished.')
  }

  // データ同期サーバ起動
  bluetooth.startSyncServer()

  window.loadURL('http://localhost:5173')
}

app.whenReady().then(async () => {
  createWindow()
})

app.on('before-quit', async () => {
  console.log('quitting...')
  bluetooth.stopSyncServer()
  await prisma.$disconnect()
})

app.on('window-all-closed', async () => {
  await settingsService.saveSettings()
})
