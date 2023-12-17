import { useEffect, useRef, useState } from 'react'
import { ContextMenu } from './SideMenu'
import { Note } from '@prisma/client'

function useTrashNoteList(
  loadNext: (lastId: string | null, count: number) => Promise<Note[]>,
  restoreNote: (note: Note) => Promise<void>,
  deleteNote: (note: Note) => Promise<void>
) {
  const [hasErrorOccured, setHasErrorOccured] = useState(false)
  const [hasLoadedAll, setHasLoadedAll] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])

  async function onNoteRestoreClicked(note: Note) {
    try {
      await restoreNote(note)
      setNotes(notes.filter((n) => n.id !== note.id))
    } catch (e) {
      setHasErrorOccured(true)
    }
  }

  async function onNoteDeleteClicked(note: Note) {
    try {
      await deleteNote(note)
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
    onReachedLast,
    onNoteRestoreClicked,
    onNoteDeleteClicked,
  }
}

export default function Trash() {
  const {
    notes,
    hasLoadedAll,
    hasErrorOccured,
    onReachedLast,
    onNoteRestoreClicked,
    onNoteDeleteClicked,
  } = useTrashNoteList(
    (lastId, count) => window.api.findNotesInTrash('', lastId, count),
    (note) => window.api.restoreNote(note),
    (note) => window.api.deleteNote(note)
  )
  const [contextMenuState, setContextMenuState] = useState<{
    left: number
    top: number
    note: Note
  } | null>(null)

  const refLoading = useRef<HTMLLIElement>(null)
  const refOnReachedLast = useRef(() => {})

  function onNoteMenuClicked(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    note: Note
  ) {
    e.stopPropagation()

    const bounds = e.currentTarget.getBoundingClientRect()

    // TODO: right で指定したい
    setContextMenuState({
      left: bounds.left - 100,
      top: bounds.top,
      note,
    })
  }

  refOnReachedLast.current = onReachedLast

  useEffect(() => {
    const target = refLoading.current

    if (target == null) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        refOnReachedLast.current()
      }
    })

    observer.observe(target)

    return () => {
      observer.unobserve(target)
    }
  }, [refLoading.current])

  return (
    <div className="grid grid-rows-[auto_minmax(0,_1fr)]">
      <div>
        <p>ごみ箱</p>
        {hasErrorOccured && <p className="text-red-600">問題が発生しました</p>}
      </div>

      <ul className="overflow-y-auto">
        {notes.map((note) => (
          <li className="group relative" key={note.id}>
            <p>{note.createdAt.toUTCString()}</p>
            <p>{note.content}</p>
            <button
              type="button"
              className="collapse absolute right-0 top-0 group-hover:visible"
              onClick={(e) => onNoteMenuClicked(e, note)}
            >
              ...
            </button>
          </li>
        ))}
        {!hasLoadedAll && <li ref={refLoading}>Loading</li>}
      </ul>

      {contextMenuState && (
        <ContextMenu
          position={contextMenuState}
          onClose={() => setContextMenuState(null)}
        >
          <ul>
            <li onClick={() => onNoteRestoreClicked(contextMenuState.note)}>
              もとに戻す
            </li>
            <li onClick={() => onNoteDeleteClicked(contextMenuState.note)}>
              完全に削除
            </li>
          </ul>
        </ContextMenu>
      )}
    </div>
  )
}
