import { ipcRenderer } from 'electron'
import { IpcChannel, NewIpcChannel } from './channel'
import { Thread } from '../common/thread'
import { Note } from '../common/note'
import { Device } from '@prisma/client'

type ThreadCreate = Pick<Thread, 'name'>

export const api = {
  async getAllThreads(): Promise<Thread[]> {
    return await ipcRenderer.invoke(IpcChannel.GetAllThreads)
  },

  async createThread(thread: ThreadCreate): Promise<Thread> {
    return await ipcRenderer.invoke(IpcChannel.CreateThread, thread)
  },

  async renameThread(thread: Thread): Promise<Thread> {
    return await ipcRenderer.invoke(IpcChannel.RenameThread, thread)
  },

  async changeThreadDisplayMode(
    thread: Thread,
    displayMode: 'monologue' | 'scrap'
  ): Promise<Thread> {
    return await ipcRenderer.invoke(
      IpcChannel.ChangeDisplayMode,
      thread,
      displayMode
    )
  },

  async removeThread(threadId: string) {
    await ipcRenderer.invoke(IpcChannel.RemoveThread, threadId)
  },

  async findNotesInThread(
    thread: Thread,
    searchText: string,
    lastId: string | null,
    count: number,
    desc: boolean
  ): Promise<Note[]> {
    return await ipcRenderer.invoke(
      IpcChannel.FindNotesInThread,
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
      IpcChannel.FindNotesInTree,
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
      IpcChannel.FindNotesInTrash,
      searchText,
      lastId,
      count
    )
  },

  async createNoteInThread(content: string, thread: Thread): Promise<Note> {
    return await ipcRenderer.invoke(
      IpcChannel.CreateNoteInThread,
      content,
      thread
    )
  },

  async createNoteInTree(content: string, parent: Note): Promise<Note> {
    return await ipcRenderer.invoke(
      IpcChannel.CreateNoteInTree,
      content,
      parent
    )
  },

  async editNote(content: string, note: Note): Promise<Note> {
    return await ipcRenderer.invoke(IpcChannel.EditNote, content, note)
  },

  async removeNote(note: Note): Promise<void> {
    await ipcRenderer.invoke(IpcChannel.RemoveNote, note)
  },

  async restoreNote(note: Note): Promise<void> {
    return await ipcRenderer.invoke(IpcChannel.RestoreNote, note)
  },

  async deleteNote(note: Note): Promise<void> {
    return await ipcRenderer.invoke(IpcChannel.DeleteNote, note)
  },

  // device
  // TODO: api も細分化する
  async getSyncEnabledDevices(): Promise<Device[]> {
    return await ipcRenderer.invoke(NewIpcChannel.GetSyncEnabledDevices)
  },

  async disableSync(deviceUuid: string) {
    await ipcRenderer.invoke(NewIpcChannel.DisableSync, deviceUuid)
  },
}

export type Api = typeof api
