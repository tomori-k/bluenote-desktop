import { assertDateGreaterThanOrEqual, testPrisma } from './helper'
import { NoteService } from '../../src/main/services/note_service'
import { PrismaClient } from '@prisma/client'

describe('get', () => {
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
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)

    await expect(noteService.get('a_a')).resolves.toStrictEqual({
      id: 'a_a',
      content: '',
      threadId: 'a',
      parentId: null,
      trash: true,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:48Z'),
      updatedAt: new Date('2023-11-22T10:54:49Z'),
      modifiedAt: new Date('2023-11-22T10:54:49Z'),
    })
  })

  testPrisma('not found', async (prisma) => {
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

    const noteService = new NoteService(prisma)

    await expect(noteService.get('a_a')).rejects.toThrow(Error)
  })
})

describe('findInThread', () => {
  testPrisma('asc', async (prisma) => {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        {
          id: 'a_a_a',
          content: 'いうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        {
          id: 'a_b',
          content: 'あいう',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        {
          id: 'a_c',
          content: 'いう',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_d',
          content: 'いうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_e',
          content: 'いう',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_f',
          content: 'いう',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: true,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_g',
          content: 'い う',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'b_a',
          content: 'いう',
          threadId: 'b',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)

    // count=1

    await expect(
      noteService.findInThread(
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
        'いう',
        null,
        1,
        false
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_c',
        content: 'いう',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])
    await expect(
      noteService.findInThread(
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
        'いう',
        'a_c',
        1,
        false
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_d',
        content: 'いうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])
    await expect(
      noteService.findInThread(
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
        'いう',
        'a_d',
        1,
        false
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])
    await expect(
      noteService.findInThread(
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
        'いう',
        'a_a',
        1,
        false
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_b',
        content: 'あいう',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])

    // count=2

    await expect(
      noteService.findInThread(
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
        'いう',
        null,
        2,
        false
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_c',
        content: 'いう',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
      {
        id: 'a_d',
        content: 'いうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])
    await expect(
      noteService.findInThread(
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
        'いう',
        'a_d',
        2,
        false
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
      {
        id: 'a_b',
        content: 'あいう',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])

    // count=3

    await expect(
      noteService.findInThread(
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
        'いう',
        null,
        3,
        false
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_c',
        content: 'いう',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
      {
        id: 'a_d',
        content: 'いうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
      {
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])
    await expect(
      noteService.findInThread(
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
        'いう',
        'a_a',
        3,
        false
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_b',
        content: 'あいう',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])

    // count=4

    await expect(
      noteService.findInThread(
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
        'いう',
        null,
        4,
        false
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_c',
        content: 'いう',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
      {
        id: 'a_d',
        content: 'いうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
      {
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
      {
        id: 'a_b',
        content: 'あいう',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])
  })

  testPrisma('desc', async (prisma) => {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        {
          id: 'a_a_a',
          content: 'いうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        {
          id: 'a_b',
          content: 'あいう',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        {
          id: 'a_c',
          content: 'いう',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_d',
          content: 'いうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_e',
          content: 'いう',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_f',
          content: 'いう',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: true,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_g',
          content: 'い う',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'b_a',
          content: 'いう',
          threadId: 'b',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)

    // count=1

    await expect(
      noteService.findInThread(
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
        'いう',
        null,
        1,
        true
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])

    await expect(
      noteService.findInThread(
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
        'いう',
        'a_a',
        1,
        true
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_b',
        content: 'あいう',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])
    await expect(
      noteService.findInThread(
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
        'いう',
        'a_b',
        1,
        true
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_c',
        content: 'いう',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])
    await expect(
      noteService.findInThread(
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
        'いう',
        'a_c',
        1,
        true
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_d',
        content: 'いうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])

    // count=2

    await expect(
      noteService.findInThread(
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
        'いう',
        null,
        2,
        true
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
      {
        id: 'a_b',
        content: 'あいう',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])
    await expect(
      noteService.findInThread(
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
        'いう',
        'a_b',
        2,
        true
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_c',
        content: 'いう',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
      {
        id: 'a_d',
        content: 'いうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])

    // count=3

    await expect(
      noteService.findInThread(
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
        'いう',
        null,
        3,
        true
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
      {
        id: 'a_b',
        content: 'あいう',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
      {
        id: 'a_c',
        content: 'いう',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])
    await expect(
      noteService.findInThread(
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
        'いう',
        'a_c',
        3,
        true
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_d',
        content: 'いうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])

    // count=4

    await expect(
      noteService.findInThread(
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
        'いう',
        null,
        4,
        true
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
      {
        id: 'a_b',
        content: 'あいう',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
      {
        id: 'a_c',
        content: 'いう',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
      {
        id: 'a_d',
        content: 'いうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])
  })
})

describe('findInTree', () => {
  async function initDatabaseAsc(prisma: PrismaClient) {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        {
          id: 'a_a_a',
          content: 'あいう',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        {
          id: 'a_a_b',
          content: 'いう',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_a_c',
          content: 'いうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_a_d',
          content: 'いう',
          threadId: 'a',
          parentId: 'a_a',
          trash: true,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_a_e',
          content: 'いう',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: true,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_a_f',
          content: 'い う',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_b',
          content: 'いう',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'b_a',
          content: 'いう',
          threadId: 'b',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )
  }

  testPrisma('asc,count=1', async (prisma) => {
    await initDatabaseAsc(prisma)

    const noteService = new NoteService(prisma)

    // count=1

    await expect(
      noteService.findInTree(
        {
          id: 'a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        'いう',
        null,
        1,
        false
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a_b',
        content: 'いう',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])
    await expect(
      noteService.findInTree(
        {
          id: 'a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        'いう',
        'a_a_b',
        1,
        false
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a_c',
        content: 'いうえお',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])
    await expect(
      noteService.findInTree(
        {
          id: 'a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        'いう',
        'a_a_c',
        2,
        false
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a_a',
        content: 'あいう',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])
  })

  testPrisma('asc,count=2', async (prisma) => {
    await initDatabaseAsc(prisma)

    const noteService = new NoteService(prisma)

    await expect(
      noteService.findInTree(
        {
          id: 'a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        'いう',
        null,
        2,
        false
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a_b',
        content: 'いう',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
      {
        id: 'a_a_c',
        content: 'いうえお',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])
    await expect(
      noteService.findInTree(
        {
          id: 'a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        'いう',
        'a_a_c',
        2,
        false
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a_a',
        content: 'あいう',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])
  })

  testPrisma('asc,count=3', async (prisma) => {
    await initDatabaseAsc(prisma)

    const noteService = new NoteService(prisma)

    await expect(
      noteService.findInTree(
        {
          id: 'a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        'いう',
        null,
        3,
        false
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a_b',
        content: 'いう',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
      {
        id: 'a_a_c',
        content: 'いうえお',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
      {
        id: 'a_a_a',
        content: 'あいう',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])
  })

  async function initDatabaseDesc(prisma: PrismaClient) {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        {
          id: 'a_a_a',
          content: 'あいう',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        {
          id: 'a_a_b',
          content: 'いう',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_a_c',
          content: 'いうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_a_d',
          content: 'いう',
          threadId: 'a',
          parentId: 'a_a',
          trash: true,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_a_e',
          content: 'いう',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: true,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_a_f',
          content: 'い う',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'a_b',
          content: 'いう',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
        {
          id: 'b_a',
          content: 'いう',
          threadId: 'b',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )
  }

  testPrisma('desc,count=1', async (prisma) => {
    await initDatabaseDesc(prisma)

    const noteService = new NoteService(prisma)

    // count=1

    await expect(
      noteService.findInTree(
        {
          id: 'a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        'いう',
        null,
        1,
        true
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a_a',
        content: 'あいう',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])
    await expect(
      noteService.findInTree(
        {
          id: 'a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        'いう',
        'a_a_a',
        1,
        true
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a_b',
        content: 'いう',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])
    await expect(
      noteService.findInTree(
        {
          id: 'a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        'いう',
        'a_a_b',
        1,
        true
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a_c',
        content: 'いうえお',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])
  })

  testPrisma('desc,count=2', async (prisma) => {
    await initDatabaseDesc(prisma)

    const noteService = new NoteService(prisma)

    // count=2

    await expect(
      noteService.findInTree(
        {
          id: 'a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        'いう',
        null,
        2,
        true
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a_a',
        content: 'あいう',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
      {
        id: 'a_a_b',
        content: 'いう',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])
    await expect(
      noteService.findInTree(
        {
          id: 'a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        'いう',
        'a_a_b',
        2,
        true
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a_c',
        content: 'いうえお',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])
  })

  testPrisma('desc,count=3', async (prisma) => {
    await initDatabaseDesc(prisma)

    const noteService = new NoteService(prisma)

    // count=3

    await expect(
      noteService.findInTree(
        {
          id: 'a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        'いう',
        null,
        3,
        true
      )
    ).resolves.toStrictEqual([
      {
        id: 'a_a_a',
        content: 'あいう',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
      {
        id: 'a_a_b',
        content: 'いう',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
      {
        id: 'a_a_c',
        content: 'いうえお',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])
  })
})

describe('findInTrash', () => {
  async function initDatabase(prisma: PrismaClient) {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        {
          id: 'a_a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: true,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        {
          id: 'a_b',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        {
          id: 'a_c',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: true,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        {
          id: 'a_d',
          content: 'い う',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date('3000-01-01T00:00:00Z'),
          updatedAt: new Date('3000-01-01T00:00:00Z'),
          modifiedAt: new Date('3000-01-01T00:00:00Z'),
        },
        {
          id: 'b_a',
          content: 'いう',
          threadId: 'b',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          modifiedAt: new Date(0),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )
  }

  testPrisma('count=1', async (prisma) => {
    await initDatabase(prisma)

    const noteService = new NoteService(prisma)

    await expect(
      noteService.findInTrash('いう', null, 1)
    ).resolves.toStrictEqual([
      {
        id: 'b_a',
        content: 'いう',
        threadId: 'b',
        parentId: null,
        trash: true,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
    ])
    await expect(
      noteService.findInTrash('いう', 'b_a', 1)
    ).resolves.toStrictEqual([
      {
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: true,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])
    await expect(
      noteService.findInTrash('いう', 'a_a', 1)
    ).resolves.toStrictEqual([
      {
        id: 'a_a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: 'a_a',
        trash: true,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])
  })

  testPrisma('count=2', async (prisma) => {
    await initDatabase(prisma)

    const noteService = new NoteService(prisma)

    await expect(
      noteService.findInTrash('いう', null, 2)
    ).resolves.toStrictEqual([
      {
        id: 'b_a',
        content: 'いう',
        threadId: 'b',
        parentId: null,
        trash: true,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
      {
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: true,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])
    await expect(
      noteService.findInTrash('いう', 'a_a', 2)
    ).resolves.toStrictEqual([
      {
        id: 'a_a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: 'a_a',
        trash: true,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])
  })

  testPrisma('count=3', async (prisma) => {
    await initDatabase(prisma)

    const noteService = new NoteService(prisma)

    await expect(
      noteService.findInTrash('いう', null, 3)
    ).resolves.toStrictEqual([
      {
        id: 'b_a',
        content: 'いう',
        threadId: 'b',
        parentId: null,
        trash: true,
        deleted: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        modifiedAt: new Date(0),
      },
      {
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: true,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
      {
        id: 'a_a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: 'a_a',
        trash: true,
        deleted: false,
        createdAt: new Date('3000-01-01T00:00:00Z'),
        updatedAt: new Date('3000-01-01T00:00:00Z'),
        modifiedAt: new Date('3000-01-01T00:00:00Z'),
      },
    ])
  })
})

describe('createInThread', () => {
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

    const noteService = new NoteService(prisma)
    const timestamp = new Date()

    const created = await noteService.createInThread('あいうえお', {
      id: 'a',
      name: '',
      displayMode: 'monologue',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-22T10:54:49Z'),
      updatedAt: new Date('2023-11-22T10:54:49Z'),
      modifiedAt: new Date('2023-11-22T10:54:49Z'),
    })
    const dataInDb = await prisma.note.findUniqueOrThrow({
      where: { id: created.id },
    })

    expect(created).toStrictEqual(dataInDb)
    expect(created.id).toMatch(/^[A-z0-9]{8}(-[A-z0-9]{4}){3}-[A-z0-9]{12}$/)
    expect(created.content).toBe('あいうえお')
    expect(created.threadId).toBe('a')
    expect(created.parentId).toBe(null)
    expect(created.trash).toBe(false)
    expect(created.deleted).toBe(false)
    assertDateGreaterThanOrEqual(created.createdAt, timestamp)
    assertDateGreaterThanOrEqual(created.updatedAt, timestamp)
    assertDateGreaterThanOrEqual(created.modifiedAt, timestamp)
  })

  testPrisma('thread not exist', async (prisma) => {
    const noteService = new NoteService(prisma)

    await expect(
      noteService.createInThread('あいうえお', {
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

  testPrisma('thread deleted', async (prisma) => {
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

    const noteService = new NoteService(prisma)

    await expect(
      noteService.createInThread('あいうえお', {
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

  testPrisma('thread removed', async (prisma) => {
    const noteService = new NoteService(prisma)

    await expect(
      noteService.createInThread('あいうえお', {
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

  testPrisma('thread deleted', async (prisma) => {
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

    const noteService = new NoteService(prisma)

    await expect(
      noteService.createInThread('あいうえお', {
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

describe('createInTree', () => {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)
    const timestamp = new Date()

    const created = await noteService.createInTree('あいうえお', {
      id: 'a_a',
      content: 'あいうえお',
      threadId: 'a',
      parentId: null,
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-27T16:59:49Z'),
      updatedAt: new Date('2023-11-27T16:59:49Z'),
      modifiedAt: new Date('2023-11-27T16:59:49Z'),
    })
    const dataInDb = await prisma.note.findUniqueOrThrow({
      where: { id: created.id },
    })

    expect(created).toStrictEqual(dataInDb)
    expect(created.id).toMatch(/^[A-z0-9]{8}(-[A-z0-9]{4}){3}-[A-z0-9]{12}$/)
    expect(created.content).toBe('あいうえお')
    expect(created.threadId).toBe('a')
    expect(created.parentId).toBe('a_a')
    expect(created.trash).toBe(false)
    expect(created.deleted).toBe(false)
    assertDateGreaterThanOrEqual(created.createdAt, timestamp)
    assertDateGreaterThanOrEqual(created.updatedAt, timestamp)
    assertDateGreaterThanOrEqual(created.modifiedAt, timestamp)
  })

  testPrisma('parent not exist', async (prisma) => {
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

    const noteService = new NoteService(prisma)

    await expect(
      noteService.createInTree('あいうえお', {
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
      })
    ).rejects.toThrow(Error)
  })

  testPrisma('parent deleted', async (prisma) => {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: true,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)

    await expect(
      noteService.createInTree('あいうえお', {
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
      })
    ).rejects.toThrow(Error)
  })

  testPrisma('parent removed', async (prisma) => {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)

    await expect(
      noteService.createInTree('あいうえお', {
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
      })
    ).rejects.toThrow(Error)
  })

  testPrisma('prohibit nested tree', async (prisma) => {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)

    await expect(
      noteService.createInTree('あいうえお', {
        id: 'a_a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
      })
    ).rejects.toThrow(Error)
  })
})

describe('edit', () => {
  testPrisma('note in thread', async (prisma) => {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)
    const timestamp = new Date()

    const updated = await noteService.edit('かきくけこ', {
      id: 'a_a',
      content: 'あいうえお',
      threadId: 'a',
      parentId: null,
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-27T16:59:49Z'),
      updatedAt: new Date('2023-11-27T16:59:49Z'),
      modifiedAt: new Date('2023-11-27T16:59:49Z'),
    })
    const dataInDb = await prisma.note.findUniqueOrThrow({
      where: { id: updated.id },
    })

    expect(updated).toStrictEqual(dataInDb)
    expect(updated.content).toBe('かきくけこ')
    assertDateGreaterThanOrEqual(updated.updatedAt, timestamp)
    assertDateGreaterThanOrEqual(updated.modifiedAt, timestamp)

    // thread

    const thread = await prisma.thread.findUniqueOrThrow({
      where: { id: updated.threadId },
    })

    assertDateGreaterThanOrEqual(thread.updatedAt, timestamp)
  })

  testPrisma('note in tree', async (prisma) => {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)
    const timestamp = new Date()

    const updated = await noteService.edit('かきくけこ', {
      id: 'a_a_a',
      content: 'あいうえお',
      threadId: 'a',
      parentId: 'a_a',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-27T16:59:49Z'),
      updatedAt: new Date('2023-11-27T16:59:49Z'),
      modifiedAt: new Date('2023-11-27T16:59:49Z'),
    })
    const dataInDb = await prisma.note.findUniqueOrThrow({
      where: { id: updated.id },
    })

    expect(updated).toStrictEqual(dataInDb)
    expect(updated.content).toBe('かきくけこ')
    assertDateGreaterThanOrEqual(updated.updatedAt, timestamp)
    assertDateGreaterThanOrEqual(updated.modifiedAt, timestamp)

    // thread

    const thread = await prisma.thread.findUniqueOrThrow({
      where: { id: updated.threadId },
    })

    assertDateGreaterThanOrEqual(thread.updatedAt, timestamp)

    // parent

    const parent = await prisma.note.findUniqueOrThrow({
      where: { id: updated.parentId },
    })

    assertDateGreaterThanOrEqual(parent.updatedAt, timestamp)
  })

  testPrisma('trash', async (prisma) => {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)

    await expect(
      noteService.edit('かきくけこ', {
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: true,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)

    await expect(
      noteService.edit('かきくけこ', {
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
      })
    ).rejects.toThrow(Error)
  })

  testPrisma('not exist', async (prisma) => {
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

    const noteService = new NoteService(prisma)

    await expect(
      noteService.edit('かきくけこ', {
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
      })
    ).rejects.toThrow(Error)
  })
})

describe('remove', () => {
  testPrisma('remove note in thread', async (prisma) => {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_a_b',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_a_c',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: true,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)
    const timestamp = new Date()

    await noteService.remove({
      id: 'a_a',
      content: 'あいうえお',
      threadId: 'a',
      parentId: null,
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-27T16:59:49Z'),
      updatedAt: new Date('2023-11-27T16:59:49Z'),
      modifiedAt: new Date('2023-11-27T16:59:49Z'),
    })
    const removed = await prisma.note.findUniqueOrThrow({
      where: { id: 'a_a' },
    })
    const removedChild = await prisma.note.findUniqueOrThrow({
      where: { id: 'a_a_a' },
    })
    const unchangedChildren = await prisma.note.findMany({
      where: {
        OR: [
          {
            id: 'a_a_b',
          },
          {
            id: 'a_a_c',
          },
        ],
      },
      orderBy: {
        id: 'asc',
      },
    })

    expect(removed.trash).toBe(true)
    assertDateGreaterThanOrEqual(removed.updatedAt, timestamp)
    assertDateGreaterThanOrEqual(removed.modifiedAt, timestamp)

    expect(removedChild.trash).toBe(true)
    assertDateGreaterThanOrEqual(removedChild.updatedAt, timestamp)
    assertDateGreaterThanOrEqual(removedChild.modifiedAt, timestamp)

    expect(unchangedChildren).toStrictEqual([
      {
        id: 'a_a_b',
        content: 'あいうえお',
        threadId: 'a',
        parentId: 'a_a',
        trash: true,
        deleted: false,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
      },
      {
        id: 'a_a_c',
        content: 'あいうえお',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: true,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
      },
    ])

    // thread

    const thread = await prisma.thread.findUniqueOrThrow({
      where: { id: 'a' },
    })

    assertDateGreaterThanOrEqual(thread.updatedAt, timestamp)
  })

  testPrisma('remove note in tree', async (prisma) => {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)
    const timestamp = new Date()

    await noteService.remove({
      id: 'a_a_a',
      content: 'あいうえお',
      threadId: 'a',
      parentId: 'a_a',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-27T16:59:49Z'),
      updatedAt: new Date('2023-11-27T16:59:49Z'),
      modifiedAt: new Date('2023-11-27T16:59:49Z'),
    })
    const removed = await prisma.note.findUniqueOrThrow({
      where: { id: 'a_a_a' },
    })

    expect(removed.trash).toBe(true)
    assertDateGreaterThanOrEqual(removed.updatedAt, timestamp)
    assertDateGreaterThanOrEqual(removed.modifiedAt, timestamp)

    // thread

    const thread = await prisma.thread.findUniqueOrThrow({
      where: { id: 'a' },
    })

    assertDateGreaterThanOrEqual(thread.updatedAt, timestamp)

    // parent

    const parent = await prisma.note.findUniqueOrThrow({
      where: { id: 'a_a' },
    })

    assertDateGreaterThanOrEqual(parent.updatedAt, timestamp)
  })

  testPrisma('trash', async (prisma) => {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)

    await expect(
      noteService.remove({
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: true,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)

    await expect(
      noteService.remove({
        id: 'a_a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
      })
    ).rejects.toThrow(Error)
  })

  testPrisma('not exist', async (prisma) => {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)

    await expect(
      noteService.remove({
        id: 'a_a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: 'a_a',
        trash: false,
        deleted: false,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
      })
    ).rejects.toThrow(Error)
  })
})

describe('restore', () => {
  testPrisma('parent removed', async (prisma) => {
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
    await Promise.all(
      [
        {
          id: 'a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)
    const timestamp = new Date()

    await noteService.restore({
      id: 'a_a_a',
      content: 'あいうえお',
      threadId: 'a',
      parentId: 'a_a',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-27T16:59:49Z'),
      updatedAt: new Date('2023-11-27T16:59:49Z'),
      modifiedAt: new Date('2023-11-27T16:59:49Z'),
    })
    const restored = await prisma.note.findUniqueOrThrow({
      where: { id: 'a_a_a' },
    })
    const thread = await prisma.thread.findUniqueOrThrow({
      where: { id: 'a' },
    })
    const parent = await prisma.note.findUniqueOrThrow({
      where: { id: 'a_a' },
    })

    expect(restored.trash).toBe(false)
    assertDateGreaterThanOrEqual(restored.updatedAt, timestamp)
    assertDateGreaterThanOrEqual(restored.modifiedAt, timestamp)

    expect(thread.trash).toBe(false)
    assertDateGreaterThanOrEqual(thread.updatedAt, timestamp)
    assertDateGreaterThanOrEqual(thread.modifiedAt, timestamp)

    expect(parent.trash).toBe(false)
    assertDateGreaterThanOrEqual(parent.updatedAt, timestamp)
    assertDateGreaterThanOrEqual(parent.modifiedAt, timestamp)
  })

  testPrisma('parent not removed', async (prisma) => {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)
    const timestamp = new Date()

    await noteService.restore({
      id: 'a_a_a',
      content: 'あいうえお',
      threadId: 'a',
      parentId: 'a_a',
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-27T16:59:49Z'),
      updatedAt: new Date('2023-11-27T16:59:49Z'),
      modifiedAt: new Date('2023-11-27T16:59:49Z'),
    })
    const restored = await prisma.note.findUniqueOrThrow({
      where: { id: 'a_a_a' },
    })
    const thread = await prisma.thread.findUniqueOrThrow({
      where: { id: 'a' },
    })
    const parent = await prisma.note.findUniqueOrThrow({
      where: { id: 'a_a' },
    })

    expect(restored.trash).toBe(false)
    assertDateGreaterThanOrEqual(restored.updatedAt, timestamp)
    assertDateGreaterThanOrEqual(restored.modifiedAt, timestamp)

    expect(thread.trash).toBe(false)
    assertDateGreaterThanOrEqual(thread.updatedAt, timestamp)
    expect(thread.modifiedAt).toStrictEqual(new Date('2023-11-22T10:54:49Z'))

    expect(parent.trash).toBe(false)
    assertDateGreaterThanOrEqual(parent.updatedAt, timestamp)
    expect(parent.modifiedAt).toStrictEqual(new Date('2023-11-27T16:59:49Z'))
  })

  testPrisma('not in trash', async (prisma) => {
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
    await Promise.all(
      [
        {
          id: 'a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)

    await expect(
      noteService.restore({
        id: 'a_a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: 'a_a',
        trash: true,
        deleted: false,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: true,
          deleted: true,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)

    await expect(
      noteService.restore({
        id: 'a_a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: 'a_a',
        trash: true,
        deleted: false,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
      })
    ).rejects.toThrow(Error)
  })

  testPrisma('not exist', async (prisma) => {
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
    await Promise.all(
      [
        {
          id: 'a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)

    await expect(
      noteService.restore({
        id: 'a_a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: 'a_a',
        trash: true,
        deleted: false,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
      })
    ).rejects.toThrow(Error)
  })
})

describe('deleteNote', () => {
  testPrisma('delete note in thread', async (prisma) => {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_a_b',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_a_c',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: true,
          deleted: true,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_b',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)
    const timestamp = new Date()

    await noteService.deleteNote({
      id: 'a_a',
      content: 'あいうえお',
      threadId: 'a',
      parentId: null,
      trash: false,
      deleted: false,
      createdAt: new Date('2023-11-27T16:59:49Z'),
      updatedAt: new Date('2023-11-27T16:59:49Z'),
      modifiedAt: new Date('2023-11-27T16:59:49Z'),
    })
    const deleted = await prisma.note.findUniqueOrThrow({
      where: { id: 'a_a' },
    })

    expect(deleted.deleted).toBe(true)
    assertDateGreaterThanOrEqual(deleted.updatedAt, timestamp)
    assertDateGreaterThanOrEqual(deleted.modifiedAt, timestamp)

    expect(
      await prisma.note.findMany({
        where: {
          OR: [
            {
              id: 'a_a_a',
            },
            {
              id: 'a_a_b',
            },
            {
              id: 'a_a_c',
            },
          ],
        },
      })
    ).toStrictEqual([])

    expect(
      await prisma.note.findUniqueOrThrow({ where: { id: 'a_b' } })
    ).toStrictEqual({
      id: 'a_b',
      content: 'あいうえお',
      threadId: 'a',
      parentId: null,
      trash: true,
      deleted: false,
      createdAt: new Date('2023-11-27T16:59:49Z'),
      updatedAt: new Date('2023-11-27T16:59:49Z'),
      modifiedAt: new Date('2023-11-27T16:59:49Z'),
    })

    // thread

    const thread = await prisma.thread.findUniqueOrThrow({
      where: { id: 'a' },
    })

    assertDateGreaterThanOrEqual(thread.updatedAt, timestamp)
    expect(thread.modifiedAt).toStrictEqual(new Date('2023-11-22T10:54:49Z'))
  })

  testPrisma('delete note in tree', async (prisma) => {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_a_b',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_b',
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)
    const timestamp = new Date()

    await noteService.deleteNote({
      id: 'a_a_a',
      content: 'あいうえお',
      threadId: 'a',
      parentId: 'a_a',
      trash: true,
      deleted: false,
      createdAt: new Date('2023-11-27T16:59:49Z'),
      updatedAt: new Date('2023-11-27T16:59:49Z'),
      modifiedAt: new Date('2023-11-27T16:59:49Z'),
    })
    const deleted = await prisma.note.findUniqueOrThrow({
      where: { id: 'a_a_a' },
    })

    expect(deleted.deleted).toBe(true)
    assertDateGreaterThanOrEqual(deleted.updatedAt, timestamp)
    assertDateGreaterThanOrEqual(deleted.modifiedAt, timestamp)

    expect(
      await prisma.note.findUniqueOrThrow({ where: { id: 'a_b' } })
    ).toStrictEqual({
      id: 'a_b',
      content: 'あいうえお',
      threadId: 'a',
      parentId: null,
      trash: true,
      deleted: false,
      createdAt: new Date('2023-11-27T16:59:49Z'),
      updatedAt: new Date('2023-11-27T16:59:49Z'),
      modifiedAt: new Date('2023-11-27T16:59:49Z'),
    })

    expect(
      await prisma.note.findUniqueOrThrow({ where: { id: 'a_a_b' } })
    ).toStrictEqual({
      id: 'a_a_b',
      content: 'あいうえお',
      threadId: 'a',
      parentId: 'a_a',
      trash: true,
      deleted: false,
      createdAt: new Date('2023-11-27T16:59:49Z'),
      updatedAt: new Date('2023-11-27T16:59:49Z'),
      modifiedAt: new Date('2023-11-27T16:59:49Z'),
    })

    // parent

    const thread = await prisma.thread.findUniqueOrThrow({
      where: { id: 'a' },
    })
    const parent = await prisma.note.findUniqueOrThrow({
      where: { id: 'a_a' },
    })

    assertDateGreaterThanOrEqual(thread.updatedAt, timestamp)
    expect(thread.modifiedAt).toStrictEqual(new Date('2023-11-22T10:54:49Z'))

    assertDateGreaterThanOrEqual(parent.updatedAt, timestamp)
    expect(parent.modifiedAt).toStrictEqual(new Date('2023-11-27T16:59:49Z'))
  })

  testPrisma('not in trash', async (prisma) => {
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
        {
          id: 'a_a_a',
          content: 'あいうえお',
          threadId: 'a',
          parentId: 'a_a',
          trash: false,
          deleted: false,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)

    await expect(
      noteService.deleteNote({
        id: 'a_a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: 'a_a',
        trash: true,
        deleted: false,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
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
          content: 'あいうえお',
          threadId: 'a',
          parentId: null,
          trash: true,
          deleted: true,
          createdAt: new Date('2023-11-27T16:59:49Z'),
          updatedAt: new Date('2023-11-27T16:59:49Z'),
          modifiedAt: new Date('2023-11-27T16:59:49Z'),
        },
      ].map((x) => prisma.note.create({ data: x }))
    )

    const noteService = new NoteService(prisma)

    await expect(
      noteService.deleteNote({
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: true,
        deleted: false,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
      })
    ).rejects.toThrow(Error)
  })

  testPrisma('not exist', async (prisma) => {
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

    const noteService = new NoteService(prisma)

    await expect(
      noteService.deleteNote({
        id: 'a_a',
        content: 'あいうえお',
        threadId: 'a',
        parentId: null,
        trash: true,
        deleted: false,
        createdAt: new Date('2023-11-27T16:59:49Z'),
        updatedAt: new Date('2023-11-27T16:59:49Z'),
        modifiedAt: new Date('2023-11-27T16:59:49Z'),
      })
    ).rejects.toThrow(Error)
  })
})
