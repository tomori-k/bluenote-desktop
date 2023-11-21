import { PrismaClient } from '@prisma/client'
import { Note } from '../../common/note'
import { Thread } from '../../common/thread'

export class SyncService {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * 指定したスレッドのメモをすべて取得する
   * ごみ箱やツリーのメモも取得される
   * 完全に削除されたメモ (deleted = 1) は含まない
   * @param threadId スレッドの ID (UUID)
   */
  public async getAllNotesInThread(threadId: string): Promise<Note[]> {
    throw new Error()
  }

  /**
   * 指定したスレッドのメモをすべて取得する
   * ごみ箱やツリーのメモも取得される
   * 完全に削除されたメモ (deleted = 1) は含まない
   * @param parentId 親のメモの ID (UUID)
   */
  public async getAllNotesInTree(parentId: string): Promise<Note[]> {
    throw new Error()
  }

  /**
   * 指定した期間内に更新があったスレッドを作成日時昇順で取得する。
   * @param start 開始日時
   * @param end 終了日時（終了日時ちょうどは期間に含まない）
   */
  public async getUpdatedThreads(start: Date, end: Date): Promise<Thread[]> {
    throw new Error()
  }

  /**
   * 指定したスレッド直下にあるメモのうち、指定した期間内に更新があったものを作成日時昇順で取得する。
   * @param threadId スレッドの ID (UUID)
   * @param start 開始日時
   * @param end 終了日時（終了日時ちょうどは期間に含まない）
   */
  public async getUpdatedNotesInThread(
    threadId: string,
    start: Date,
    end: Date
  ): Promise<Note[]> {
    throw new Error()
  }

  /**
   * 指定したツリーにあるメモのうち、指定した期間内に更新があったものを作成日時昇順で取得する。
   * @param parentId 親の ID (UUID)
   * @param start 開始日時
   * @param end 終了日時（終了日時ちょうどは期間に含まない）
   */
  public async getUpdatedNotesInTree(
    parentId: string,
    start: Date,
    end: Date
  ): Promise<Note[]> {
    throw new Error()
  }
}
