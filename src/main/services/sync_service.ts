import { PrismaClient } from '@prisma/client'
import { Note } from '../../common/note'
import { Thread } from '../../common/thread'
import { Diff } from '../sync/diff'

export class SyncService {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * 指定したスレッドのメモをすべて取得する
   * ごみ箱やツリーのメモも取得される
   * 完全に削除されたメモ (deleted = 1) は含まない
   * 並びは、スレッド直下のメモのほうが先になり、その中で作成日時昇順になる
   *
   * @param threadId スレッドの ID (UUID)
   */
  public async getAllNotesInThread(threadId: string): Promise<Note[]> {
    const notes = await this.prisma.$queryRaw<
      // 自動生成された型があるならそっちに置き換えたいが、ぱっと調べた感じ見つからなかった
      {
        id: string
        content: string
        thread_id: string
        parent_id: string | null
        trash: boolean
        deleted: boolean
        created_at: Date
        updated_at: Date
        modified_at: Date
      }[]
    >`SELECT * FROM note WHERE deleted = 0 AND thread_id = ${threadId} ORDER BY (parent_id IS NULL) DESC, created_at ASC`

    return notes.map((x) => ({
      id: x.id,
      content: x.content,
      threadId: x.thread_id,
      parentId: x.parent_id,
      trash: x.trash,
      deleted: x.deleted,
      createdAt: x.created_at,
      updatedAt: x.updated_at,
      modifiedAt: x.modified_at,
    }))
  }

  /**
   * 指定したスレッドのメモをすべて取得する
   * ごみ箱やツリーのメモも取得される
   * 完全に削除されたメモ (deleted = 1) は含まない
   * @param parentId 親のメモの ID (UUID)
   */
  public async getAllNotesInTree(parentId: string): Promise<Note[]> {
    return await this.prisma.note.findMany({
      where: {
        deleted: false,
        parentId: parentId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
  }

  /**
   * 指定した期間内に更新があったスレッドを作成日時昇順で取得する。
   * @param start 開始日時
   * @param end 終了日時（終了日時ちょうどは期間に含まない）
   */
  public async getUpdatedThreads(start: Date, end: Date): Promise<Thread[]> {
    return await this.prisma.thread.findMany({
      where: {
        AND: [
          {
            updatedAt: {
              gte: start,
            },
          },
          {
            updatedAt: {
              lt: end,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
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
    return await this.prisma.note.findMany({
      where: {
        threadId: threadId,
        parentId: null,
        AND: [
          {
            updatedAt: {
              gte: start,
            },
          },
          {
            updatedAt: {
              lt: end,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
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
    return await this.prisma.note.findMany({
      where: {
        parentId: parentId,
        AND: [
          {
            updatedAt: {
              gte: start,
            },
          },
          {
            updatedAt: {
              lt: end,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
  }

  /**
   * データベースを更新する
   * メモの更新差分 (diff.noteCreate) について、配列内で親のメモがその子のメモよりも
   * 後ろにあると外部キー制約違反の例外が発生するので注意
   * @param diff 更新差分
   */
  public async updateByDiff(diff: Diff): Promise<void> {
    await this.prisma.$transaction(async (prisma) => {
      for (const threadCreate of diff.threadCreate) {
        await prisma.thread.create({ data: threadCreate })
      }
      for (const threadUpdate of diff.threadUpdate) {
        await prisma.thread.update({
          data: threadUpdate,
          where: { id: threadUpdate.id },
        })
      }
      await prisma.thread.deleteMany({
        where: { id: { in: diff.threadDelete.map((x) => x.id) } },
      })

      for (const noteCreate of diff.noteCreate) {
        await prisma.note.create({ data: noteCreate })
      }
      for (const noteUpdate of diff.noteUpdate) {
        await prisma.note.update({
          data: noteUpdate,
          where: { id: noteUpdate.id },
        })
      }
      await prisma.note.deleteMany({
        where: {
          OR: [
            { id: { in: diff.noteDelete.map((x) => x.id) } },
            {
              threadId: { in: diff.noteDeleteThreadIds },
            },
            {
              parentId: { in: diff.noteDeleteNoteIds },
            },
          ],
        },
      })
    })
  }
}
