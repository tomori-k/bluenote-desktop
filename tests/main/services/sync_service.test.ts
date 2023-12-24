import { testPrisma } from '../helper'
import { SyncService } from '../../../src/main/services/sync_service'
import { Diff } from '../../../src/main/sync/diff'

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

describe('updateByDiff', () => {
  testPrisma('ok', async (prisma) => {
    await Promise.all(
      [
        {
          id: 'b',
          name: '',
          displayMode: 'scrap',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'c',
          name: '',
          displayMode: 'monologue',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-12-24T15:34:55Z'),
          updatedAt: new Date('2023-12-24T15:34:55Z'),
          modifiedAt: new Date('2023-12-24T15:34:55Z'),
        },
        {
          id: 'd',
          name: '',
          displayMode: 'monologue',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-12-24T15:34:55Z'),
          updatedAt: new Date('2023-12-24T15:34:55Z'),
          modifiedAt: new Date('2023-12-24T15:34:55Z'),
        },
      ].map((x) => prisma.thread.create({ data: x }))
    )
    await Promise.all(
      [
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
        {
          id: 'b_b',
          content: '',
          threadId: 'b',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'b_c',
          content: '',
          threadId: 'b',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'b_c_a',
          content: '',
          threadId: 'b',
          parentId: 'b_c',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'd_a',
          content: '',
          threadId: 'd',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'd_a_a',
          content: '',
          threadId: 'd',
          parentId: 'd_a',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const diff = new Diff()

    diff.threadCreate.push({
      id: 'a',
      name: '',
      displayMode: 'monologue',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-12-24T15:34:55Z'),
      updatedAt: new Date('2023-12-24T15:34:55Z'),
      modifiedAt: new Date('2023-12-24T15:34:55Z'),
    })
    diff.threadUpdate.push({
      id: 'b',
      name: '',
      displayMode: 'monologue',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-12-24T15:34:55Z'),
      updatedAt: new Date('2023-12-24T15:34:55Z'),
      modifiedAt: new Date('2023-12-24T15:34:55Z'),
    })
    diff.threadDelete.push({
      id: 'c',
      name: '',
      displayMode: 'monologue',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-12-24T15:34:55Z'),
      updatedAt: new Date('2023-12-24T15:34:55Z'),
      modifiedAt: new Date('2023-12-24T15:34:55Z'),
    })

    diff.noteCreate.push(
      {
        id: 'a_a',
        content: '',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('2023-12-24T15:34:55Z'),
        updatedAt: new Date('2023-12-24T15:34:55Z'),
        modifiedAt: new Date('2023-12-24T15:34:55Z'),
      },
      {
        id: 'a_a_a',
        content: '',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-12-24T15:34:55Z'),
        updatedAt: new Date('2023-12-24T15:34:55Z'),
        modifiedAt: new Date('2023-12-24T15:34:55Z'),
      }
    )
    diff.noteUpdate.push({
      id: 'b_a',
      content: '',
      threadId: 'b',
      parentId: null,
      trash: false,
      deleted: false,
      createdAt: new Date('2023-12-24T15:34:55Z'),
      updatedAt: new Date('2023-12-24T15:34:55Z'),
      modifiedAt: new Date('2023-12-24T15:34:55Z'),
    })
    diff.noteDelete.push({
      id: 'b_b',
      content: '',
      threadId: 'b',
      parentId: null,
      trash: false,
      deleted: false,
      createdAt: new Date('2023-12-24T15:34:55Z'),
      updatedAt: new Date('2023-12-24T15:34:55Z'),
      modifiedAt: new Date('2023-12-24T15:34:55Z'),
    })
    diff.noteDeleteThreadIds.push('d')
    diff.noteDeleteNoteIds.push('b_c')

    const syncService = new SyncService(prisma)

    await syncService.updateByDiff(diff)

    await expect(
      prisma.thread.findMany({ orderBy: { id: 'asc' } })
    ).resolves.toStrictEqual([
      {
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-12-24T15:34:55Z'),
        updatedAt: new Date('2023-12-24T15:34:55Z'),
        modifiedAt: new Date('2023-12-24T15:34:55Z'),
      },
      {
        id: 'b',
        name: '',
        displayMode: 'monologue',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-12-24T15:34:55Z'),
        updatedAt: new Date('2023-12-24T15:34:55Z'),
        modifiedAt: new Date('2023-12-24T15:34:55Z'),
      },
      {
        id: 'd',
        name: '',
        displayMode: 'monologue',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-12-24T15:34:55Z'),
        updatedAt: new Date('2023-12-24T15:34:55Z'),
        modifiedAt: new Date('2023-12-24T15:34:55Z'),
      },
    ])

    await expect(
      prisma.note.findMany({ orderBy: { id: 'asc' } })
    ).resolves.toStrictEqual([
      {
        id: 'a_a',
        content: '',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('2023-12-24T15:34:55Z'),
        updatedAt: new Date('2023-12-24T15:34:55Z'),
        modifiedAt: new Date('2023-12-24T15:34:55Z'),
      },
      {
        id: 'a_a_a',
        content: '',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-12-24T15:34:55Z'),
        updatedAt: new Date('2023-12-24T15:34:55Z'),
        modifiedAt: new Date('2023-12-24T15:34:55Z'),
      },
      {
        id: 'b_a',
        content: '',
        threadId: 'b',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('2023-12-24T15:34:55Z'),
        updatedAt: new Date('2023-12-24T15:34:55Z'),
        modifiedAt: new Date('2023-12-24T15:34:55Z'),
      },
      {
        id: 'b_c',
        content: '',
        threadId: 'b',
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
