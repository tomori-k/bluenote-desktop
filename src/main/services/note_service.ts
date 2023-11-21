import { PrismaClient } from '@prisma/client'
import { Note } from '../../common/note'
import { Thread } from '../../common/thread'

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
    throw new Error()
  }

  /**
   * スレッド直下のメモを作成日時昇順で取得する（ツリーのメモは含めない）
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
    throw new Error()
  }

  /**
   * ツリーにあるメモを作成日時昇順で取得する
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
    throw new Error()
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
    throw new Error()
  }

  /**
   * スレッドにメモを作成する
   * @param content メモの内容
   * @param thread メモを追加するスレッド
   */
  public async createInThread(content: string, thread: Thread): Promise<Note> {
    throw new Error()
  }

  /**
   * ツリーにメモを作成する
   * @param content メモの内容
   * @param parentNote 親のメモ
   */
  public async createInTree(content: string, parentNote: Note): Promise<Note> {
    throw new Error()
  }

  /**
   * メモの内容を編集する
   * @param content 編集後の内容
   * @param note 編集対象のメモ
   */
  public async edit(content: string, note: Note): Promise<Note> {
    throw new Error()
  }

  /**
   * メモをごみ箱に移動させる
   * ツリーがある場合はその中のメモもごみ箱に移動する
   * @param note メモ
   */
  public async remove(note: Note): Promise<void> {
    throw new Error()
  }

  /**
   * ごみ箱にあるメモを元に戻す
   * @param note メモ
   */
  public async restore(note: Note): Promise<void> {
    throw new Error()
  }

  /**
   * ごみ箱にあるメモを完全に削除する
   * @param note メモ
   */
  public async deleteNote(note: Note): Promise<void> {
    throw new Error()
  }
}
