import { Note, Thread } from '@prisma/client'
import Editor from './Editor'
import { useDisplayMode, useNotePagination } from './ThreadView'
import { useMemo, useState } from 'react'
import NoteListMonologue from './NoteListMonologue'
import NoteListScrap from './NoteListScrap'

type TreeViewrProps = {
  thread: Thread
  parentNote: Note
}

// TODO: ThreadView とほぼ同じなので共通化したい
export default function Tree({ thread, parentNote }: TreeViewrProps) {
  const [createdNotes, setCreatedNotes] = useState<Note[]>([])
  const [hasErrorOccuredOnCreate, setHasErrorOccuredOnCreate] = useState(false)
  const {
    notes: loadedNotes,
    hasLoadedAll,
    hasErrorOccured: hasErrorOccuredOnLoad,
    loadMore,
  } = useNotePagination(async (lastId, count) => {
    return await window.api.findNotesInTree(parentNote, '', lastId, count, true)
  })
  const mergedNotes = useMemo(
    () => [...createdNotes, ...loadedNotes],
    [createdNotes, loadedNotes, thread?.displayMode]
  )
  const [displayMode, notes] = useDisplayMode(mergedNotes, thread.displayMode)
  const hasErrorOccured = useMemo(
    () => hasErrorOccuredOnCreate || hasErrorOccuredOnLoad,
    [hasErrorOccuredOnCreate, hasErrorOccuredOnLoad]
  )
  const [noteInput, setNoteInput] = useState('')

  async function onNoteCreateClicked() {
    if (thread == null) return

    try {
      const created = await window.api.createNoteInTree(noteInput, parentNote)
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
    <>
      <p>{parentNote.content}</p>
      <div className="grid grid-rows-[minmax(0,_1fr)_auto]">
        {displayMode === 'scrap' ? (
          <NoteListScrap
            notes={notes}
            hasLoadedAll={hasLoadedAll}
            onReachedLast={onReachedLast}
            onNoteClicked={() => {}}
          />
        ) : (
          <NoteListMonologue
            noteGroups={notes}
            hasLoadedAll={hasLoadedAll}
            onReachedLast={onReachedLast}
            onNoteClicked={() => {}}
          />
        )}

        {hasErrorOccured && <p className="text-red-600">問題が発生しました</p>}

        <Editor
          text={noteInput}
          onTextChange={(text) => setNoteInput(text)}
          onCreateClicked={onNoteCreateClicked}
        />
      </div>
    </>
  )
}
