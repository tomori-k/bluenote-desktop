import { ipcRenderer } from 'electron'
import { IpcInvokeChannel } from './channel'
import { Thread } from '../common/thread'
import { Note } from '../common/note'
import { Device } from '@prisma/client'

type ThreadCreate = Pick<Thread, 'name'>

export const api = {
  async getAllThreads(): Promise<Thread[]> {
    return await ipcRenderer.invoke(IpcInvokeChannel.GetAllThreads)
  },

  async createThread(thread: ThreadCreate): Promise<Thread> {
    return await ipcRenderer.invoke(IpcInvokeChannel.CreateThread, thread)
  },

  async renameThread(thread: Thread): Promise<Thread> {
    return await ipcRenderer.invoke(IpcInvokeChannel.RenameThread, thread)
  },

  async changeThreadDisplayMode(
    thread: Thread,
    displayMode: 'monologue' | 'scrap'
  ): Promise<Thread> {
    return await ipcRenderer.invoke(
      IpcInvokeChannel.ChangeDisplayMode,
      thread,
      displayMode
    )
  },

  async removeThread(threadId: string) {
    await ipcRenderer.invoke(IpcInvokeChannel.RemoveThread, threadId)
  },

  async findNotesInThread(
    thread: Thread,
    searchText: string,
    lastId: string | null,
    count: number,
    desc: boolean
  ): Promise<Note[]> {
    return await ipcRenderer.invoke(
      IpcInvokeChannel.FindNotesInThread,
      thread,
      searchText,
      lastId,
      count,
      desc
    )
  },

  async findNotesInTree(
    parent: Note,
    searchText: string,
    lastId: string | null,
    count: number,
    desc: boolean
  ): Promise<Note[]> {
    return await ipcRenderer.invoke(
      IpcInvokeChannel.FindNotesInTree,
      parent,
      searchText,
      lastId,
      count,
      desc
    )
  },

  async findNotesInTrash(
    searchText: string,
    lastId: string | null,
    count: number
  ): Promise<Note[]> {
    return await ipcRenderer.invoke(
      IpcInvokeChannel.FindNotesInTrash,
      searchText,
      lastId,
      count
    )
  },

  async createNoteInThread(content: string, thread: Thread): Promise<Note> {
    return await ipcRenderer.invoke(
      IpcInvokeChannel.CreateNoteInThread,
      content,
      thread
    )
  },

  async createNoteInTree(content: string, parent: Note): Promise<Note> {
    return await ipcRenderer.invoke(
      IpcInvokeChannel.CreateNoteInTree,
      content,
      parent
    )
  },

  async editNote(content: string, note: Note): Promise<Note> {
    return await ipcRenderer.invoke(IpcInvokeChannel.EditNote, content, note)
  },

  async removeNote(note: Note): Promise<void> {
    await ipcRenderer.invoke(IpcInvokeChannel.RemoveNote, note)
  },

  async restoreNote(note: Note): Promise<void> {
    return await ipcRenderer.invoke(IpcInvokeChannel.RestoreNote, note)
  },

  async deleteNote(note: Note): Promise<void> {
    return await ipcRenderer.invoke(IpcInvokeChannel.DeleteNote, note)
  },

  // device
  // TODO: api も細分化する
  async getSyncEnabledDevices(): Promise<Device[]> {
    return await ipcRenderer.invoke(IpcInvokeChannel.GetSyncEnabledDevices)
  },

  async disableSync(deviceUuid: string) {
    await ipcRenderer.invoke(IpcInvokeChannel.DisableSync, deviceUuid)
  },

  /**
   * 同期を開始する
   */
  async sync() {
    await ipcRenderer.invoke(IpcInvokeChannel.Sync)
  },
}

export type Api = typeof api
