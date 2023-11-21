import { PrismaClient } from '@prisma/client'
import { Note } from '../../common/note'
import { Thread } from '../../common/thread'
import { ThreadService } from './thread_service'

export class NoteService {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * メモを取得する
   * @param id メモの ID (UUID)
   */
  public async get(id: string): Promise<Note> {
    return await this.prisma.note.findUniqueOrThrow({
      where: {
        id: id,
      },
    })
  }

  /**
   * スレッドが存在し、削除されていないことを確認する
   * @param thread スレッド
   */
  private async ensureThreadExists(thread: Thread): Promise<void> {
    const threadService = new ThreadService(this.prisma)

    thread = await threadService.get(thread.id)

    if (thread.trash || thread.deleted) {
      throw new Error('thread is now removed to trash or deleted')
    }

    // OK
  }

  /**
   * メモが存在し、削除されていないことを確認する
   * @param note メモ
   */
  private async ensureNoteExists(note: Note): Promise<void> {
    note = await this.get(note.id)

    if (note.trash || note.deleted) {
      throw new Error('note is now removed to trash or deleted')
    }

    // OK
  }

  /**
   * メモを作成日時でソートして取得する。
   * @param trash ごみ箱のメモを対象にするか
   * @param searchText 検索文字列
   * @param lastId 前回取得したメモのうち最後の ID。このメモ以降のメモ（自身は含めない）を取得する
   * @param count 取得するデータの数
   * @param desc 降順で取得する
   * @param threadId スレッド ID (UUID)
   * @param parentId 親のメモの ID (UUID)
   */
  private async find(
    trash: boolean,
    searchText: string,
    lastId: string | null,
    count: number,
    desc: boolean,
    threadId?: string,
    parentId?: string | null
  ): Promise<Note[]> {
    // 昇順
    if (!desc) {
      // 前回取得したページの最後のメモの更新日時
      const lastCreatedAt =
        lastId != null
          ? (
              await this.prisma.note.findUniqueOrThrow({
                where: {
                  id: lastId,
                },
                select: { createdAt: true },
              })
            ).createdAt
          : new Date(0)

      return await this.prisma.note.findMany({
        where: {
          trash: trash,
          deleted: false,
          content: {
            contains: searchText,
          },
          OR: [
            {
              createdAt: {
                gt: lastCreatedAt,
              },
            },
            {
              createdAt: lastCreatedAt,
              id: {
                gt: lastId ?? '',
              },
            },
          ],
          threadId: threadId,
          parentId: parentId,
        },
        orderBy: {
          createdAt: 'asc',
          id: 'asc',
        },
        take: count,
      })
    }
    // 降順
    else {
      // 前回取得したページの最後のメモの更新日時
      const lastCreatedAt =
        lastId != null
          ? (
              await this.prisma.note.findUniqueOrThrow({
                where: {
                  id: lastId,
                },
                select: { createdAt: true },
              })
            ).createdAt
          : new Date(9007199254740991)

      return await this.prisma.note.findMany({
        where: {
          trash: trash,
          deleted: false,
          content: {
            contains: searchText,
          },
          OR: [
            {
              createdAt: {
                lt: lastCreatedAt,
              },
            },
            {
              createdAt: lastCreatedAt,
              id: {
                gt: lastId ?? '',
              },
            },
          ],
          threadId: threadId,
          parentId: parentId,
        },
        orderBy: {
          createdAt: 'desc',
          id: 'asc',
        },
        take: count,
      })
    }
  }

  /**
   * スレッド直下のメモを作成日時でソートして取得する（ツリーのメモは含めない）
   * @param thread スレッド
   * @param searchText 検索文字列
   * @param lastId 前回取得したメモのうち最後の ID。このメモ以降のメモ（自身は含めない）を取得する
   * @param count 取得するデータの数
   * @param desc 降順で取得する
   */
  public async findInThread(
    thread: Thread,
    searchText: string,
    lastId: string | null,
    count: number,
    desc: boolean
  ): Promise<Note[]> {
    await this.ensureThreadExists(thread)

    return await this.find(
      false,
      searchText,
      lastId,
      count,
      desc,
      thread.id,
      null
    )
  }

  /**
   * ツリーにあるメモを作成日時でソートして取得する
   * @param parent
   * @param searchText 検索文字列
   * @param lastId 前回取得したメモのうち最後の ID。このメモ以降のメモ（自身は含めない）を取得する
   * @param count 取得するデータの数
   * @param desc 降順で取得する
   */
  public async findInTree(
    parent: Note,
    searchText: string,
    lastId: string | null,
    count: number,
    desc: boolean
  ): Promise<Note[]> {
    await this.ensureNoteExists(parent)

    return await this.find(
      false,
      searchText,
      lastId,
      count,
      desc,
      parent.threadId,
      parent.id
    )
  }

  /**
   * ごみ箱にあるメモを作成日時昇順で取得する
   * @param searchText 検索文字列
   * @param lastId 前回取得したメモのうち最後の ID。このメモ以降のメモ（自身は含めない）を取得する
   * @param count 取得するデータの数
   */
  public async findInTrash(
    searchText: string,
    lastId: string | null,
    count: number
  ): Promise<Note[]> {
    return await this.find(true, searchText, lastId, count, false)
  }

  /**
   * スレッドにメモを作成する
   * @param content メモの内容
   * @param thread メモを追加するスレッド
   */
  public async createInThread(content: string, thread: Thread): Promise<Note> {
    await this.ensureThreadExists(thread)

    const timestamp = new Date()
    let created: Note | null = null

    await this.prisma.$transaction(async (tx) => {
      created = await tx.note.create({
        data: {
          content: content,
          threadId: thread.id,
          parentId: null,
          trash: false,
          deleted: false,
          createdAt: timestamp,
          updatedAt: timestamp,
          modifiedAt: timestamp,
        },
      })

      // 親のスレッドの updatedAt も更新

      await tx.thread.update({
        where: {
          id: thread.id,
        },
        data: {
          updatedAt: timestamp,
        },
      })
    })

    return created!
  }

  /**
   * ツリーにメモを作成する
   * @param content メモの内容
   * @param parentNote 親のメモ
   */
  public async createInTree(content: string, parentNote: Note): Promise<Note> {
    await this.ensureNoteExists(parentNote)

    const timestamp = new Date()
    let created: Note | null = null

    await this.prisma.$transaction(async (tx) => {
      created = await tx.note.create({
        data: {
          content: content,
          threadId: parentNote.threadId,
          parentId: parentNote.id,
          trash: false,
          deleted: false,
          createdAt: timestamp,
          updatedAt: timestamp,
          modifiedAt: timestamp,
        },
      })

      // 親のスレッド・メモの updatedAt も更新

      await tx.thread.update({
        where: { id: parentNote.threadId },
        data: { updatedAt: timestamp },
      })
      await tx.note.update({
        where: { id: parentNote.id },
        data: { updatedAt: timestamp },
      })
    })

    return created!
  }

  /**
   * メモの内容を編集する
   * @param content 編集後の内容
   * @param note 編集対象のメモ
   */
  public async edit(content: string, note: Note): Promise<Note> {
    await this.ensureNoteExists(note)

    const timestamp = new Date()
    let updated: Note | null = null

    await this.prisma.$transaction(async (tx) => {
      updated = await tx.note.update({
        where: {
          id: note.id,
        },
        data: {
          content: content,
          updatedAt: timestamp,
          modifiedAt: timestamp,
        },
      })

      // 親のスレッド・メモ (あれば) の updatedAt も更新

      await tx.thread.update({
        where: {
          id: note.threadId,
        },
        data: {
          updatedAt: timestamp,
        },
      })
      if (note.parentId != null) {
        await tx.note.update({
          where: {
            id: note.parentId,
          },
          data: {
            updatedAt: timestamp,
          },
        })
      }
    })

    return updated!
  }

  /**
   * メモをごみ箱に移動させる
   * ツリーがある場合はその中のメモもごみ箱に移動する
   * @param note メモ
   */
  public async remove(note: Note): Promise<void> {
    await this.ensureNoteExists(note)

    const timestamp = new Date()

    await this.prisma.$transaction(async (tx) => {
      await tx.note.updateMany({
        where: {
          OR: [
            {
              id: note.id,
            },
            {
              parentId: note.id,
            },
          ],
        },
        data: {
          trash: true,
          updatedAt: timestamp,
          modifiedAt: timestamp,
        },
      })

      // 親のスレッド・メモ (あれば) の updatedAt も更新

      await tx.thread.update({
        where: {
          id: note.threadId,
        },
        data: {
          updatedAt: timestamp,
        },
      })
      if (note.parentId != null) {
        await tx.note.update({
          where: {
            id: note.parentId,
          },
          data: {
            updatedAt: timestamp,
          },
        })
      }
    })
  }

  /**
   * ごみ箱にあるメモを元に戻す
   * @param note メモ
   */
  public async restore(note: Note): Promise<void> {
    note = await this.get(note.id)

    if (note.deleted) {
      throw new Error('note is deleted')
    }

    if (!note.trash) {
      throw new Error('note not in trash')
    }

    const threadService = new ThreadService(this.prisma)
    const thread = await threadService.get(note.threadId)
    const parent = note.parentId != null ? await this.get(note.parentId) : null
    const timestamp = new Date()

    await this.prisma.$transaction(async (tx) => {
      await tx.note.update({
        where: { id: note.id },
        data: {
          trash: false,
          updatedAt: timestamp,
          modifiedAt: timestamp,
        },
      })

      // 親のスレッドもごみ箱にある場合は、スレッドももとに戻す
      if (thread.trash) {
        await tx.thread.update({
          where: { id: thread.id },
          data: {
            trash: false,
            updatedAt: timestamp,
            modifiedAt: timestamp,
          },
        })
      }
      // そうでないなら、updatedAt のみ更新
      else {
        await tx.thread.update({
          where: { id: thread.id },
          data: { updatedAt: timestamp },
        })
      }

      if (parent != null) {
        // 親のメモがごみ箱にあるなら、それももとに戻す
        if (parent.trash) {
          await tx.note.update({
            where: { id: parent.id },
            data: {
              trash: false,
              updatedAt: timestamp,
              modifiedAt: timestamp,
            },
          })
        }
        // そうでないなら、updatedAt のみ更新
        else {
          await tx.note.update({
            where: { id: parent.id },
            data: {
              updatedAt: timestamp,
            },
          })
        }
      }
    })
  }

  /**
   * ごみ箱にあるメモを完全に削除する
   * @param note メモ
   */
  public async deleteNote(note: Note): Promise<void> {
    note = await this.get(note.id)

    if (note.deleted) {
      throw new Error('note is already deleted')
    }

    if (!note.trash) {
      throw new Error('must remove it to trash before delete')
    }

    const timestamp = new Date()

    await this.prisma.$transaction(async (tx) => {
      // 削除済みとしてマーク
      // すべてのデバイスに削除したという情報を共有したあと実際に削除する

      await tx.note.update({
        where: { id: note.id },
        data: {
          deleted: true,
          updatedAt: timestamp,
          modifiedAt: timestamp,
        },
      })

      // ツリーのメモは完全に削除

      await tx.note.deleteMany({
        where: {
          parentId: note.id,
        },
      })

      // 親のスレッド・メモ (あれば) の updatedAt も更新

      await tx.thread.update({
        where: {
          id: note.threadId,
        },
        data: {
          updatedAt: timestamp,
        },
      })
      if (note.parentId != null) {
        await tx.note.update({
          where: {
            id: note.parentId,
          },
          data: {
            updatedAt: timestamp,
          },
        })
      }
    })
  }
}
