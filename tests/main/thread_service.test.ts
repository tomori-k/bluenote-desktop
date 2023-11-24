import { ThreadService } from '../../src/main/services/thread_service'
import { testPrisma, assertDateGreaterThanOrEqual } from './helper'

describe('getAllThreads', () => {
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
          createdAt: new Date('2023-11-22T10:54:48Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'c',
          name: '',
          displayMode: 'monologue',
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:48Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'd',
          name: '',
          displayMode: 'monologue',
          trash: false,
          deleted: true,
          createdAt: new Date('2023-11-22T10:54:48Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
      ].map((x) => prisma.thread.create({ data: x }))
    )

    const threadService = new ThreadService(prisma)

    await expect(threadService.getAllThreads()).resolves.toStrictEqual([
      {
        id: 'b',
        name: '',
        displayMode: 'monologue',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:48Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
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

describe('get', () => {
  testPrisma('ok', async (prisma) => {
    await prisma.thread.create({
      data: {
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-08-09T16:32:00Z'),
        updatedAt: new Date('2023-08-09T16:32:00Z'),
        modifiedAt: new Date('2023-08-09T16:32:00Z'),
      },
    })

    const threadService = new ThreadService(prisma)

    await expect(threadService.get('a')).resolves.toStrictEqual({
      id: 'a',
      name: '',
      displayMode: 'monologue',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-08-09T16:32:00Z'),
      updatedAt: new Date('2023-08-09T16:32:00Z'),
      modifiedAt: new Date('2023-08-09T16:32:00Z'),
    })
  })

  testPrisma('not found', async (prisma) => {
    const threadService = new ThreadService(prisma)
    await expect(threadService.get('a')).rejects.toThrow(Error)
  })
})

describe('create', () => {
  testPrisma('ok', async (prisma) => {
    const threadService = new ThreadService(prisma)
    const timestamp = Date.now()
    const thread = await threadService.create('a')
    const dataInDb = await threadService.get(thread.id)

    expect(thread).toStrictEqual(dataInDb)
    expect(thread.id).toMatch(/^[A-z0-9]{8}(-[A-z0-9]{4}){3}-[A-z0-9]{12}$/)
    expect(thread.name).toBe('a')
    expect(thread.displayMode).toBe('monologue')
    expect(thread.trash).toBe(false)
    expect(thread.deleted).toBe(false)
    expect(thread.createdAt.getTime()).toBeGreaterThanOrEqual(timestamp)
    expect(thread.updatedAt.getTime()).toBeGreaterThanOrEqual(timestamp)
    expect(thread.modifiedAt.getTime()).toBeGreaterThanOrEqual(timestamp)
  })
})

describe('rename', () => {
  testPrisma('ok', async (prisma) => {
    const thread = await prisma.thread.create({
      data: {
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-08-09T16:32:00Z'),
        updatedAt: new Date('2023-08-09T16:32:00Z'),
        modifiedAt: new Date('2023-08-09T16:32:00Z'),
      },
    })
    const timestamp = Date.now()

    const threadService = new ThreadService(prisma)
    const renamed = await threadService.rename(thread, 'new')
    const dataInDb = await threadService.get(thread.id)

    expect(renamed).toStrictEqual(dataInDb)
    expect(renamed.name).toBe('new')
    expect(renamed.updatedAt.getTime()).toBeGreaterThanOrEqual(timestamp)
    expect(renamed.modifiedAt.getTime()).toBeGreaterThanOrEqual(timestamp)
  })

  testPrisma('trash', async (prisma) => {
    const thread = await prisma.thread.create({
      data: {
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: true,
        deleted: false,
        createdAt: new Date('2023-08-09T16:32:00Z'),
        updatedAt: new Date('2023-08-09T16:32:00Z'),
        modifiedAt: new Date('2023-08-09T16:32:00Z'),
      },
    })

    const threadService = new ThreadService(prisma)
    await expect(threadService.rename(thread, 'new')).rejects.toThrow(Error)
  })

  testPrisma('deleted', async (prisma) => {
    const thread = await prisma.thread.create({
      data: {
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: false,
        deleted: true,
        createdAt: new Date('2023-08-09T16:32:00Z'),
        updatedAt: new Date('2023-08-09T16:32:00Z'),
        modifiedAt: new Date('2023-08-09T16:32:00Z'),
      },
    })

    const threadService = new ThreadService(prisma)
    await expect(threadService.rename(thread, 'new')).rejects.toThrow(Error)
  })

  testPrisma('not exist', async (prisma) => {
    const threadService = new ThreadService(prisma)
    await expect(
      threadService.rename(
        {
          id: 'a',
          name: '',
          displayMode: 'monologue',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-08-09T16:32:00Z'),
          updatedAt: new Date('2023-08-09T16:32:00Z'),
          modifiedAt: new Date('2023-08-09T16:32:00Z'),
        },
        'new'
      )
    ).rejects.toThrow(Error)
  })
})

describe('changeDisplayMode', () => {
  testPrisma('ok', async (prisma) => {
    const thread = await prisma.thread.create({
      data: {
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-08-09T16:32:00Z'),
        updatedAt: new Date('2023-08-09T16:32:00Z'),
        modifiedAt: new Date('2023-08-09T16:32:00Z'),
      },
    })
    const timestamp = Date.now()

    const threadService = new ThreadService(prisma)
    const renamed = await threadService.changeDisplayMode(thread, 'scrap')
    const dataInDb = await threadService.get(thread.id)

    expect(renamed).toStrictEqual(dataInDb)
    expect(renamed.displayMode).toBe('scrap')
    expect(renamed.updatedAt.getTime()).toBeGreaterThanOrEqual(timestamp)
    expect(renamed.modifiedAt.getTime()).toBeGreaterThanOrEqual(timestamp)
  })

  testPrisma('trash', async (prisma) => {
    const thread = await prisma.thread.create({
      data: {
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: true,
        deleted: false,
        createdAt: new Date('2023-08-09T16:32:00Z'),
        updatedAt: new Date('2023-08-09T16:32:00Z'),
        modifiedAt: new Date('2023-08-09T16:32:00Z'),
      },
    })

    const threadService = new ThreadService(prisma)
    await expect(
      threadService.changeDisplayMode(thread, 'scrap')
    ).rejects.toThrow(Error)
  })

  testPrisma('deleted', async (prisma) => {
    const thread = await prisma.thread.create({
      data: {
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: false,
        deleted: true,
        createdAt: new Date('2023-08-09T16:32:00Z'),
        updatedAt: new Date('2023-08-09T16:32:00Z'),
        modifiedAt: new Date('2023-08-09T16:32:00Z'),
      },
    })

    const threadService = new ThreadService(prisma)
    await expect(
      threadService.changeDisplayMode(thread, 'scrap')
    ).rejects.toThrow(Error)
  })

  testPrisma('not exist', async (prisma) => {
    const threadService = new ThreadService(prisma)
    await expect(
      threadService.changeDisplayMode(
        {
          id: 'a',
          name: '',
          displayMode: 'monologue',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-08-09T16:32:00Z'),
          updatedAt: new Date('2023-08-09T16:32:00Z'),
          modifiedAt: new Date('2023-08-09T16:32:00Z'),
        },
        'scrap'
      )
    ).rejects.toThrow(Error)
  })
})

describe('remove', () => {
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
          createdAt: new Date('2023-11-22T10:54:48Z'),
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
          createdAt: new Date('2023-11-22T10:54:48Z'),
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
          createdAt: new Date('2023-11-22T10:54:48Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const threadService = new ThreadService(prisma)
    const timestamp = new Date()

    await threadService.remove({
      id: 'a',
      name: '',
      displayMode: 'monologue',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-11-22T10:54:49Z'),
      modifiedAt: new Date('2023-11-22T10:54:49Z'),
    })

    // test
    const a = await prisma.thread.findUniqueOrThrow({ where: { id: 'a' } })
    const a_a = await prisma.note.findUniqueOrThrow({ where: { id: 'a_a' } })
    const a_a_a = await prisma.note.findUniqueOrThrow({
      where: { id: 'a_a_a' },
    })

    expect(a.trash).toBe(true)
    expect(a_a.trash).toBe(true)
    expect(a_a_a.trash).toBe(true)

    assertDateGreaterThanOrEqual(a.updatedAt, timestamp)
    assertDateGreaterThanOrEqual(a.modifiedAt, timestamp)
    assertDateGreaterThanOrEqual(a_a.updatedAt, timestamp)
    assertDateGreaterThanOrEqual(a_a.modifiedAt, timestamp)
    assertDateGreaterThanOrEqual(a_a_a.updatedAt, timestamp)
    assertDateGreaterThanOrEqual(a_a_a.modifiedAt, timestamp)

    // unchanged

    await expect(
      prisma.note.findUniqueOrThrow({ where: { id: 'a_b' } })
    ).resolves.toStrictEqual({
      id: 'a_b',
      content: '',
      threadId: 'a',
      parentId: null,
      trash: true,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:48Z'),
      updatedAt: new Date('2023-11-22T10:54:49Z'),
      modifiedAt: new Date('2023-11-22T10:54:49Z'),
    })

    await expect(
      prisma.note.findUniqueOrThrow({ where: { id: 'a_c' } })
    ).resolves.toStrictEqual({
      id: 'a_c',
      content: '',
      threadId: 'a',
      parentId: null,
      trash: false,
      deleted: true,
      createdAt: new Date('2023-11-22T10:54:48Z'),
      updatedAt: new Date('2023-11-22T10:54:49Z'),
      modifiedAt: new Date('2023-11-22T10:54:49Z'),
    })

    await expect(
      prisma.note.findUniqueOrThrow({ where: { id: 'b_a' } })
    ).resolves.toStrictEqual({
      id: 'b_a',
      content: '',
      threadId: 'b',
      parentId: null,
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:48Z'),
      updatedAt: new Date('2023-11-22T10:54:49Z'),
      modifiedAt: new Date('2023-11-22T10:54:49Z'),
    })
  })

  testPrisma('trash', async (prisma) => {
    await Promise.all(
      [
        {
          id: 'a',
          name: '',
          displayMode: 'monologue',
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
      ].map((x) => prisma.thread.create({ data: x }))
    )

    const threadService = new ThreadService(prisma)

    await expect(
      threadService.remove({
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      })
    ).rejects.toThrow(Error)
  })

  testPrisma('deleted', async (prisma) => {
    await Promise.all(
      [
        {
          id: 'a',
          name: '',
          displayMode: 'monologue',
          trash: false,
          deleted: true,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
      ].map((x) => prisma.thread.create({ data: x }))
    )

    const threadService = new ThreadService(prisma)

    await expect(
      threadService.remove({
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      })
    ).rejects.toThrow(Error)
  })

  testPrisma('not exist', async (prisma) => {
    const threadService = new ThreadService(prisma)

    await expect(
      threadService.remove({
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      })
    ).rejects.toThrow(Error)
  })
})

describe('delete', () => {
  testPrisma('ok', async (prisma) => {
    await Promise.all(
      [
        {
          id: 'a',
          name: '',
          displayMode: 'monologue',
          trash: true,
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
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:48Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'a_a_b',
          content: '',
          threadId: 'a',
          parentId: 'a_a',
          trash: true,
          deleted: true,
          createdAt: new Date('2023-11-22T10:54:48Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
        {
          id: 'a_b',
          content: '',
          threadId: 'a',
          parentId: null,
          trash: true,
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
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-22T10:54:48Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const threadService = new ThreadService(prisma)
    const timestamp = new Date()

    await threadService.deleteThread({
      id: 'a',
      name: '',
      displayMode: 'monologue',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-11-22T10:54:49Z'),
      modifiedAt: new Date('2023-11-22T10:54:49Z'),
    })

    // test

    const a = await prisma.thread.findUniqueOrThrow({ where: { id: 'a' } })

    expect(a.deleted).toBe(true)
    assertDateGreaterThanOrEqual(a.updatedAt, timestamp)
    assertDateGreaterThanOrEqual(a.modifiedAt, timestamp)

    await expect(prisma.note.findMany({})).resolves.toStrictEqual([
      {
        id: 'b_a',
        content: '',
        threadId: 'b',
        parentId: null,
        trash: true,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:48Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      },
    ])
  })

  testPrisma('not removed', async (prisma) => {
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

    const threadService = new ThreadService(prisma)

    await expect(
      threadService.deleteThread({
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: true,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      })
    ).rejects.toThrow(Error)
  })

  testPrisma('deleted', async (prisma) => {
    await Promise.all(
      [
        {
          id: 'a',
          name: '',
          displayMode: 'monologue',
          trash: true,
          deleted: true,
          createdAt: new Date('2023-11-22T10:54:49Z'),
          updatedAt: new Date('2023-11-22T10:54:49Z'),
          modifiedAt: new Date('2023-11-22T10:54:49Z'),
        },
      ].map((x) => prisma.thread.create({ data: x }))
    )

    const threadService = new ThreadService(prisma)

    await expect(
      threadService.deleteThread({
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: true,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      })
    ).rejects.toThrow(Error)
  })

  testPrisma('not exist', async (prisma) => {
    const threadService = new ThreadService(prisma)

    await expect(
      threadService.deleteThread({
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      })
    ).rejects.toThrow(Error)
  })
})
