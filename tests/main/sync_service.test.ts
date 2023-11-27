import { testPrisma } from './helper'
import { SyncService } from '../../src/main/services/sync_service'

describe('getAllNotesInThread', () => {
  testPrisma('ok', async (prisma) => {
    await Promise.all(
      [
        {
          id: 'a',
          name: '',
          displayMode: 'monologue',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'b',
          name: '',
          displayMode: 'monologue',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
      ].map((x) => prisma.thread.create({ data: x }))
    )
    await Promise.all(
      [
        {
          id: 'a_a',
          content: '',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'a_a_a',
          content: '',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'a_b',
          content: '',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:48Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'a_b_a',
          content: '',
          threadId: 'a',
          parentId: 'a_b',
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:48Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'a_c',
          content: '',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: true,
          createdAt: new Date('2023-11-22T10:54:48Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'b_a',
          content: '',
          threadId: 'b',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const syncService = new SyncService(prisma)

    await expect(syncService.getAllNotesInThread('a')).resolves.toStrictEqual([
      {
        id: 'a_b',
        content: '',
        threadId: 'a',
        parentId: null,
        trash: true,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:48Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      },
      {
        id: 'a_a',
        content: '',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      },
      {
        id: 'a_b_a',
        content: '',
        threadId: 'a',
        parentId: 'a_b',
        trash: true,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:48Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      },
      {
        id: 'a_a_a',
        content: '',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      },
    ])
  })
})

describe('getAllNotesInTree', () => {
  testPrisma('ok', async (prisma) => {
    await Promise.all(
      [
        {
          id: 'a',
          name: '',
          displayMode: 'monologue',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'b',
          name: '',
          displayMode: 'monologue',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
      ].map((x) => prisma.thread.create({ data: x }))
    )
    await Promise.all(
      [
        {
          id: 'a_a',
          content: '',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'a_a_a',
          content: '',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'a_a_b',
          content: '',
          threadId: 'a',
          parentId: 'a_a',
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:48Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'a_a_c',
          content: '',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: true,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'a_b',
          content: '',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:48Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'a_b_a',
          content: '',
          threadId: 'a',
          parentId: 'a_b',
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:48Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const syncService = new SyncService(prisma)

    await expect(syncService.getAllNotesInTree('a_a')).resolves.toStrictEqual([
      {
        id: 'a_a_b',
        content: '',
        threadId: 'a',
        parentId: 'a_a',
        trash: true,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:48Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      },
      {
        id: 'a_a_a',
        content: '',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      },
    ])
  })
})

describe('getUpdatedThreads', () => {
  testPrisma('ok', async (prisma) => {
    await Promise.all(
      [
        {
          id: 'a',
          name: '',
          displayMode: 'monologue',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'b',
          name: '',
          displayMode: 'monologue',
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:48Z'),
          updatedAt: new Date('2023-11-22T10:54:48Z'),
          modifiedAt: new Date('2023-11-22T10:54:48Z'),
        },
        {
          id: 'c',
          name: '',
          displayMode: 'monologue',
          trash: false,
          deleted: true,
          createdAt: new Date('2023-11-22T10:54:47Z'),
          updatedAt: new Date('2023-11-22T10:54:47Z'),
          modifiedAt: new Date('2023-11-22T10:54:47Z'),
        },
        {
          id: 'd',
          name: '',
          displayMode: 'monologue',
          trash: true,
          deleted: true,
          createdAt: new Date('2023-11-22T10:54:46Z'),
          updatedAt: new Date('2023-11-22T10:54:46Z'),
          modifiedAt: new Date('2023-11-22T10:54:46Z'),
        },
        {
          id: 'e',
          name: '',
          displayMode: 'monologue',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:50Z'),
          updatedAt: new Date('2023-11-22T10:54:50Z'),
          modifiedAt: new Date('2023-11-22T10:54:50Z'),
        },
        {
          id: 'f',
          name: '',
          displayMode: 'monologue',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:45Z'),
          updatedAt: new Date('2023-11-22T10:54:45Z'),
          modifiedAt: new Date('2023-11-22T10:54:45Z'),
        },
      ].map((x) => prisma.thread.create({ data: x }))
    )

    const syncService = new SyncService(prisma)

    await expect(
      syncService.getUpdatedThreads(
        new Date('2023-11-22T10:54:46Z'),
        new Date('2023-11-22T10:54:50Z')
      )
    ).resolves.toStrictEqual([
      {
        id: 'd',
        name: '',
        displayMode: 'monologue',
        trash: true,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:46Z'),
        updatedAt: new Date('2023-11-22T10:54:46Z'),
        modifiedAt: new Date('2023-11-22T10:54:46Z'),
      },
      {
        id: 'c',
        name: '',
        displayMode: 'monologue',
        trash: false,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:47Z'),
        updatedAt: new Date('2023-11-22T10:54:47Z'),
        modifiedAt: new Date('2023-11-22T10:54:47Z'),
      },
      {
        id: 'b',
        name: '',
        displayMode: 'monologue',
        trash: true,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:48Z'),
        updatedAt: new Date('2023-11-22T10:54:48Z'),
        modifiedAt: new Date('2023-11-22T10:54:48Z'),
      },
      {
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      },
    ])
  })
})

describe('getUpdatedNotesInThread', () => {
  testPrisma('ok', async (prisma) => {
    await Promise.all(
      [
        {
          id: 'a',
          name: '',
          displayMode: 'monologue',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'b',
          name: '',
          displayMode: 'monologue',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
      ].map((x) => prisma.thread.create({ data: x }))
    )
    await Promise.all(
      [
        {
          id: 'a_a',
          content: '',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'a_a_a',
          content: '',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'a_b',
          content: '',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:48Z'),
          updatedAt: new Date('2023-11-22T10:54:48Z'),
          modifiedAt: new Date('2023-11-22T10:54:48Z'),
        },
        {
          id: 'a_c',
          content: '',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: true,
          createdAt: new Date('2023-11-22T10:54:47Z'),
          updatedAt: new Date('2023-11-22T10:54:47Z'),
          modifiedAt: new Date('2023-11-22T10:54:47Z'),
        },
        {
          id: 'a_d',
          content: '',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: true,
          createdAt: new Date('2023-11-22T10:54:46Z'),
          updatedAt: new Date('2023-11-22T10:54:46Z'),
          modifiedAt: new Date('2023-11-22T10:54:46Z'),
        },
        {
          id: 'a_e',
          content: '',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:50Z'),
          updatedAt: new Date('2023-11-22T10:54:50Z'),
          modifiedAt: new Date('2023-11-22T10:54:50Z'),
        },
        {
          id: 'a_f',
          content: '',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:45Z'),
          updatedAt: new Date('2023-11-22T10:54:45Z'),
          modifiedAt: new Date('2023-11-22T10:54:45Z'),
        },
        {
          id: 'b_a',
          content: '',
          threadId: 'b',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const syncService = new SyncService(prisma)

    await expect(
      syncService.getUpdatedNotesInThread(
        'a',
        new Date('2023-11-22T10:54:46Z'),
        new Date('2023-11-22T10:54:50Z')
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_d',
        content: '',
        threadId: 'a',
        parentId: null,
        trash: true,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:46Z'),
        updatedAt: new Date('2023-11-22T10:54:46Z'),
        modifiedAt: new Date('2023-11-22T10:54:46Z'),
      },
      {
        id: 'a_c',
        content: '',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:47Z'),
        updatedAt: new Date('2023-11-22T10:54:47Z'),
        modifiedAt: new Date('2023-11-22T10:54:47Z'),
      },
      {
        id: 'a_b',
        content: '',
        threadId: 'a',
        parentId: null,
        trash: true,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:48Z'),
        updatedAt: new Date('2023-11-22T10:54:48Z'),
        modifiedAt: new Date('2023-11-22T10:54:48Z'),
      },
      {
        id: 'a_a',
        content: '',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      },
    ])
  })
})

describe('getUpdatedNotesInTree', () => {
  testPrisma('ok', async (prisma) => {
    await Promise.all(
      [
        {
          id: 'a',
          name: '',
          displayMode: 'monologue',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
      ].map((x) => prisma.thread.create({ data: x }))
    )
    await Promise.all(
      [
        {
          id: 'a_a',
          content: '',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'a_a_a',
          content: '',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'a_a_b',
          content: '',
          threadId: 'a',
          parentId: 'a_a',
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:48Z'),
          updatedAt: new Date('2023-11-22T10:54:48Z'),
          modifiedAt: new Date('2023-11-22T10:54:48Z'),
        },
        {
          id: 'a_a_c',
          content: '',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: true,
          createdAt: new Date('2023-11-22T10:54:47Z'),
          updatedAt: new Date('2023-11-22T10:54:47Z'),
          modifiedAt: new Date('2023-11-22T10:54:47Z'),
        },
        {
          id: 'a_a_d',
          content: '',
          threadId: 'a',
          parentId: 'a_a',
          trash: true,
          deleted: true,
          createdAt: new Date('2023-11-22T10:54:46Z'),
          updatedAt: new Date('2023-11-22T10:54:46Z'),
          modifiedAt: new Date('2023-11-22T10:54:46Z'),
        },
        {
          id: 'a_a_e',
          content: '',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:50Z'),
          updatedAt: new Date('2023-11-22T10:54:50Z'),
          modifiedAt: new Date('2023-11-22T10:54:50Z'),
        },
        {
          id: 'a_a_f',
          content: '',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:45Z'),
          updatedAt: new Date('2023-11-22T10:54:45Z'),
          modifiedAt: new Date('2023-11-22T10:54:45Z'),
        },
        {
          id: 'a_b',
          content: '',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const syncService = new SyncService(prisma)

    await expect(
      syncService.getUpdatedNotesInTree(
        'a_a',
        new Date('2023-11-22T10:54:46Z'),
        new Date('2023-11-22T10:54:50Z')
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a_d',
        content: '',
        threadId: 'a',
        parentId: 'a_a',
        trash: true,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:46Z'),
        updatedAt: new Date('2023-11-22T10:54:46Z'),
        modifiedAt: new Date('2023-11-22T10:54:46Z'),
      },
      {
        id: 'a_a_c',
        content: '',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:47Z'),
        updatedAt: new Date('2023-11-22T10:54:47Z'),
        modifiedAt: new Date('2023-11-22T10:54:47Z'),
      },
      {
        id: 'a_a_b',
        content: '',
        threadId: 'a',
        parentId: 'a_a',
        trash: true,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:48Z'),
        updatedAt: new Date('2023-11-22T10:54:48Z'),
        modifiedAt: new Date('2023-11-22T10:54:48Z'),
      },
      {
        id: 'a_a_a',
        content: '',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      },
    ])
  })
})
