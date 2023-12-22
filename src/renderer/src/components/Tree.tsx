import { Note, Thread } from '@prisma/client'
import Editor from './Editor'
import { useNoteList, NoteList } from './ThreadView'
import { useRef, useCallback } from 'react'

type TreeViewrProps = {
  thread: Thread
  parentNote: Note
}

export default function Tree({ thread, parentNote }: TreeViewrProps) {
  const {
    notes,
    hasLoadedAll,
    hasErrorOccured,
    noteInput,
    editorMode,
    onReachedLast: _onReachedLast,
    onNoteCreateClicked,
    onNoteEditClicked: _onNoteEditClicked,
    onNoteRemoveClicked: _onNoteRemoveClicked,
    setNoteInput,
  } = useNoteList(
    async (lastId, count) => {
      return await window.api.findNotesInTree(
        parentNote,
        '',
        lastId,
        count,
        true
      )
    },
    async (content) => {
      return await window.api.createNoteInTree(content, parentNote)
    },
    async (content, parentNote) => {
      return await window.api.editNote(content, parentNote)
    },
    async (note) => {
      return await window.api.removeNote(note)
    }
  )

  const refOnReachedLast = useRef(async () => {})
  const refOnNoteEditClicked = useRef(async (_: Note) => {})
  const refOnNoteRemoveClicked = useRef(async (_: Note) => {})

  const onReachedLast = useCallback(() => {
    refOnReachedLast.current()
  }, [])
  const onNoteEditClicked = useCallback((note: Note) => {
    refOnNoteEditClicked.current(note)
  }, [])
  const onNoteRemoveClicked = useCallback((note: Note) => {
    refOnNoteRemoveClicked.current(note)
  }, [])

  refOnReachedLast.current = _onReachedLast
  refOnNoteEditClicked.current = _onNoteEditClicked
  refOnNoteRemoveClicked.current = _onNoteRemoveClicked

  return (
    <div className="dark:bg-midnight-800 grid grid-rows-[minmax(0,_1fr)_auto]">
      <NoteList
        notes={notes}
        hasLoadedAll={hasLoadedAll}
        displayMode={thread.displayMode}
        onReachedLast={onReachedLast}
        onNoteClicked={() => {}}
        onNoteEditClicked={onNoteEditClicked}
        onNoteRemoveClicked={onNoteRemoveClicked}
      />

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
