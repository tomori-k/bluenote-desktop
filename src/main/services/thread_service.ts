import { PrismaClient } from '@prisma/client'
import { Thread } from '../../common/thread'

export class ThreadService {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  public async get(id: string): Promise<Thread> {
    return await this.prisma.thread.findUniqueOrThrow({ where: { id: id } })
  }
}
