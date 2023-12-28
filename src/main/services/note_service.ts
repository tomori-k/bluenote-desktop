import { PrismaClient } from '@prisma/client'
import { Note } from '../../common/note'
import { Thread } from '../../common/thread'
import { ThreadService } from './thread_service'

export interface INoteService {
  /**
   * メモを取得する
   * @param id メモの ID (UUID)
   */
  get(id: string): Promise<Note>

  /**
   * メモを取得する
   * @param id メモの ID (UUID)
   */
  find(id: string): Promise<Note | null>

  /**
   * スレッド直下のメモを作成日時でソートして取得する（ツリーのメモは含めない）
   * @param thread スレッド
   * @param searchText 検索文字列
   * @param lastId 前回取得したメモのうち最後の ID。このメモ以降のメモ（自身は含めない）を取得する
   * @param count 取得するデータの数
   * @param desc 降順で取得する
   */
  findInThread(
    thread: Thread,
    searchText: string,
    lastId: string | null,
    count: number,
    desc: boolean
  ): Promise<Note[]>

  /**
   * ツリーにあるメモを作成日時でソートして取得する
   * @param parent
   * @param searchText 検索文字列
   * @param lastId 前回取得したメモのうち最後の ID。このメモ以降のメモ（自身は含めない）を取得する
   * @param count 取得するデータの数
   * @param desc 降順で取得する
   */
  findInTree(
    parent: Note,
    searchText: string,
    lastId: string | null,
    count: number,
    desc: boolean
  ): Promise<Note[]>

  /**
   * ごみ箱にあるメモを作成日時昇順で取得する
   * @param searchText 検索文字列
   * @param lastId 前回取得したメモのうち最後の ID。このメモ以降のメモ（自身は含めない）を取得する
   * @param count 取得するデータの数
   */
  findInTrash(
    searchText: string,
    lastId: string | null,
    count: number
  ): Promise<Note[]>

  /**
   * スレッドにメモを作成する
   * @param content メモの内容
   * @param thread メモを追加するスレッド
   */
  createInThread(content: string, thread: Thread): Promise<Note>

  /**
   * ツリーにメモを作成する
   * @param content メモの内容
   * @param parentNote 親のメモ
   */
  createInTree(content: string, parentNote: Note): Promise<Note>

  /**
   * メモの内容を編集する
   * @param content 編集後の内容
   * @param note 編集対象のメモ
   */
  edit(content: string, note: Note): Promise<Note>
  /**
   * メモをごみ箱に移動させる
   * ツリーがある場合はその中のメモもごみ箱に移動する
   * @param note メモ
   */
  remove(note: Note): Promise<void>
  /**
   * ごみ箱にあるメモを元に戻す
   * @param note メモ
   */
  restore(note: Note): Promise<void>

  /**
   * ごみ箱にあるメモを完全に削除する
   * @param note メモ
   */
  deleteNote(note: Note): Promise<void>
}

export class NoteService implements INoteService {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  public async get(id: string): Promise<Note> {
    return await this.prisma.note.findUniqueOrThrow({
      where: {
        id: id,
      },
    })
  }

  public async find(id: string): Promise<Note | null> {
    return await this.prisma.note.findUnique({
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
  private async ensureNoteExists(note: Note): Promise<Note> {
    note = await this.get(note.id)

    if (note.trash || note.deleted) {
      throw new Error('note is now removed to trash or deleted')
    }

    // OK
    return note
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
  private async findNotes(
    trash: boolean,
    searchText: string,
    lastId: string | null,
    count: number,
    desc: boolean,
    threadId?: string,
    parentId?: string | null
  ): Promise<Note[]> {
    let query = `
      SELECT
        id,
        content,
        thread_id AS threadId,
        parent_id AS parentId,
        trash,
        deleted,
        created_at AS createdAt,
        updated_at AS updatedAt,
        modified_at AS modifiedAt
      FROM
        note
      WHERE
        trash = $1 AND
        deleted = 0 AND
        content LIKE '%' || $2 || '%' ESCAPE '#'`

    const searchTextEscaped = searchText.replace(/[#%_]/g, '#$&')
    const params = [trash, searchTextEscaped] as any[]

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

      query += ' AND (created_at > $3 OR (created_at = $3 AND id > $4))'
      params.push(lastCreatedAt, lastId ?? '')
    } else {
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
          : new Date('9999-12-31T23:59:59Z')

      query += ' AND (created_at < $3 OR (created_at = $3 AND id > $4))'

      params.push(lastCreatedAt, lastId ?? '')
    }

    if (threadId != null) {
      query += ' AND thread_id = $5'
      params.push(threadId)
    } else if (threadId === null) {
      query += ' AND thread_id IS NULL'
    }

    if (parentId != null) {
      query += ' AND parent_id = $6'
      params.push(parentId)
    } else if (parentId === null) {
      query += ' AND parent_id IS NULL'
    }

    if (!desc) {
      query += ' ORDER BY created_at ASC, id ASC'
    } else {
      query += ' ORDER BY created_at DESC, id ASC'
    }

    query += ' LIMIT $7'
    params.push(count)

    return await this.prisma.$queryRawUnsafe(query, ...params)
  }

  public async findInThread(
    thread: Thread,
    searchText: string,
    lastId: string | null,
    count: number,
    desc: boolean
  ): Promise<Note[]> {
    await this.ensureThreadExists(thread)

    return await this.findNotes(
      false,
      searchText,
      lastId,
      count,
      desc,
      thread.id,
      null
    )
  }

  public async findInTree(
    parent: Note,
    searchText: string,
    lastId: string | null,
    count: number,
    desc: boolean
  ): Promise<Note[]> {
    await this.ensureNoteExists(parent)

    return await this.findNotes(
      false,
      searchText,
      lastId,
      count,
      desc,
      parent.threadId,
      parent.id
    )
  }

  public async findInTrash(
    searchText: string,
    lastId: string | null,
    count: number
  ): Promise<Note[]> {
    return await this.findNotes(true, searchText, lastId, count, false)
  }

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

  public async createInTree(content: string, parentNote: Note): Promise<Note> {
    parentNote = await this.ensureNoteExists(parentNote)

    if (parentNote.parentId != null) {
      throw new Error('nested tree is prohibited')
    }

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
          trash: false,
          deleted: false,
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
