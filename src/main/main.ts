import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import * as bluetooth from 'bluenote-bluetooth'
import { IpcChannel } from '../preload/channel'
import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import { Thread } from '../common/thread'
import { Note } from '../common/note'

const prisma = new PrismaClient()

const createWindow = async () => {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  window.webContents.on('will-navigate', (event, url) => {
    event.preventDefault()
    shell.openExternal(url)
  })

  window.webContents.on('focus', async () => {
    await sync()
  })

  const myDeviceId = await (async function () {
    // 初回起動時に自身のIDを生成
    let device = await prisma.device.findFirst({ where: { me: true } })
    if (device == null) {
      device = await prisma.device.create({
        data: {
          id: randomUUID(),
          name: '',
          me: true,
          syncedAt: new Date(0),
          syncEnabled: false,
        },
      })
    }
    return device.id
  })()

  console.log(`My device id: ${myDeviceId}`)

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

  bluetooth.setOnThreadUpdatesRequested((_, uuid, updatedEnd) => {
    console.log(`Thread updates requested: ${uuid}, ${updatedEnd}`)
    bluetooth.respondToThreadUpdatesRequest('[]')
  })

  bluetooth.setOnAllNotesInThreadRequested((_, uuid, threadId) => {
    console.log('all notes in thread requested')
    bluetooth.respondToAllNotesInThreadRequest('[]')
  })

  bluetooth.setOnAllNotesInTreeRequested((_, uuid, parentId) => {
    console.log('All notes in tree requested')
    bluetooth.respondToAllNotesInTreeRequest('[]')
  })

  bluetooth.setOnNoteUpdatesInThreadRequested(
    (_, uuid, threadId, updatedEnd) => {
      console.log('Note updates in thread requested')
      bluetooth.respondToNoteUpdatesInThreadRequest('[]')
    }
  )

  bluetooth.setOnNoteUpdatesInTreeRequested((_, uuid, parentId, updatedEnd) => {
    console.log('Note updates in tree requested')
    bluetooth.respondToNoteUpdatesInTreeRequest('[]')
  })

  bluetooth.setOnUpdateSyncedAtRequested((_, uuid, updatedEnd) => {
    console.log('Update synced at requested')
    // finish
    bluetooth.respondToUpdateSyncedAtRequest()
  })

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
    await prisma.device.create({
      data: {
        id: uuid,
        name: name,
        me: false,
        syncEnabled: true,
        syncedAt: new Date(0),
      },
    })
  })

  bluetooth.setOnScanStateChanged((_, isScanning) => {
    window.webContents.send(IpcChannel.StateBluetoothScan, isScanning)
  })

  bluetooth.setOnInitServerStateChanged((_, isRunning) => {
    window.webContents.send(IpcChannel.StateSyncRequestListen, isRunning)
  })

  ipcMain.handle(IpcChannel.ListenSyncRequest, () => {
    bluetooth.startInitServer(myDeviceId)
  })

  ipcMain.handle(IpcChannel.StartBluetoothScan, async () => {
    bluetooth.startBluetoothScan()
  })

  ipcMain.handle(IpcChannel.GetSyncDevices, async () => {
    const devices = await prisma.device.findMany({
      where: {
        me: false,
        syncEnabled: true,
      },
    })

    return devices.map((x) => ({
      uuid: x.id,
      name: x.name,
    }))
  })

  ipcMain.handle(IpcChannel.RequestSync, async (_, windowsDeviceId) => {
    console.log('request: ' + windowsDeviceId)
    const uuid = await bluetooth.initClient(windowsDeviceId, myDeviceId)
    console.log(`Exchanged UUID: ${uuid}`)

    // TODO: DB に登録
  })

  ipcMain.handle(IpcChannel.DisableSync, async (_, deviceUuid) => {
    await prisma.device.update({
      where: {
        id: deviceUuid,
      },
      data: {
        syncEnabled: false,
      },
    })
  })

  ipcMain.handle(IpcChannel.RespondToBondRequest, (_, accept) => {
    console.log('accept: ' + accept)
    bluetooth.respondToBondRequest(accept)
  })

  // DBアクセス

  ipcMain.handle(IpcChannel.GetAllThreads, async (_) => {
    return await prisma.thread.findMany({
      where: {
        removed: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
  })

  ipcMain.handle(IpcChannel.CreateThread, async (_, thread) => {
    if (thread.displayMode !== 'monologue' && thread.displayMode !== 'scrap') {
      throw new Error('display mode must be monologue or scrap')
    }
    return await prisma.thread.create({
      data: {
        id: randomUUID(),
        name: thread.name,
        displayMode: thread.displayMode,
        removed: false,
        updatedById: myDeviceId,
      },
    })
  })

  ipcMain.handle(IpcChannel.UpdateThread, async (_, thread) => {
    const update = {
      ...(thread.name != null ? { name: thread.name } : {}),
      ...(thread.displayMode != null
        ? { displayMode: thread.displayMode }
        : {}),
      ...(thread.removed != null ? { removed: thread.removed } : {}),
    }
    return await prisma.thread.update({
      where: {
        id: thread.id,
      },
      data: update,
    })
  })

  ipcMain.handle(IpcChannel.RemoveThread, async (_, threadId) => {
    await prisma.thread.update({
      where: {
        id: threadId,
      },
      data: {
        removed: true,
        notes: {
          updateMany: {
            where: {
              threadId: threadId,
            },
            data: {
              removed: true,
            },
          },
        },
      },
    })
  })

  ipcMain.handle(IpcChannel.DeleteThread, async (_, threadId) => {
    await prisma.thread.delete({
      where: {
        id: threadId,
      },
    })
  })

  ipcMain.handle(IpcChannel.GetAllNotes, async (_) => {
    const notes = await prisma.note.findMany({})

    console.log(notes)

    return notes
  })

  ipcMain.handle(IpcChannel.GetNotes, async (_, options) => {
    const threadId =
      options.threadId != null ? { threadId: options.threadId } : {}
    const parentId =
      options.parentId !== void 0 ? { parentId: options.parentId } : {}
    const removed = options.removed != null ? { removed: options.removed } : {}

    return await prisma.note.findMany({
      where: {
        ...threadId,
        ...parentId,
        ...removed,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
  })

  ipcMain.handle(IpcChannel.SearchNote, async (_, searchOption) => {
    return await prisma.note.findMany({
      where: {
        ...(searchOption.text != null
          ? {
              content: {
                contains: searchOption.text,
              },
            }
          : {}),
        removed: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
  })

  ipcMain.handle(IpcChannel.CreateNote, async (_, note) => {
    const id = randomUUID()
    const created = await prisma.note.create({
      data: {
        id: id,
        content: note.content,
        editorId: myDeviceId,
        threadId: note.threadId,
        parentId: note.parentId,
        removed: false,
      },
    })
    return created
  })

  ipcMain.handle(IpcChannel.UpdateNote, async (_, note) => {
    const update = {
      ...(note.content != null ? { content: note.content } : {}),
      ...(note.removed != null ? { removed: note.removed } : {}),
    }
    return await prisma.note.update({
      where: {
        id: note.id,
      },
      data: update,
    })
  })

  ipcMain.handle(IpcChannel.RemoveNote, async (_, noteId) => {
    await prisma.note.update({
      where: {
        id: noteId,
      },
      data: {
        removed: true,
        notes: {
          updateMany: {
            where: {
              parentId: noteId,
            },
            data: {
              removed: true,
            },
          },
        },
      },
    })
  })

  ipcMain.handle(IpcChannel.RestoreNote, async (_, note) => {
    // まずスレッドを復元
    const thread = await prisma.thread.update({
      where: {
        id: note.threadId,
      },
      data: {
        removed: false,
      },
    })

    const notes = []

    // 親があればそれも復元
    if (note.parentId != null) {
      const parentNote = await prisma.note.update({
        where: {
          id: note.parentId,
        },
        data: {
          removed: false,
        },
      })
      notes.push(parentNote)
    }

    // 自身
    const updated = await prisma.note.update({
      where: {
        id: note.id,
      },
      data: {
        removed: false,
      },
    })
    notes.push(updated)

    // ツリーのメモも復元してもいいけど、updateMany で更新分が
    // 取得できない(事前に findMany しておく必要がある)っぽくて
    // めんどくさいのでやらない

    return {
      thread: thread,
      notes: notes,
    }
  })

  ipcMain.handle(IpcChannel.DeleteNote, async (_, noteId) => {
    const deletedNotes = await prisma.note.findMany({
      where: {
        OR: [
          {
            id: noteId,
          },
          {
            parentId: noteId,
          },
        ],
      },
    })
    await prisma.note.delete({
      where: {
        id: noteId,
      },
    })
    return deletedNotes
  })

  type DeletedThread = {
    id: string
    deletedAt: Date
  }

  type DeletedNote = {
    id: string
    deletedAt: Date
  }

  type ThreadParsed = Omit<Thread, 'createdAt' | 'updatedAt'> & {
    createdAt: string
    updatedAt: string
  }

  type DeletedThreadParsed = Omit<DeletedThread, 'deletedAt'> & {
    deletedAt: string
  }

  type NoteParsed = Omit<Note, 'createdAt' | 'updatedAt'> & {
    createdAt: string
    updatedAt: string
  }

  type DeletedNoteParsed = Omit<DeletedNote, 'deletedAt'> & {
    deletedAt: string
  }

  type SyncData = {
    thread: {
      updated: ThreadParsed[]
      deleted: DeletedThreadParsed[]
    }
    note: {
      updated: NoteParsed[]
      deleted: DeletedNoteParsed[]
    }
  }

  interface SyncCompanion {
    // スレッドの更新状況を取得
    getThreadUpdates(): Promise<Thread[]>

    // 指定したスレッドのメモをすべて取得(trash = 1 も含む)
    getAllNotesInThread(thread: Thread): Promise<Note[]>

    // 指定したスレッドのメモをすべて取得(trash = 1 も含む)
    getAllNotesInNote(note: Note): Promise<Note[]>

    // 指定したスレッド直属のメモの更新状況取得
    getNoteUpdatesInThread(thread: Thread): Promise<Note[]>

    // 指定したメモのツリーのメモの更新状況を取得
    getNoteUpdatesInTree(note: Note): Promise<Note[]>
  }

  async function sync() {
    // 対象のデバイスに接続し、プロトコルのバージョンや同期の許可のチェックを行う

    const deviceIds = await bluetooth.enumerateSyncCompanions()

    for (const deviceId of deviceIds) {
      const syncClient = bluetooth.SyncClient.createInstance(
        myDeviceId,
        deviceId
      )

      await syncClient.beginSync()

      console.log('Requesting threads update...')

      const json = await syncClient.requestData(
        1,
        'c3592051-f873-44a7-b204-332b7b11ba96'
      )
      console.log(json)
      await syncClient.endSync(false)
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
