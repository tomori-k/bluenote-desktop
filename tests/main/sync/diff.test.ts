import { MockCompanion, MockThreadService, MockNoteService } from './mocks'
import { Diff, diffTree, diffThread, diff } from '../../../src/main/sync/diff'

describe('diff', () => {
  test('the companion modified a thread, but we do not have that', async () => {
    const mockCompanion = new MockCompanion()
    const mockThreadService = new MockThreadService()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getThreadUpdates').mockResolvedValueOnce([
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

    jest
      .spyOn(mockCompanion, 'getAllNotesInThread')
      .mockImplementationOnce(async (x) => {
        return x.id === 'a'
          ? [
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
            ]
          : []
      })

    jest.spyOn(mockThreadService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a':
          return null
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.threadCreate.push({
      id: 'a',
      name: '',
      displayMode: 'monologue',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:49Z'),
    })
    expected.noteCreate.push({
      id: 'a_a',
      content: '',
      threadId: 'a',
      parentId: null,
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:49Z'),
    })

    expect(
      await diff(mockCompanion, mockThreadService, mockNoteService, timestamp)
    ).toStrictEqual(expected)
  })

  test('we modified a thread, and later the companion modified it too', async () => {
    const mockCompanion = new MockCompanion()
    const mockThreadService = new MockThreadService()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getThreadUpdates').mockResolvedValueOnce([
      {
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:50Z'),
        modifiedAt: new Date('2023-11-22T10:54:50Z'),
      },
    ])

    jest
      .spyOn(mockCompanion, 'getNoteUpdatesInThread')
      .mockImplementation(async (x) => {
        return x.id === 'a'
          ? [
              {
                id: 'a_a',
                content: '',
                threadId: 'a',
                parentId: null,
                trash: false,
                deleted: false,
                createdAt: new Date('2023-11-22T10:54:49Z'),
                updatedAt: new Date('2023-11-22T10:54:50Z'),
                modifiedAt: new Date('2023-11-22T10:54:50Z'),
              },
            ]
          : []
      })

    jest.spyOn(mockCompanion, 'getNoteUpdatesInTree').mockResolvedValue([])

    jest.spyOn(mockThreadService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a':
          return {
            id: 'a',
            name: '',
            displayMode: 'monologue',
            trash: false,
            deleted: false,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      return x === 'a_a'
        ? {
            id: 'a_a',
            content: '',
            threadId: 'a',
            parentId: null,
            trash: false,
            deleted: false,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        : null
    })

    const expected = new Diff()

    expected.threadUpdate.push({
      id: 'a',
      name: '',
      displayMode: 'monologue',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:50Z'),
    })
    expected.noteUpdate.push({
      id: 'a_a',
      content: '',
      threadId: 'a',
      parentId: null,
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:50Z'),
    })

    expect(
      await diff(mockCompanion, mockThreadService, mockNoteService, timestamp)
    ).toStrictEqual(expected)
  })

  test('the companion modified a thread, and later we modified it too', async () => {
    const mockCompanion = new MockCompanion()
    const mockThreadService = new MockThreadService()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getThreadUpdates').mockResolvedValueOnce([
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

    jest
      .spyOn(mockCompanion, 'getNoteUpdatesInThread')
      .mockImplementation(async (x) => {
        return x.id === 'a'
          ? [
              {
                id: 'a_a',
                content: '',
                threadId: 'a',
                parentId: null,
                trash: false,
                deleted: false,
                createdAt: new Date('2023-11-22T10:54:49Z'),
                updatedAt: new Date('2023-11-22T10:54:50Z'),
                modifiedAt: new Date('2023-11-22T10:54:50Z'),
              },
            ]
          : []
      })

    jest.spyOn(mockCompanion, 'getNoteUpdatesInTree').mockResolvedValue([])

    jest.spyOn(mockThreadService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a':
          return {
            id: 'a',
            name: '',
            displayMode: 'monologue',
            trash: false,
            deleted: false,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      return x === 'a_a'
        ? {
            id: 'a_a',
            content: '',
            threadId: 'a',
            parentId: null,
            trash: false,
            deleted: false,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        : null
    })

    const expected = new Diff()

    expected.noteUpdate.push({
      id: 'a_a',
      content: '',
      threadId: 'a',
      parentId: null,
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:50Z'),
    })

    expect(
      await diff(mockCompanion, mockThreadService, mockNoteService, timestamp)
    ).toStrictEqual(expected)
  })

  test('we deleted a thread, but later the companion modified it', async () => {
    const mockCompanion = new MockCompanion()
    const mockThreadService = new MockThreadService()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getThreadUpdates').mockResolvedValueOnce([
      {
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:50Z'),
        modifiedAt: new Date('2023-11-22T10:54:50Z'),
      },
    ])

    jest
      .spyOn(mockCompanion, 'getAllNotesInThread')
      .mockImplementation(async (x) => {
        return x.id === 'a'
          ? [
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
            ]
          : []
      })

    jest.spyOn(mockThreadService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a':
          return {
            id: 'a',
            name: '',
            displayMode: 'monologue',
            trash: true,
            deleted: true,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.threadUpdate.push({
      id: 'a',
      name: '',
      displayMode: 'monologue',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:50Z'),
    })
    expected.noteCreate.push({
      id: 'a_a',
      content: '',
      threadId: 'a',
      parentId: null,
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:49Z'),
    })

    expect(
      await diff(mockCompanion, mockThreadService, mockNoteService, timestamp)
    ).toStrictEqual(expected)
  })

  test('the companion modified a thread, but later we deleted it', async () => {
    const mockCompanion = new MockCompanion()
    const mockThreadService = new MockThreadService()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getThreadUpdates').mockResolvedValueOnce([
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

    jest
      .spyOn(mockCompanion, 'getAllNotesInThread')
      .mockImplementation(async (x) => {
        return x.id === 'a'
          ? [
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
            ]
          : []
      })

    jest.spyOn(mockThreadService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a':
          return {
            id: 'a',
            name: '',
            displayMode: 'monologue',
            trash: true,
            deleted: true,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    // 更新なし

    expect(
      await diff(mockCompanion, mockThreadService, mockNoteService, timestamp)
    ).toStrictEqual(expected)
  })

  test('the companion deleted a thread, but we do not have that', async () => {
    const mockCompanion = new MockCompanion()
    const mockThreadService = new MockThreadService()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getThreadUpdates').mockResolvedValueOnce([
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
    ])

    jest.spyOn(mockThreadService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a':
          return null
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.threadCreate.push({
      id: 'a',
      name: '',
      displayMode: 'monologue',
      trash: true,
      deleted: true,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:49Z'),
    })

    expect(
      await diff(mockCompanion, mockThreadService, mockNoteService, timestamp)
    ).toStrictEqual(expected)
  })

  test('we modified a thread, but later the companion deleted it', async () => {
    const mockCompanion = new MockCompanion()
    const mockThreadService = new MockThreadService()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getThreadUpdates').mockResolvedValueOnce([
      {
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: true,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:50Z'),
        modifiedAt: new Date('2023-11-22T10:54:50Z'),
      },
    ])

    jest.spyOn(mockThreadService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a':
          return {
            id: 'a',
            name: '',
            displayMode: 'monologue',
            trash: false,
            deleted: false,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.threadUpdate.push({
      id: 'a',
      name: '',
      displayMode: 'monologue',
      trash: true,
      deleted: true,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:50Z'),
    })
    expected.noteDeleteThreadIds.push('a')

    expect(
      await diff(mockCompanion, mockThreadService, mockNoteService, timestamp)
    ).toStrictEqual(expected)
  })

  test('the companion deleted a thread, but we later modified it', async () => {
    const mockCompanion = new MockCompanion()
    const mockThreadService = new MockThreadService()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getThreadUpdates').mockResolvedValueOnce([
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
    ])

    jest.spyOn(mockThreadService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a':
          return {
            id: 'a',
            name: '',
            displayMode: 'monologue',
            trash: false,
            deleted: false,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    // 更新なし

    expect(
      await diff(mockCompanion, mockThreadService, mockNoteService, timestamp)
    ).toStrictEqual(expected)
  })

  test('we deleted a thread, and later the companion deleted it too', async () => {
    const mockCompanion = new MockCompanion()
    const mockThreadService = new MockThreadService()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getThreadUpdates').mockResolvedValueOnce([
      {
        id: 'a',
        name: '',
        displayMode: 'monologue',
        trash: true,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:50Z'),
        modifiedAt: new Date('2023-11-22T10:54:50Z'),
      },
    ])

    jest.spyOn(mockThreadService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a':
          return {
            id: 'a',
            name: '',
            displayMode: 'monologue',
            trash: true,
            deleted: true,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.threadUpdate.push({
      id: 'a',
      name: '',
      displayMode: 'monologue',
      trash: true,
      deleted: true,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:50Z'),
    })

    expect(
      await diff(mockCompanion, mockThreadService, mockNoteService, timestamp)
    ).toStrictEqual(expected)
  })

  test('the companion deleted a thread, and later we companion deleted it too', async () => {
    const mockCompanion = new MockCompanion()
    const mockThreadService = new MockThreadService()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getThreadUpdates').mockResolvedValueOnce([
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
    ])

    jest.spyOn(mockThreadService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a':
          return {
            id: 'a',
            name: '',
            displayMode: 'monologue',
            trash: true,
            deleted: true,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    // 更新なし

    expect(
      await diff(mockCompanion, mockThreadService, mockNoteService, timestamp)
    ).toStrictEqual(expected)
  })
})

describe('diffThread', () => {
  test('the companion modified a note, but we do not have that', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInThread').mockResolvedValueOnce([
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

    jest
      .spyOn(mockCompanion, 'getAllNotesInNote')
      .mockImplementationOnce(async (x) => {
        return x.id === 'a_a'
          ? [
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
            ]
          : []
      })

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a':
          return null
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.noteCreate.push(
      {
        id: 'a_a',
        content: '',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-12-07T14:58:31Z'),
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
        updatedAt: new Date('2023-12-07T14:58:31Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      }
    )

    expect(
      await diffThread(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('the companion modified a note, and later we modified it too', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInThread').mockResolvedValueOnce([
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

    jest
      .spyOn(mockCompanion, 'getNoteUpdatesInTree')
      .mockImplementation(async (x) =>
        x.id === 'a_a'
          ? [
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
            ]
          : []
      )

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a':
          return {
            id: 'a_a',
            content: 'our note',
            threadId: 'a',
            parentId: null,
            trash: false,
            deleted: false,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:50Z'),
            modifiedAt: new Date('2023-11-22T10:54:50Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.noteCreate.push({
      id: 'a_a_a',
      content: '',
      threadId: 'a',
      parentId: 'a_a',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:49Z'),
    })

    expect(
      await diffThread(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('we modified a note, and later the companion modified it too', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInThread').mockResolvedValueOnce([
      {
        id: 'a_a',
        content: '',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:50Z'),
        modifiedAt: new Date('2023-11-22T10:54:50Z'),
      },
    ])

    jest
      .spyOn(mockCompanion, 'getNoteUpdatesInTree')
      .mockImplementation(async (x) =>
        x.id === 'a_a'
          ? [
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
            ]
          : []
      )

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a':
          return {
            id: 'a_a',
            content: 'our note',
            threadId: 'a',
            parentId: null,
            trash: false,
            deleted: false,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.noteCreate.push({
      id: 'a_a_a',
      content: '',
      threadId: 'a',
      parentId: 'a_a',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:49Z'),
    })
    expected.noteUpdate.push({
      id: 'a_a',
      content: '',
      threadId: 'a',
      parentId: null,
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:50Z'),
    })

    expect(
      await diffThread(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('we deleted a note, but later the companion make modification on it', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')
    jest.spyOn(mockCompanion, 'getNoteUpdatesInThread').mockResolvedValueOnce([
      {
        id: 'a_a',
        content: '',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:50Z'),
        modifiedAt: new Date('2023-11-22T10:54:50Z'),
      },
    ])
    jest
      .spyOn(mockCompanion, 'getAllNotesInNote')
      .mockImplementation(async (x) =>
        x.id === 'a_a'
          ? [
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
            ]
          : []
      )
    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a':
          return {
            id: 'a_a',
            content: 'our note',
            threadId: 'a',
            parentId: null,
            trash: true,
            deleted: true,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.noteUpdate.push({
      id: 'a_a',
      content: '',
      threadId: 'a',
      parentId: null,
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:50Z'),
    })
    expected.noteCreate.push({
      id: 'a_a_a',
      content: '',
      threadId: 'a',
      parentId: 'a_a',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:49Z'),
    })
    expect(
      await diffThread(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('the companion had modified a note before we deleted it', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInThread').mockResolvedValueOnce([
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

    jest
      .spyOn(mockCompanion, 'getAllNotesInNote')
      .mockImplementation(async (x) =>
        x.id === 'a_a'
          ? [
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
            ]
          : []
      )

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a':
          return {
            id: 'a_a',
            content: 'our note',
            threadId: 'a',
            parentId: null,
            trash: true,
            deleted: true,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    // 更新なし

    expect(
      await diffThread(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('the companion deleted a note but we do not have it', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInThread').mockResolvedValueOnce([
      {
        id: 'a_a',
        content: '',
        threadId: 'a',
        parentId: null,
        trash: true,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      },
    ])

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a':
          return null
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.noteCreate.push({
      id: 'a_a',
      content: '',
      threadId: 'a',
      parentId: null,
      trash: true,
      deleted: true,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:49Z'),
    })

    expect(
      await diffThread(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('the companion deleted a note after we modified it', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInThread').mockResolvedValueOnce([
      {
        id: 'a_a',
        content: '',
        threadId: 'a',
        parentId: null,
        trash: true,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:50Z'),
        modifiedAt: new Date('2023-11-22T10:54:50Z'),
      },
    ])

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a':
          return {
            id: 'a_a',
            content: '',
            threadId: 'a',
            parentId: null,
            trash: false,
            deleted: false,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.noteUpdate.push({
      id: 'a_a',
      content: '',
      threadId: 'a',
      parentId: null,
      trash: true,
      deleted: true,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:50Z'),
    })
    expected.noteDeleteNoteIds.push('a_a')

    expect(
      await diffThread(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('we modified a note after the companion deleted it', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInThread').mockResolvedValueOnce([
      {
        id: 'a_a',
        content: '',
        threadId: 'a',
        parentId: null,
        trash: true,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      },
    ])

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a':
          return {
            id: 'a_a',
            content: '',
            threadId: 'a',
            parentId: null,
            trash: false,
            deleted: false,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    // 更新なし

    expect(
      await diffThread(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('we deleted a note and later the companion deleted it too', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInThread').mockResolvedValueOnce([
      {
        id: 'a_a',
        content: '',
        threadId: 'a',
        parentId: null,
        trash: true,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:50Z'),
        modifiedAt: new Date('2023-11-22T10:54:50Z'),
      },
    ])

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a':
          return {
            id: 'a_a',
            content: '',
            threadId: 'a',
            parentId: null,
            trash: true,
            deleted: true,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.noteUpdate.push({
      id: 'a_a',
      content: '',
      threadId: 'a',
      parentId: null,
      trash: true,
      deleted: true,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:50Z'),
    })

    expect(
      await diffThread(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('we also deleted a note after the companion deleted it', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInThread').mockResolvedValueOnce([
      {
        id: 'a_a',
        content: '',
        threadId: 'a',
        parentId: null,
        trash: true,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      },
    ])

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a':
          return {
            id: 'a_a',
            content: '',
            threadId: 'a',
            parentId: null,
            trash: true,
            deleted: true,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    // 更新なし

    expect(
      await diffThread(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })
})

describe('diffTree', () => {
  test('the companion modified a note, but we do not have that', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInTree').mockResolvedValueOnce([
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

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a_a':
          return null
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.noteCreate.push({
      id: 'a_a_a',
      content: '',
      threadId: 'a',
      parentId: 'a_a',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:49Z'),
    })

    expect(
      await diffTree(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('their modification is applied', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInTree').mockResolvedValueOnce([
      {
        id: 'a_a_a',
        content: 'companion',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:50Z'),
      },
    ])

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a_a':
          return {
            id: 'a_a_a',
            content: 'latest',
            threadId: 'a',
            parentId: 'a_a',
            trash: false,
            deleted: false,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.noteUpdate.push({
      id: 'a_a_a',
      content: 'companion',
      threadId: 'a',
      parentId: 'a_a',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:50Z'),
    })

    expect(
      await diffTree(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('our modification is applied', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInTree').mockResolvedValueOnce([
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

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a_a':
          return {
            id: 'a_a_a',
            content: 'latest',
            threadId: 'a',
            parentId: 'a_a',
            trash: false,
            deleted: false,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:50Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    // 更新なし

    expect(
      await diffTree(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('the companion modified a note, but later we deleted the note', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInTree').mockResolvedValueOnce([
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

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a_a':
          return {
            id: 'a_a_a',
            content: 'latest',
            threadId: 'a',
            parentId: 'a_a',
            trash: true,
            deleted: true,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:50Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    // 更新なし
    expect(
      await diffTree(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('we deleted a note, but later the companion modified it', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInTree').mockResolvedValueOnce([
      {
        id: 'a_a_a',
        content: 'modified',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:50Z'),
      },
    ])

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a_a':
          return {
            id: 'a_a_a',
            content: 'latest',
            threadId: 'a',
            parentId: 'a_a',
            trash: true,
            deleted: true,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.noteUpdate.push({
      id: 'a_a_a',
      content: 'modified',
      threadId: 'a',
      parentId: 'a_a',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:50Z'),
    })

    expect(
      await diffTree(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('the companion deleted a note, but we do not have that', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInTree').mockResolvedValueOnce([
      {
        id: 'a_a_a',
        content: '',
        threadId: 'a',
        parentId: 'a_a',
        trash: true,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      },
    ])

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a_a':
          return null
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.noteCreate.push({
      id: 'a_a_a',
      content: '',
      threadId: 'a',
      parentId: 'a_a',
      trash: true,
      deleted: true,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:49Z'),
    })

    expect(
      await diffTree(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('the companion deleted a note after our last modification', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInTree').mockResolvedValueOnce([
      {
        id: 'a_a_a',
        content: '',
        threadId: 'a',
        parentId: 'a_a',
        trash: true,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:50Z'),
      },
    ])

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a_a':
          return {
            id: 'a_a_a',
            content: '',
            threadId: 'a',
            parentId: 'a_a',
            trash: false,
            deleted: false,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.noteUpdate.push({
      id: 'a_a_a',
      content: '',
      threadId: 'a',
      parentId: 'a_a',
      trash: true,
      deleted: true,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:50Z'),
    })

    expect(
      await diffTree(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('the companion deleted a note but we later modified it', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInTree').mockResolvedValueOnce([
      {
        id: 'a_a_a',
        content: '',
        threadId: 'a',
        parentId: 'a_a',
        trash: true,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      },
    ])

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a_a':
          return {
            id: 'a_a_a',
            content: '',
            threadId: 'a',
            parentId: 'a_a',
            trash: false,
            deleted: false,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:50Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    // 更新なし

    expect(
      await diffTree(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('we deleted a note, but later the companion deleted it too', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInTree').mockResolvedValueOnce([
      {
        id: 'a_a_a',
        content: '',
        threadId: 'a',
        parentId: 'a_a',
        trash: true,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:50Z'),
        modifiedAt: new Date('2023-11-22T10:54:50Z'),
      },
    ])

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a_a':
          return {
            id: 'a_a_a',
            content: '',
            threadId: 'a',
            parentId: 'a_a',
            trash: true,
            deleted: true,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:49Z'),
            modifiedAt: new Date('2023-11-22T10:54:49Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    expected.noteUpdate.push({
      id: 'a_a_a',
      content: '',
      threadId: 'a',
      parentId: 'a_a',
      trash: true,
      deleted: true,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-12-07T14:58:31Z'),
      modifiedAt: new Date('2023-11-22T10:54:50Z'),
    })

    expect(
      await diffTree(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })

  test('the companion deleted a note, later we deleted it too', async () => {
    const mockCompanion = new MockCompanion()
    const mockNoteService = new MockNoteService()
    const timestamp = new Date('2023-12-07T14:58:31Z')

    jest.spyOn(mockCompanion, 'getNoteUpdatesInTree').mockResolvedValueOnce([
      {
        id: 'a_a_a',
        content: '',
        threadId: 'a',
        parentId: 'a_a',
        trash: true,
        deleted: true,
        createdAt: new Date('2023-11-22T10:54:49Z'),
        updatedAt: new Date('2023-11-22T10:54:49Z'),
        modifiedAt: new Date('2023-11-22T10:54:49Z'),
      },
    ])

    jest.spyOn(mockNoteService, 'find').mockImplementation(async (x) => {
      switch (x) {
        case 'a_a_a':
          return {
            id: 'a_a_a',
            content: '',
            threadId: 'a',
            parentId: 'a_a',
            trash: true,
            deleted: true,
            createdAt: new Date('2023-11-22T10:54:49Z'),
            updatedAt: new Date('2023-11-22T10:54:50Z'),
            modifiedAt: new Date('2023-11-22T10:54:50Z'),
          }
        default:
          return null
      }
    })

    const expected = new Diff()

    // 更新なし

    expect(
      await diffTree(
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
        mockCompanion,
        mockNoteService,
        timestamp
      )
    ).toStrictEqual(expected)
  })
})
