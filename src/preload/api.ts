import { ipcRenderer } from 'electron'
import { IpcChannel } from './channel'

type Thread = {
  id: string
  name: string
  displayMode: 'monologue' | 'scrap'
  createdAt: Date
  removed: boolean
  removedAt: Date
}
type ThreadCreate = Pick<Thread, 'name' | 'displayMode'>
type ThreadUpdate = Partial<
  Pick<Thread, 'name' | 'displayMode' | 'removed' | 'removedAt'>
>

type Note = {
  id: string
  content: string
  editorId: string
  createdAt: Date
  updatedAt: Date
  threadId: string
  parentId: string | null
  removed: boolean
  removedAt: Date
}
type NoteCreate = Pick<Note, 'content' | 'threadId'> &
  Partial<Pick<Note, 'parentId'>>
type NoteUpdate = Pick<Note, 'content' | 'removed' | 'removedAt'>

export const api = {
  async getAllThreads(): Promise<Thread[]> {
    return await ipcRenderer.invoke(IpcChannel.GetAllThreads)
  },
  async createThread(thread: ThreadCreate): Promise<Thread> {
    return await ipcRenderer.invoke(IpcChannel.CreateThread, thread)
  },
  async updateThread(thread: ThreadUpdate): Promise<Thread> {
    return await ipcRenderer.invoke(IpcChannel.UpdateThread, thread)
  },
  async deleteThread(threadId: string) {
    await ipcRenderer.invoke(IpcChannel.DeleteThread, threadId)
  },
  async getNotes(threadId: string): Promise<Note[]> {
    return await ipcRenderer.invoke(IpcChannel.GetNotes, threadId)
  },
  async getTree(noteId: string): Promise<Note[]> {
    return await ipcRenderer.invoke(IpcChannel.GetTree, noteId)
  },
  async createNote(note: NoteCreate): Promise<Note> {
    return await ipcRenderer.invoke(IpcChannel.CreateNote, note)
  },
  async updateNote(note: NoteUpdate): Promise<Note> {
    return await ipcRenderer.invoke(IpcChannel.UpdateNote, note)
  },
  async deleteNote(noteId: string) {
    await ipcRenderer.invoke(IpcChannel.DeleteNote, noteId)
  },
}

export type Api = typeof api
