import { PrismaClient, Thread } from '@prisma/client'

export interface IThreadService {
  /**
   * すべてのスレッドを取得する
   */
  getAllThreads(): Promise<Thread[]>

  /**
   * スレッドを取得する
   * @param id スレッドの ID (UUID)
   */
  find(id: string): Promise<Thread | null>

  /**
   * スレッドを取得する
   * @param id スレッドの ID (UUID)
   */
  get(id: string): Promise<Thread>

  /**
   * スレッドを作成する
   * @param name スレッド名
   */
  create(name: string): Promise<Thread>

  /**
   * スレッド名を変更する
   * @param thread スレッド
   * @param name 新しいスレッド名
   */
  rename(thread: Thread, name: string): Promise<Thread>

  /**
   * スレッドの表示モードを変更する
   * @param thread スレッド
   * @param displayMode 新しい表示モード
   */
  changeDisplayMode(
    thread: Thread,
    displayMode: 'monologue' | 'scrap'
  ): Promise<Thread>

  /**
   * スレッドとそのメモをごみ箱に移動させる
   * @param thread ごみ箱に移動させるスレッド
   */
  remove(thread: Thread): Promise<void>

  /**
   * スレッドを完全に削除する
   * @param thread 削除するスレッド
   */
  deleteThread(thread: Thread): Promise<void>
}

export class ThreadService implements IThreadService {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  public async getAllThreads(): Promise<Thread[]> {
    return await this.prisma.thread.findMany({
      where: {
        trash: false,
        deleted: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
  }

  public async find(id: string): Promise<Thread | null> {
    return await this.prisma.thread.findUnique({ where: { id: id } })
  }

  public async get(id: string): Promise<Thread> {
    return await this.prisma.thread.findUniqueOrThrow({ where: { id: id } })
  }

  /**
   * スレッドが削除されていないことを確認する
   */
  private async checkRemovedState(thread: Thread): Promise<Thread> {
    thread = await this.get(thread.id)

    if (thread.trash || thread.deleted) {
      throw new Error('thread is now removed to trash or deleted')
    }

    return thread
  }

  public async create(name: string): Promise<Thread> {
    const timestamp = new Date()

    return await this.prisma.thread.create({
      data: {
        name: name,
        displayMode: 'monologue',
        trash: false,
        deleted: false,
        createdAt: timestamp,
        updatedAt: timestamp,
        modifiedAt: timestamp,
      },
    })
  }

  public async rename(thread: Thread, name: string): Promise<Thread> {
    thread = await this.checkRemovedState(thread)

    const timestamp = new Date()

    return await this.prisma.thread.update({
      where: {
        id: thread.id,
      },
      data: {
        name: name,
        updatedAt: timestamp,
        modifiedAt: timestamp,
      },
    })
  }

  public async changeDisplayMode(
    thread: Thread,
    displayMode: 'monologue' | 'scrap'
  ): Promise<Thread> {
    thread = await this.checkRemovedState(thread)

    const timestamp = new Date()

    return await this.prisma.thread.update({
      where: {
        id: thread.id,
      },
      data: {
        displayMode: displayMode,
        updatedAt: timestamp,
        modifiedAt: timestamp,
      },
    })
  }

  public async remove(thread: Thread): Promise<void> {
    thread = await this.checkRemovedState(thread)

    const timestamp = new Date()

    await this.prisma.$transaction(async (tx) => {
      await tx.thread.update({
        where: {
          id: thread.id,
        },
        data: {
          trash: true,
          updatedAt: timestamp,
          modifiedAt: timestamp,
        },
      })

      // このスレッドに属する !trash && !deleted なメモをごみ箱に移動
      await tx.note.updateMany({
        where: {
          threadId: thread.id,
          trash: false,
          deleted: false,
        },
        data: {
          trash: true,
          updatedAt: timestamp,
          modifiedAt: timestamp,
        },
      })
    })
  }

  public async deleteThread(thread: Thread): Promise<void> {
    thread = await this.get(thread.id)

    if (thread.deleted) {
      throw new Error('thread already deleted')
    }

    if (!thread.trash) {
      throw new Error('must remove it to trash before delete')
    }

    const timestamp = new Date()

    await this.prisma.$transaction(async (tx) => {
      // 削除されたとしてマークする
      await tx.thread.update({
        where: {
          id: thread.id,
        },
        data: {
          deleted: true,
          updatedAt: timestamp,
          modifiedAt: timestamp,
        },
      })

      // このスレッドのメモをすべてDBから削除
      await tx.note.deleteMany({
        where: {
          threadId: thread.id,
        },
      })
    })
  }
}
