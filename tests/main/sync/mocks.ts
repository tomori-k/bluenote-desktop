import { Note } from '../../../src/common/note'
import { Thread } from '../../../src/common/thread'
import { ISyncCompanion } from '../../../src/main/sync/companion'
import {
  INoteService,
  NoteWithThreadName,
} from '../../../src/main/services/note_service'
import { IThreadService } from '../../../src/main/services/thread_service'

/**
 * 適宜 jest.spyOn で書き換える
 */
export class MockCompanion implements ISyncCompanion {
  getThreadUpdates(): Promise<Thread[]> {
    throw new Error('Method not implemented.')
  }

  getAllNotesInThread(thread: Thread): Promise<Note[]> {
    throw new Error('Method not implemented.')
  }

  getAllNotesInNote(note: Note): Promise<Note[]> {
    throw new Error('Method not implemented.')
  }

  getNoteUpdatesInThread(thread: Thread): Promise<Note[]> {
    throw new Error('Method not implemented.')
  }

  getNoteUpdatesInTree(note: Note): Promise<Note[]> {
    throw new Error('Method not implemented.')
  }
}

export class MockThreadService implements IThreadService {
  getAllThreads(): Promise<Thread[]> {
    throw new Error('Method not implemented.')
  }
  find(id: string): Promise<Thread> {
    throw new Error('Method not implemented.')
  }
  get(id: string): Promise<Thread> {
    throw new Error('Method not implemented.')
  }
  create(name: string): Promise<Thread> {
    throw new Error('Method not implemented.')
  }
  rename(thread: Thread, name: string): Promise<Thread> {
    throw new Error('Method not implemented.')
  }
  changeDisplayMode(
    thread: Thread,
    displayMode: 'monologue' | 'scrap'
  ): Promise<Thread> {
    throw new Error('Method not implemented.')
  }
  remove(thread: Thread): Promise<void> {
    throw new Error('Method not implemented.')
  }
  deleteThread(thread: Thread): Promise<void> {
    throw new Error('Method not implemented.')
  }
}

/**
 * 適宜 jest.spyOn で置き換える
 */
export class MockNoteService implements INoteService {
  get(id: string): Promise<Note> {
    throw new Error('Method not implemented.')
  }

  find(id: string): Promise<Note> {
    throw new Error('Method not implemented.')
  }

  findInThread(
    thread: Thread,
    searchText: string,
    lastId: string,
    count: number,
    desc: boolean
  ): Promise<Note[]> {
    throw new Error('Method not implemented.')
  }

  findInTree(
    parent: Note,
    searchText: string,
    lastId: string,
    count: number,
    desc: boolean
  ): Promise<Note[]> {
    throw new Error('Method not implemented.')
  }

  findNotes(
    searchText: string,
    lastId: string,
    count: number
  ): Promise<NoteWithThreadName[]> {
    throw new Error('Method not implemented.')
  }

  findInTrash(
    searchText: string,
    lastId: string,
    count: number
  ): Promise<NoteWithThreadName[]> {
    throw new Error('Method not implemented.')
  }

  createInThread(content: string, thread: Thread): Promise<Note> {
    throw new Error('Method not implemented.')
  }

  createInTree(content: string, parentNote: Note): Promise<Note> {
    throw new Error('Method not implemented.')
  }

  edit(content: string, note: Note): Promise<Note> {
    throw new Error('Method not implemented.')
  }

  remove(note: Note): Promise<void> {
    throw new Error('Method not implemented.')
  }

  restore(note: Note): Promise<void> {
    throw new Error('Method not implemented.')
  }

  deleteNote(note: Note): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
