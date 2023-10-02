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
import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

const createWindow = async () => {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
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
        },
      })
    }
    return device.id
  })()

  console.log(`My device id: ${myDeviceId}`)

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

    // 最終同期時刻、現在時刻を取得
    const device = (await prisma.device.findFirst({
      where: {
        id: uuid,
      },
    })) ?? { id: uuid, syncedAt: new Date(0) }
    const timestamp = new Date()

    // 更新分を取得
    const updates = await prisma.note.findMany({
      where: {
        editorId: myDeviceId,
        updatedAt: {
          gte: device.syncedAt,
          lt: timestamp,
        },
      },
    })

    // 最終同期時刻を更新
    await prisma.device.upsert({
      where: {
        id: device.id,
      },
      create: {
        id: device.id,
        name: '',
        me: false,
        syncedAt: timestamp,
      },
      update: {
        syncedAt: timestamp,
      },
    })

    const json = JSON.stringify(updates)

    console.log(json)

    // Rust 側に送信
    passUpdates(json)
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
        removedAt: new Date(0),
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
      ...(thread.removedAt != null ? { removedAt: thread.removedAt } : {}),
    }
    return await prisma.thread.update({
      where: {
        id: thread.id,
      },
      data: update,
    })
  })

  ipcMain.handle(IpcChannel.RemoveThread, async (_, threadId) => {
    const timestamp = new Date()

    await prisma.thread.update({
      where: {
        id: threadId,
      },
      data: {
        removed: true,
        removedAt: timestamp,
        notes: {
          updateMany: {
            where: {
              threadId: threadId,
            },
            data: {
              removed: true,
              removedAt: timestamp,
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
      options.parentId != null ? { parentId: options.parentId } : {}
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
        removedAt: new Date(0),
      },
    })
    return created
  })

  ipcMain.handle(IpcChannel.UpdateNote, async (_, note) => {
    const update = {
      ...(note.content != null ? { content: note.content } : {}),
      ...(note.removed != null ? { removed: note.removed } : {}),
      ...(note.removedAt != null ? { removedAt: note.removedAt } : {}),
    }
    return await prisma.note.update({
      where: {
        id: note.id,
      },
      data: update,
    })
  })

  ipcMain.handle(IpcChannel.DeleteNote, async (_, noteId) => {
    await prisma.note.delete({
      where: {
        id: noteId,
      },
    })
  })

  // todo: なんとかする
  async function wrappedSync() {
    const noteJsonList = await sync(myDeviceId)
    const notes = []
    for (const noteJson of noteJsonList) {
      const noteList = JSON.parse(noteJson)
      for (const note of noteList) {
        notes.push(note)
      }
    }
    return notes
  }

  ipcMain.handle(IpcChannel.Sync, async (_) => {
    const updates = await wrappedSync()
    const updatesAdded = []
    // const editors = new Set(updates.map((x) => x.editor))

    // 新規デバイスがあれば DB に追加
    // for (const editor of editors) {
    //   const device = await prisma.device.findFirst({
    //     where: {
    //       id: editor,
    //     },
    //   })

    //   if (device == null) {
    //     await prisma.device.create({
    //       data: {
    //         id: editor,
    //         name: randomUUID(), // 一旦適当
    //         me: false,
    //       },
    //     })
    //   }
    // }

    for (const update of updates) {
      const added = await prisma.note.create({
        data: update,
      })
      updatesAdded.push(added)
    }

    return updatesAdded
  })

  // データ同期サーバ起動
  startSyncServer()

  window.loadURL('http://localhost:5173')
}

app.whenReady().then(async () => {
  createWindow()
})

app.on('before-quit', async () => {
  console.log('quitting...')
  stopSyncServer()
  await prisma.$disconnect()
})
