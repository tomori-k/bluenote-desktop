import { ipcRenderer } from 'electron'
import { IpcChannel } from './channel'
import { Thread } from '../common/thread'
import { Note } from '../common/note'

type ThreadCreate = Pick<Thread, 'name' | 'displayMode'>
type ThreadUpdate = Partial<Pick<Thread, 'name' | 'displayMode'>> &
  Pick<Thread, 'id'>
type NoteCreate = Pick<Note, 'content' | 'threadId'> &
  Partial<Pick<Note, 'parentId'>>
type NoteUpdate = Partial<Pick<Note, 'content'>> & Pick<Note, 'id'>
type NoteRestore = Pick<Note, 'id' | 'threadId' | 'parentId'>
type FindOptionNote = Partial<Pick<Note, 'threadId' | 'removed'>> &
  Pick<Partial<{ [K in keyof Note]: Note[K] | null }>, 'parentId'>
type NoteRestoreResult = {
  thread: Thread
  notes: Note[]
}

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
  async removeThread(threadId: string) {
    await ipcRenderer.invoke(IpcChannel.RemoveThread, threadId)
  },
  async deleteThread(threadId: string) {
    await ipcRenderer.invoke(IpcChannel.DeleteThread, threadId)
  },
  async getNotes(options: FindOptionNote): Promise<Note[]> {
    return await ipcRenderer.invoke(IpcChannel.GetNotes, options)
  },
  async searchNote(searchOption: { text: string }): Promise<Note[]> {
    return await ipcRenderer.invoke(IpcChannel.SearchNote, searchOption)
  },
  async createNote(note: NoteCreate): Promise<Note> {
    return await ipcRenderer.invoke(IpcChannel.CreateNote, note)
  },
  async updateNote(note: NoteUpdate): Promise<Note> {
    return await ipcRenderer.invoke(IpcChannel.UpdateNote, note)
  },
  async removeNote(noteId: string) {
    await ipcRenderer.invoke(IpcChannel.RemoveNote, noteId)
  },
  async restoreNote(note: NoteRestore): Promise<NoteRestoreResult> {
    return await ipcRenderer.invoke(IpcChannel.RestoreNote, note)
  },
  async deleteNote(noteId: string): Promise<Note[]> {
    return await ipcRenderer.invoke(IpcChannel.DeleteNote, noteId)
  },
}

export type Api = typeof api
