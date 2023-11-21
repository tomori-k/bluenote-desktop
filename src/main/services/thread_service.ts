import { PrismaClient } from '@prisma/client'
import { Thread } from '../../common/thread'

export class ThreadService {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * すべてのスレッドを取得する
   */
  public async getAllThreads(): Promise<Thread[]> {
    throw new Error()
  }

  public async get(id: string): Promise<Thread> {
    return await this.prisma.thread.findUniqueOrThrow({ where: { id: id } })
  }

  /**
   * スレッドを作成する
   * @param name スレッド名
   */
  public async create(name: string): Promise<Thread> {
    throw new Error()
  }

  /**
   * スレッド名を変更する
   * @param thread スレッド
   * @param name 新しいスレッド名
   */
  public async rename(thread: Thread, name: string): Promise<Thread> {
    throw new Error()
  }

  /**
   * スレッドの表示モードを変更する
   * @param thread スレッド
   * @param displayMode 新しい表示モード
   */
  public async changeDisplayMode(
    thread: Thread,
    displayMode: 'monologue' | 'scrap'
  ): Promise<Thread> {
    throw new Error()
  }

  /**
   * スレッドとそのメモをごみ箱に移動させる
   * @param thread ごみ箱に移動させるスレッド
   */
  public async remove(thread: Thread): Promise<void> {
    throw new Error()
  }

  /**
   * スレッドを完全に削除する
   * @param thread 削除するスレッド
   */
  public async deleteThread(thread: Thread): Promise<void> {
    throw new Error()
  }
}
