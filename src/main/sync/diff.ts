import { ISyncCompanion } from './companion'
import { IThreadService } from '../services/thread_service'
import { INoteService } from '../services/note_service'
import { Thread } from '../../common/thread'
import { Note } from '../../common/note'

export class Diff {
  public threadCreate: Thread[]
  public threadUpdate: Thread[]
  public threadDelete: Thread[]
  public noteCreate: Note[]
  public noteUpdate: Note[]
  public noteDelete: Note[]
  // 指定したスレッド以下のメモをすべて削除
  public noteDeleteThreadIds: string[]
  // 指定したメモに含まれるメモをすべて削除
  public noteDeleteNoteIds: string[]

  constructor() {
    this.threadCreate = []
    this.threadUpdate = []
    this.threadDelete = []
    this.noteCreate = []
    this.noteUpdate = []
    this.noteDelete = []
    this.noteDeleteThreadIds = []
    this.noteDeleteNoteIds = []
  }

  public merge(diff: Diff) {
    this.threadCreate.push(...diff.threadCreate)
    this.threadUpdate.push(...diff.threadUpdate)
    this.threadDelete.push(...diff.threadDelete)
    this.noteCreate.push(...diff.noteCreate)
    this.noteUpdate.push(...diff.noteUpdate)
    this.noteDelete.push(...diff.noteDelete)
    this.noteDeleteThreadIds.push(...diff.noteDeleteThreadIds)
    this.noteDeleteNoteIds.push(...diff.noteDeleteNoteIds)
  }
}

export async function diff(
  companion: ISyncCompanion,
  threadService: IThreadService,
  noteService: INoteService,
  timestamp: Date
): Promise<Diff> {
  const companionUpdate = await companion.getThreadUpdates()

  const diffList = await Promise.all(
    companionUpdate.map(async (update) => {
      const diff = new Diff()

      // 自分のDBの対応するデータ
      const thread = await threadService.find(update.id)

      // 相手側の更新
      if (!update.deleted) {
        // DB に存在しない
        if (thread == null) {
          // 相手のスレッドに含まれるメモをすべて取得（trash = 1 も含め）し
          // 作成分として差分に追加
          const notes = await companion.getAllNotesInThread(update)

          diff.threadCreate.push({ ...update, updatedAt: timestamp })
          diff.noteCreate.push(
            ...notes.map((x) => ({ ...x, updatedAt: timestamp }))
          )
        }
        // 存在するが物理削除はされていない
        else if (!thread.deleted) {
          // 新しいほうを採用
          if (update.modifiedAt > thread.modifiedAt) {
            diff.threadUpdate.push({ ...update, updatedAt: timestamp })
          }

          // スレッド同士の更新を比較し更新分を計算
          diff.merge(
            await diffThread(update, companion, noteService, timestamp)
          )
        }
        // 削除済み
        else {
          // 相手の更新のほうが、こちらの物理削除よりも後
          if (update.modifiedAt > thread.modifiedAt) {
            // 相手の更新を取り込み、さらに相手からスレッド内のメモを
            // 全取得し、自身のDBに追加する
            const notes = await companion.getAllNotesInThread(update)

            diff.threadUpdate.push({ ...update, updatedAt: timestamp })
            diff.noteCreate.push(
              ...notes.map((x) => ({ ...x, updatedAt: timestamp }))
            )
          }
          // こちらの削除のほうが後なら、なにもしない
        }
      }
      // 相手側の削除
      else {
        // 相手側で削除されたスレッドがそもそもない
        if (thread == null) {
          // 削除されたという情報を新しくつくることで
          // ほかのデバイスへの情報の伝播を早める
          diff.threadCreate.push({ ...update, updatedAt: timestamp })
        }
        // 物理削除はされてない
        else if (!thread.deleted) {
          // 相手の物理削除のほうがこちらの更新よりもあと
          if (update.modifiedAt > thread.modifiedAt) {
            // スレッドを削除済みとしてマーク
            // 属しているメモをすべて削除
            diff.threadUpdate.push({ ...update, updatedAt: timestamp })
            diff.noteDeleteThreadIds.push(thread.id)
          }
        }
        // こちらでも削除済み
        else {
          // 削除日時を新しいほうにする
          if (update.modifiedAt > thread.modifiedAt) {
            // diff.markAsUpdate(update.copy(updatedAt = timestamp))
            diff.threadUpdate.push({ ...update, updatedAt: timestamp })
          }
        }
      }
      return diff
    })
  )

  return diffList.reduce((acc, diff) => {
    acc.merge(diff)
    return acc
  }, new Diff())
}

export async function diffThread(
  thread: Thread,
  companion: ISyncCompanion,
  noteService: INoteService,
  timestamp: Date
): Promise<Diff> {
  const companionUpdate = await companion.getNoteUpdatesInThread(thread)

  const diffList = await Promise.all(
    companionUpdate.map(async (update) => {
      const diff = new Diff()

      // 自分のDBの対応するデータ
      const note = await noteService.find(update.id)

      // 相手側の更新
      if (!update.deleted) {
        // DB に存在しない
        if (note == null) {
          // 相手のメモとそのツリーに含まれるメモをすべて取得（trash = 1 も含め）し
          // 作成分として差分に追加
          const notes = await companion.getAllNotesInNote(update)

          diff.noteCreate.push({ ...update, updatedAt: timestamp })
          diff.noteCreate.push(
            ...notes.map((x) => ({ ...x, updatedAt: timestamp }))
          )
        }
        // 存在するが物理削除はされていない
        else if (!note.deleted) {
          // 新しいほうを採用
          if (update.modifiedAt > note.modifiedAt) {
            diff.noteUpdate.push({ ...update, updatedAt: timestamp })
          }

          // ツリー同士の更新を比較し更新分を計算
          diff.merge(await diffTree(update, companion, noteService, timestamp))
        }
        // 削除済み
        else {
          // 相手の更新のほうが、こちらの物理削除よりも後
          if (update.modifiedAt > note.modifiedAt) {
            // 物理削除を取り消し、さらに、相手からスレッド内の
            // メモを全取得し、自身のDBに追加する
            const notes = await companion.getAllNotesInNote(update)

            diff.noteUpdate.push({ ...update, updatedAt: timestamp })
            diff.noteCreate.push(
              ...notes.map((x) => ({ ...x, updatedAt: timestamp }))
            )
          }
          // こちらの削除のほうが後なら、なにもしない
        }
      }
      // 相手側の削除
      else {
        // 相手側で削除されたメモがそもそもない
        if (note == null) {
          // 削除されたという情報を新しくつくることで
          // ほかのデバイスへの情報の伝播を早める

          diff.noteCreate.push({ ...update, updatedAt: timestamp })
        }
        // 物理削除はされてない
        else if (!note.deleted) {
          // 相手の物理削除のほうがこちらの更新よりもあと
          if (update.modifiedAt > note.modifiedAt) {
            // 削除済みとしてマークし、
            // ツリーに属しているメモをすべて削除

            diff.noteUpdate.push({ ...update, updatedAt: timestamp })
            diff.noteDeleteNoteIds.push(note.id)
          }
        }
        // こちらでも削除済み
        else {
          // 削除日時を新しいほうにする
          if (update.modifiedAt > note.modifiedAt) {
            diff.noteUpdate.push({ ...update, updatedAt: timestamp })
          }
        }
      }
      return diff
    })
  )

  return diffList.reduce((acc, diff) => {
    acc.merge(diff)
    return acc
  }, new Diff())
}

export async function diffTree(
  parent: Note,
  companion: ISyncCompanion,
  noteService: INoteService,
  timestamp: Date
): Promise<Diff> {
  const companionUpdate = await companion.getNoteUpdatesInTree(parent)

  const diffList = await Promise.all(
    companionUpdate.map(async (update) => {
      const diff = new Diff()

      // 自分のDBの対応するデータ
      const noteInTree = await noteService.find(update.id)

      // 相手側の削除
      if (!update.deleted) {
        // DB に存在しない
        if (noteInTree == null) {
          // 作成分として差分に追加

          diff.noteCreate.push({ ...update, updatedAt: timestamp })
        }
        // 存在するが物理削除はされていない
        else if (!noteInTree.deleted) {
          // 新しいほうを採用
          if (update.modifiedAt > noteInTree.modifiedAt) {
            diff.noteUpdate.push({ ...update, updatedAt: timestamp })
          }
        }
        // 削除済み
        else {
          // 相手の更新のほうが、こちらの物理削除よりも後
          if (update.modifiedAt > noteInTree.modifiedAt) {
            // 物理削除を取り消し
            diff.noteUpdate.push({ ...update, updatedAt: timestamp })
          }
          // こちらの削除のほうが後なら、なにもしない
        }
      } else {
        // 相手側で削除されたメモがそもそもない
        if (noteInTree == null) {
          // 削除されたという情報を新しくつくることで
          // ほかのデバイスへの情報の伝播を早める

          diff.noteCreate.push({ ...update, updatedAt: timestamp })
        }
        // 物理削除はされてない
        else if (!noteInTree.deleted) {
          // 相手の物理削除のほうがこちらの更新よりもあと
          if (update.modifiedAt > noteInTree.modifiedAt) {
            diff.noteUpdate.push({ ...update, updatedAt: timestamp })
          }
        }
        // こちらでも削除済み
        else {
          // 削除日時を新しいほうにする
          if (update.modifiedAt > noteInTree.modifiedAt) {
            diff.noteUpdate.push({ ...update, updatedAt: timestamp })
          }
        }
      }

      return diff
    })
  )

  return diffList.reduce((acc, diff) => {
    acc.merge(diff)
    return acc
  }, new Diff())
}
