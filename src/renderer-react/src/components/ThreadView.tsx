import { Note, Thread } from '@prisma/client'
import Editor, { EditorMode } from './Editor'
import NoteListScrap from './NoteListScrap'
import NoteListMonologue from './NoteListMonologue'
import { useMemo, useState } from 'react'

type ThreadViewProps = {
  thread: Thread | null
  onNoteClicked: (note: Note) => void
}

export function useNotePagination(
  loadNext: (lastId: string | null, count: number) => Promise<Note[]>
) {
  const count = 100 // ページ単位

  const [notes, setNotes] = useState<Note[]>([])
  const [hasErrorOccured, setHasErrorOccured] = useState(false)
  const [hasLoadedAll, setHasLoadedAll] = useState(false)

  async function loadMore() {
    try {
      const lastId = notes.length > 0 ? notes[notes.length - 1].id : null
      const items = await loadNext(lastId, count)

      setNotes([...notes, ...items])
      if (items.length < count) setHasLoadedAll(true)
    } catch (e) {
      setHasErrorOccured(true)
    }
  }

  return {
    notes,
    hasLoadedAll,
    hasErrorOccured,
    loadMore,
  }
}

/**
 * 作成日時が近いメモをグループ化
 * @param notes 作成日時で降順ソートされたメモのリスト
 */
export function createNoteGroup(notes: Note[]): Note[][] {
  return notes.reduce((accumulator, currrent) => {
    if (accumulator.length === 0) return [[currrent]]

    const lastGroup = accumulator[accumulator.length - 1]
    const lastNote = lastGroup[lastGroup.length - 1]

    if (
      lastNote.createdAt.getTime() - currrent.createdAt.getTime() <
      3000 * 60 /* 3分未満なら同グループ化 */
    )
      lastGroup.push(currrent)
    else accumulator.push([currrent])

    return accumulator
  }, new Array<Note[]>())
}

export function useDisplayMode(
  notes: Note[],
  displayMode: string | undefined
): ['scrap', Note[]] | ['monologue', Note[][]] {
  const mode =
    displayMode === 'monologue' || displayMode === 'scrap'
      ? displayMode
      : 'monologue'

  return useMemo(() => {
    if (mode === 'scrap') return [mode, notes]
    else return [mode, createNoteGroup(notes)]
  }, [notes, mode])
}

export function useNoteList(
  loadNext: (lastId: string | null, count: number) => Promise<Note[]>,
  createNote: (content: string) => Promise<Note>,
  editNote: (content: string, parentNote: Note) => Promise<Note>,
  removeNote: (note: Note) => Promise<void>
) {
  const [hasErrorOccured, setHasErrorOccured] = useState(false)
  const [hasLoadedAll, setHasLoadedAll] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [noteInput, setNoteInput] = useState('')
  const [editTarget, setEditTarget] = useState<Note | null>(null)
  const editorMode = editTarget != null ? EditorMode.Edit : EditorMode.Create

  async function onNoteCreateClicked() {
    // 追加
    if (editTarget == null) {
      try {
        const created = await createNote(noteInput)
        setNotes([created, ...notes])
        setNoteInput('')
      } catch (e) {
        setHasErrorOccured(true)
      }
    }
    // 編集
    else {
      try {
        const edited = await editNote(noteInput, editTarget)
        setNotes(notes.map((n) => (n.id === edited.id ? edited : n)))
        setNoteInput('')
      } catch (e) {
        setHasErrorOccured(true)
      } finally {
        setEditTarget(null)
      }
    }
  }

  async function onNoteEditClicked(note: Note) {
    setEditTarget(note)
    if (noteInput == '') setNoteInput(note.content)
  }

  async function onNoteRemoveClicked(note: Note) {
    try {
      await removeNote(note)
      setNotes(notes.filter((n) => n.id !== note.id))
    } catch (e) {
      setHasErrorOccured(true)
    }
  }

  async function onReachedLast() {
    const count = 100 // ページ単位

    try {
      const lastId = notes.length > 0 ? notes[notes.length - 1].id : null
      const items = await loadNext(lastId, count)

      setNotes([...notes, ...items])
      if (items.length < count) setHasLoadedAll(true)
    } catch (e) {
      setHasErrorOccured(true)
    }
  }

  return {
    notes,
    hasLoadedAll,
    hasErrorOccured,
    noteInput,
    editorMode,
    onReachedLast,
    onNoteCreateClicked,
    onNoteEditClicked,
    onNoteRemoveClicked,
    setNoteInput,
  }
}

export default function ThreadView({ thread, onNoteClicked }: ThreadViewProps) {
  const {
    notes,
    hasLoadedAll,
    hasErrorOccured,
    noteInput,
    editorMode,
    onReachedLast,
    onNoteCreateClicked,
    onNoteEditClicked,
    onNoteRemoveClicked,
    setNoteInput,
  } = useNoteList(
    async (lastId, count) => {
      return thread != null
        ? await window.api.findNotesInThread(thread, '', lastId, count, true)
        : []
    },
    async (content) => {
      if (thread == null) throw new Error('thread is null')
      return await window.api.createNoteInThread(content, thread)
    },
    async (content, parentNote) => {
      return await window.api.editNote(content, parentNote)
    },
    async (note) => {
      return await window.api.removeNote(note)
    }
  )

  const [displayMode, notesTransformed] = useDisplayMode(
    notes,
    thread?.displayMode
  )

  return (
    <div className="grid grid-rows-[minmax(0,_1fr)_auto]">
      {displayMode === 'scrap' ? (
        <NoteListScrap
          notes={notesTransformed}
          hasLoadedAll={hasLoadedAll}
          onReachedLast={onReachedLast}
          onNoteClicked={onNoteClicked}
          onNoteEditClicked={onNoteEditClicked}
          onNoteRemoveClicked={onNoteRemoveClicked}
        />
      ) : (
        <NoteListMonologue
          noteGroups={notesTransformed}
          hasLoadedAll={hasLoadedAll}
          onReachedLast={onReachedLast}
          onNoteClicked={onNoteClicked}
          onNoteEditClicked={onNoteEditClicked}
          onNoteRemoveClicked={onNoteRemoveClicked}
        />
      )}

      {hasErrorOccured && <p className="text-red-600">問題が発生しました</p>}

      <Editor
        text={noteInput}
        editorMode={editorMode}
        onTextChange={(text) => setNoteInput(text)}
        onCreateClicked={onNoteCreateClicked}
      />
    </div>
  )
}
