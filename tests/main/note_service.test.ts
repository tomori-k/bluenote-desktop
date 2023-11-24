import { testPrisma } from './helper'
import { NoteService } from '../../src/main/services/note_service'
import { Prisma, PrismaClient } from '@prisma/client'

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
