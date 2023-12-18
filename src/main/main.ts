import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import * as bluetooth from 'bluenote-bluetooth'
import { IpcChannel, NewIpcChannel } from '../preload/channel'
import { PrismaClient } from '@prisma/client'
import { DeviceService } from './services/device_service'
import { ThreadService } from './services/thread_service'
import { NoteService } from './services/note_service'
import { SyncService } from './services/sync_service'
import { SyncCompanion } from './sync/companion'
import { diff } from './sync/diff'

const prisma = new PrismaClient()
const deviceService = new DeviceService(prisma)
const threadService = new ThreadService(prisma)
const noteService = new NoteService(prisma)
const syncService = new SyncService(prisma)

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
  window.webContents.on('focus', async () => {
    await sync()
  })

  bluetooth.setOnBluetoothDeviceFound(async (_, deviceName, deviceId) => {
    window.webContents.send(IpcChannel.BluetoothDeviceFound, {
      name: deviceName,
      windowsDeviceId: deviceId,
    })
  })

  bluetooth.setOnBondRequested((_, deviceName, pin) => {
    window.webContents.send(IpcChannel.BondRequested, deviceName, pin)
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

  // これ完璧では？？
  // 登録忘れがあると登録部分で型エラー
  const IpcHandlers = {
    [NewIpcChannel.StartBluetoothScan]: () => {
      bluetooth.startBluetoothScan()
    },
    [NewIpcChannel.StopBluetoothScan]: () => {
      bluetooth.stopBluetoothScan()
    },
  }

  // ハンドラの登録
  for (const channel of NewIpcChannel.all) {
    ipcMain.handle(channel, IpcHandlers[channel])
  }

  // setOnNoteUpdatesRequested(async (_, uuid) => {
  //   console.log(`Update requested from: ${uuid}`)

  //   // 最終同期時刻、現在時刻を取得
  //   const device = await prisma.device.findFirst({
  //     where: {
  //       id: uuid,
  //       syncEnabled: true,
  //     },
  //   })
  //   const timestamp = new Date()

  //   // 同期が有効であるデバイスが DB になければ
  //   // メモの送信を拒否
  //   if (device == null) {
  //     respondToNoteUpdatesRequest(null)
  //     return
  //   }

  //   // 更新分を取得

  //   const threadUpdated = await prisma.thread.findMany({
  //     where: {
  //       updatedById: myDeviceId,
  //       updatedAt: {
  //         gte: device.syncedAt,
  //         lt: timestamp,
  //       },
  //     },
  //   })
  //   const threadDeleted = await prisma.deletedThread.findMany({
  //     where: {
  //       deletedAt: {
  //         gte: device.syncedAt,
  //         lt: timestamp,
  //       },
  //     },
  //   })
  //   const noteUpdated = await prisma.note.findMany({
  //     where: {
  //       editorId: myDeviceId,
  //       updatedAt: {
  //         gte: device.syncedAt,
  //         lt: timestamp,
  //       },
  //     },
  //   })
  //   const noteDeleted = await prisma.deletedNote.findMany({
  //     where: {
  //       deletedAt: {
  //         gte: device.syncedAt,
  //         lt: timestamp,
  //       },
  //     },
  //   })

  //   // 最終同期時刻を更新
  //   await prisma.device.update({
  //     where: {
  //       id: device.id,
  //     },
  //     data: {
  //       syncedAt: timestamp,
  //     },
  //   })

  //   const json = JSON.stringify({
  //     thread: {
  //       updated: threadUpdated,
  //       deleted: threadDeleted,
  //     },
  //     note: {
  //       updated: noteUpdated,
  //       deleted: noteDeleted,
  //     },
  //   })

  //   console.log(json)

  //   // Rust 側に送信
  //   respondToNoteUpdatesRequest(json)
  // })

  bluetooth.setOnUuidExchanged(async (_, name, uuid) => {
    await deviceService.enableSyncWith(uuid, name)
  })

  bluetooth.setOnScanStateChanged((_, isScanning) => {
    window.webContents.send(IpcChannel.StateBluetoothScan, isScanning)
  })

  bluetooth.setOnInitServerStateChanged((_, isRunning) => {
    window.webContents.send(IpcChannel.StateSyncRequestListen, isRunning)
  })

  ipcMain.handle(IpcChannel.ListenSyncRequest, async () => {
    bluetooth.startInitServer(await deviceService.getMyUuid())
  })

  // ipcMain.handle(IpcChannel.StartBluetoothScan, async () => {
  //   bluetooth.startBluetoothScan()
  // })

  ipcMain.handle(IpcChannel.GetSyncDevices, async () => {
    const devices = await deviceService.getAllSyncEnabledDevices()

    return devices.map((x) => ({
      uuid: x.id,
      name: x.name,
    }))
  })

  ipcMain.handle(IpcChannel.RequestSync, async (_, windowsDeviceId) => {
    console.log('request: ' + windowsDeviceId)
    const myUuid = await deviceService.getMyUuid()
    const uuid = await bluetooth.initClient(windowsDeviceId, myUuid)
    console.log(`Exchanged UUID: ${uuid}`)

    await deviceService.enableSyncWith(uuid, 'TODO: READABLE NAME')
  })

  ipcMain.handle(IpcChannel.DisableSync, async (_, deviceUuid) => {
    await deviceService.disableSyncWith(deviceUuid)
  })

  ipcMain.handle(IpcChannel.RespondToBondRequest, (_, accept) => {
    console.log('accept: ' + accept)
    // TODO: UI からの入力を受け取る
    bluetooth.respondToBondRequest(accept)
  })

  // DBアクセス

  ipcMain.handle(IpcChannel.GetAllThreads, async (_) => {
    return await threadService.getAllThreads()
  })

  ipcMain.handle(IpcChannel.CreateThread, async (_, thread) => {
    return await threadService.create(thread.name)
  })

  ipcMain.handle(IpcChannel.RenameThread, async (_, thread) => {
    return await threadService.rename(thread, thread.name)
  })

  ipcMain.handle(
    IpcChannel.ChangeDisplayMode,
    async (_, thread, displayMode) => {
      if (displayMode !== 'monologue' && displayMode !== 'scrap') {
        throw new Error('invalid display mode')
      }
      return await threadService.changeDisplayMode(thread, displayMode)
    }
  )

  ipcMain.handle(IpcChannel.RemoveThread, async (_, threadId) => {
    const thread = await threadService.get(threadId)
    await threadService.remove(thread)
  })

  ipcMain.handle(
    IpcChannel.FindNotesInThread,
    async (_, thread, searchText, lastId, count, desc) => {
      return await noteService.findInThread(
        thread,
        searchText,
        lastId,
        count,
        desc
      )
    }
  )

  ipcMain.handle(
    IpcChannel.FindNotesInTree,
    async (_, parent, searchText, lastId, count, desc) => {
      return await noteService.findInTree(
        parent,
        searchText,
        lastId,
        count,
        desc
      )
    }
  )

  ipcMain.handle(
    IpcChannel.FindNotesInTrash,
    async (_, searchText, lastId, count) => {
      return await noteService.findInTrash(searchText, lastId, count)
    }
  )

  ipcMain.handle(IpcChannel.CreateNoteInThread, async (_, content, thread) => {
    return await noteService.createInThread(content, thread)
  })

  ipcMain.handle(IpcChannel.CreateNoteInTree, async (_, content, parent) => {
    return await noteService.createInTree(content, parent)
  })

  ipcMain.handle(IpcChannel.EditNote, async (_, content, note) => {
    return await noteService.edit(content, note)
  })

  ipcMain.handle(IpcChannel.RemoveNote, async (_, note) => {
    await noteService.remove(note)
  })

  ipcMain.handle(IpcChannel.RestoreNote, async (_, note) => {
    await noteService.restore(note)
  })

  ipcMain.handle(IpcChannel.DeleteNote, async (_, note) => {
    await noteService.deleteNote(note)
  })

  // type DeletedThread = {
  //   id: string
  //   deletedAt: Date
  // }

  // type DeletedNote = {
  //   id: string
  //   deletedAt: Date
  // }

  // type ThreadParsed = Omit<Thread, 'createdAt' | 'updatedAt'> & {
  //   createdAt: string
  //   updatedAt: string
  // }

  // type DeletedThreadParsed = Omit<DeletedThread, 'deletedAt'> & {
  //   deletedAt: string
  // }

  // type NoteParsed = Omit<Note, 'createdAt' | 'updatedAt'> & {
  //   createdAt: string
  //   updatedAt: string
  // }

  // type DeletedNoteParsed = Omit<DeletedNote, 'deletedAt'> & {
  //   deletedAt: string
  // }

  // type SyncData = {
  //   thread: {
  //     updated: ThreadParsed[]
  //     deleted: DeletedThreadParsed[]
  //   }
  //   note: {
  //     updated: NoteParsed[]
  //     deleted: DeletedNoteParsed[]
  //   }
  // }

  // interface SyncCompanion {
  //   // スレッドの更新状況を取得
  //   getThreadUpdates(): Promise<Thread[]>

  //   // 指定したスレッドのメモをすべて取得(trash = 1 も含む)
  //   getAllNotesInThread(thread: Thread): Promise<Note[]>

  //   // 指定したスレッドのメモをすべて取得(trash = 1 も含む)
  //   getAllNotesInNote(note: Note): Promise<Note[]>

  //   // 指定したスレッド直属のメモの更新状況取得
  //   getNoteUpdatesInThread(thread: Thread): Promise<Note[]>

  //   // 指定したメモのツリーのメモの更新状況を取得
  //   getNoteUpdatesInTree(note: Note): Promise<Note[]>
  // }

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

        await syncService.updateByDiff(d)

        success = true
      } finally {
        await syncClient.endSync(success)
      }

      // await syncClient.beginSync()

      // console.log('Requesting threads update...')

      // const json = await syncClient.requestData(
      //   1,
      //   'c3592051-f873-44a7-b204-332b7b11ba96'
      // )
      // console.log(json)
      // await syncClient.endSync(false)
    }

    // const sync = startSync()

    // // 相手とやりとりを行い、更新差分を計算
    // const companion = new Companion(sync)
    // const d = diff(companion)

    // // DB を更新し、接続の終了処理を行う
    // try {
    //     updateDb()
    // }
    // catch(e) {
    //     sync.finish(false)
    //     throw e
    // }

    // sync.finish(true)

    // await fetchNoteUpdatesFromNearbyDevices(myDeviceId)

    // const threadUpdates = new Map<
    //   string,
    //   | { updateType: 'update'; value: Thread }
    //   | { updateType: 'delete'; value: DeletedThread }
    // >()
    // const noteUpdates = new Map<
    //   string,
    //   | { updateType: 'update'; value: Note }
    //   | { updateType: 'delete'; value: DeletedNote }
    // >()

    // // 更新情報を合算
    // for (const json of jsonList) {
    //   const syncData = JSON.parse(json) as SyncData

    //   for (const updated of syncData.thread.updated) {
    //     const latest = threadUpdates.get(updated.id)
    //     const latestUpdateAt =
    //       latest?.updateType === 'update'
    //         ? latest.value.updatedAt
    //         : latest?.updateType === 'delete'
    //         ? latest.value.deletedAt
    //         : new Date(0)
    //     const updatedAt = new Date(updated.updatedAt)

    //     if (updatedAt > latestUpdateAt) {
    //       threadUpdates.set(updated.id, {
    //         updateType: 'update',
    //         value: {
    //           ...updated,
    //           createdAt: new Date(updated.createdAt),
    //           updatedAt: new Date(updated.updatedAt),
    //         },
    //       })
    //     }
    //   }

    //   for (const deleted of syncData.thread.deleted) {
    //     const latest = threadUpdates.get(deleted.id)
    //     const latestUpdateAt =
    //       latest?.updateType === 'update'
    //         ? latest.value.updatedAt
    //         : latest?.updateType === 'delete'
    //         ? latest.value.deletedAt
    //         : new Date(0)
    //     const deletedAt = new Date(deleted.deletedAt)

    //     if (deletedAt > latestUpdateAt) {
    //       threadUpdates.set(deleted.id, {
    //         updateType: 'delete',
    //         value: {
    //           ...deleted,
    //           deletedAt: deletedAt,
    //         },
    //       })
    //     }
    //   }

    //   for (const updated of syncData.note.updated) {
    //     const latest = noteUpdates.get(updated.id)
    //     const latestUpdateAt =
    //       latest?.updateType === 'update'
    //         ? latest.value.updatedAt
    //         : latest?.updateType === 'delete'
    //         ? latest.value.deletedAt
    //         : new Date(0)
    //     const updatedAt = new Date(updated.updatedAt)

    //     if (updatedAt > latestUpdateAt) {
    //       noteUpdates.set(updated.id, {
    //         updateType: 'update',
    //         value: {
    //           ...updated,
    //           createdAt: new Date(updated.createdAt),
    //           updatedAt: new Date(updated.updatedAt),
    //         },
    //       })
    //     }
    //   }

    //   for (const deleted of syncData.note.deleted) {
    //     const latest = noteUpdates.get(deleted.id)
    //     const latestUpdateAt =
    //       latest?.updateType === 'update'
    //         ? latest.value.updatedAt
    //         : latest?.updateType === 'delete'
    //         ? latest.value.deletedAt
    //         : new Date(0)
    //     const deletedAt = new Date(deleted.deletedAt)

    //     if (deletedAt > latestUpdateAt) {
    //       noteUpdates.set(deleted.id, {
    //         updateType: 'delete',
    //         value: { ...deleted, deletedAt: deletedAt },
    //       })
    //     }
    //   }
    // }

    // // DB に保存

    // const threadUpdated = []
    // const threadDeletedIds = []
    // const noteUpdated = []
    // const noteDeletedIds = []

    // for (const update of threadUpdates.values()) {
    //   if (update.updateType === 'update') {
    //     threadUpdated.push(update.value)
    //   } else {
    //     threadDeletedIds.push(update.value.id)
    //   }
    // }

    // for (const update of noteUpdates.values()) {
    //   if (update.updateType === 'update') {
    //     noteUpdated.push(update.value)
    //   } else {
    //     noteDeletedIds.push(update.value.id)
    //   }
    // }

    // console.log(threadUpdated)
    // console.log(threadDeletedIds)
    // console.log(noteUpdated)
    // console.log(noteDeletedIds)

    // for (const update of threadUpdated) {
    //   await prisma.thread.upsert({
    //     where: {
    //       id: update.id,
    //     },
    //     create: {
    //       id: update.id,
    //       name: update.name,
    //       displayMode: update.displayMode,
    //       createdAt: update.createdAt,
    //       updatedAt: update.updatedAt,
    //       removed: update.removed,
    //       updatedById: update.updatedById,
    //     },
    //     update: {
    //       name: update.name,
    //       displayMode: update.displayMode,
    //       updatedAt: update.updatedAt,
    //       removed: update.removed,
    //       updatedById: update.updatedById,
    //     },
    //   })
    // }

    // for (const update of noteUpdated) {
    //   await prisma.note.upsert({
    //     where: {
    //       id: update.id,
    //     },
    //     create: {
    //       id: update.id,
    //       content: update.content,
    //       editorId: update.editorId,
    //       createdAt: update.createdAt,
    //       updatedAt: update.updatedAt,
    //       threadId: update.threadId,
    //       parentId: update.parentId,
    //       removed: update.removed,
    //     },
    //     update: {
    //       content: update.content,
    //       editorId: update.editorId,
    //       updatedAt: update.updatedAt,
    //       removed: update.removed,
    //     },
    //   })
    // }

    // await prisma.thread.deleteMany({
    //   where: {
    //     id: {
    //       in: threadDeletedIds,
    //     },
    //   },
    // })

    // await prisma.note.deleteMany({
    //   where: {
    //     id: {
    //       in: noteDeletedIds,
    //     },
    //   },
    // })

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
