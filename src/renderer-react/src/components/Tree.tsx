import { Note, Thread } from '@prisma/client'
import Editor from './Editor'
import { useDisplayMode, useNoteList } from './ThreadView'
import NoteListMonologue from './NoteListMonologue'
import NoteListScrap from './NoteListScrap'

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
    onReachedLast,
    onNoteCreateClicked,
    onNoteEditClicked,
    onNoteRemoveClicked,
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

  const [displayMode, notesTransformed] = useDisplayMode(
    notes,
    thread.displayMode
  )

  return (
    <div className="bg-midnight-800 grid grid-rows-[minmax(0,_1fr)_auto]">
      {displayMode === 'scrap' ? (
        <NoteListScrap
          notes={notesTransformed}
          hasLoadedAll={hasLoadedAll}
          onReachedLast={onReachedLast}
          onNoteClicked={() => {}}
          onNoteEditClicked={onNoteEditClicked}
          onNoteRemoveClicked={onNoteRemoveClicked}
        />
      ) : (
        <NoteListMonologue
          noteGroups={notesTransformed}
          hasLoadedAll={hasLoadedAll}
          onReachedLast={onReachedLast}
          onNoteClicked={() => {}}
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
