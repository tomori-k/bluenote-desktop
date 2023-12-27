import { Thread } from '../../common/thread'
import { Note } from '../../common/note'
import { SyncClient } from 'bluenote-bluetooth'

function toThread(
  fromJson: Omit<Thread, 'updatedAt' | 'createdAt' | 'modifiedAt'> & {
    updatedAt: string
    createdAt: string
    modifiedAt: string
  }
) {
  return {
    ...fromJson,
    updatedAt: new Date(fromJson.updatedAt),
    createdAt: new Date(fromJson.createdAt),
    modifiedAt: new Date(fromJson.modifiedAt),
  }
}

function toNote(
  fromJson: Omit<Note, 'updatedAt' | 'createdAt' | 'modifiedAt'> & {
    updatedAt: string
    createdAt: string
    modifiedAt: string
  }
) {
  return {
    ...fromJson,
    updatedAt: new Date(fromJson.updatedAt),
    createdAt: new Date(fromJson.createdAt),
    modifiedAt: new Date(fromJson.modifiedAt),
  }
}

export interface ISyncCompanion {
  // スレッドの更新状況を取得
  getThreadUpdates(): Promise<Thread[]>

  // 指定したスレッドのメモをすべて取得(trash = 1 も含む)
  getAllNotesInThread(thread: Thread): Promise<Note[]>

  // 指定したスレッドのメモをすべて取得(trash = 1 も含む)
  getAllNotesInNote(note: Note): Promise<Note[]>

  // 指定したスレッド直属のメモの更新状況取得
  getNoteUpdatesInThread(thread: Thread): Promise<Note[]>

  // 指定したメモのツリーのメモの更新状況を取得
  getNoteUpdatesInTree(note: Note): Promise<Note[]>
}

export class SyncCompanion implements ISyncCompanion {
  private readonly syncClient: SyncClient

  constructor(syncClient: SyncClient) {
    this.syncClient = syncClient
  }

  public async getThreadUpdates(): Promise<Thread[]> {
    const json = await this.syncClient.requestData(0)
    return JSON.parse(json).map((x: any) => toThread(x))
  }

  public async getAllNotesInThread(thread: Thread): Promise<Note[]> {
    const json = await this.syncClient.requestData(1, thread.id)
    return JSON.parse(json).map((x: any) => toNote(x))
  }

  public async getAllNotesInNote(note: Note): Promise<Note[]> {
    const json = await this.syncClient.requestData(2, note.id)
    return JSON.parse(json).map((x: any) => toNote(x))
  }

  public async getNoteUpdatesInThread(thread: Thread): Promise<Note[]> {
    const json = await this.syncClient.requestData(3, thread.id)
    return JSON.parse(json).map((x: any) => toNote(x))
  }

  public async getNoteUpdatesInTree(note: Note): Promise<Note[]> {
    const json = await this.syncClient.requestData(4, note.id)
    return JSON.parse(json).map((x: any) => toNote(x))
  }
}
