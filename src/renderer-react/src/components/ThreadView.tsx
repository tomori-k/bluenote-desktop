import { Note, Thread } from '@prisma/client'
import Editor from './Editor'
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

export default function ThreadView({ thread, onNoteClicked }: ThreadViewProps) {
  const [createdNotes, setCreatedNotes] = useState<Note[]>([])
  const [hasErrorOccuredOnCreate, setHasErrorOccuredOnCreate] = useState(false)
  const {
    notes: loadedNotes,
    hasLoadedAll,
    hasErrorOccured: hasErrorOccuredOnLoad,
    loadMore,
  } = useNotePagination(async (lastId, count) => {
    if (thread == null) return []
    return await window.api.findNotesInThread(thread, '', lastId, count, true)
  })
  const mergedNotes = useMemo(
    () => [...createdNotes, ...loadedNotes],
    [createdNotes, loadedNotes, thread?.displayMode]
  )
  const [displayMode, notes] = useDisplayMode(mergedNotes, thread?.displayMode)
  const hasErrorOccured = useMemo(
    () => hasErrorOccuredOnCreate || hasErrorOccuredOnLoad,
    [hasErrorOccuredOnCreate, hasErrorOccuredOnLoad]
  )
  const [noteInput, setNoteInput] = useState('')

  async function onNoteCreateClicked() {
    if (thread == null) return

    try {
      const created = await window.api.createNoteInThread(noteInput, thread)
      setCreatedNotes([created, ...createdNotes])
      setNoteInput('')
    } catch (e) {
      setHasErrorOccuredOnCreate(true)
    }
  }

  async function onReachedLast() {
    await loadMore()
  }

  return (
    <div className="grid grid-rows-[minmax(0,_1fr)_auto]">
      {displayMode === 'scrap' ? (
        <NoteListScrap
          notes={notes}
          hasLoadedAll={hasLoadedAll}
          onReachedLast={onReachedLast}
          onNoteClicked={onNoteClicked}
        />
      ) : (
        <NoteListMonologue
          noteGroups={notes}
          hasLoadedAll={hasLoadedAll}
          onReachedLast={onReachedLast}
          onNoteClicked={onNoteClicked}
        />
      )}

      {hasErrorOccured && <p className="text-red-600">問題が発生しました</p>}

      <Editor
        text={noteInput}
        onTextChange={(text) => setNoteInput(text)}
        onCreateClicked={onNoteCreateClicked}
      />
    </div>
  )
}
