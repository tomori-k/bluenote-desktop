import { ThreadService } from '../../src/main/services/thread_service'
import { testPrisma } from './helper'

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
