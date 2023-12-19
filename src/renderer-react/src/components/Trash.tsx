import { useEffect, useRef, useState } from 'react'
import { Note } from '@prisma/client'
import ArrowUndoIcon from './icons/ArrowUndoIcon'
import DeleteForeverIcon from './icons/DeleteForeverIcon'
import { HoverMenu, HoverMenuItem } from './HoverMenu'

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

  const refLoading = useRef<HTMLLIElement>(null)
  const refOnReachedLast = useRef(() => {})

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
      {hasErrorOccured && <p className="text-red-600">問題が発生しました</p>}

      <ul className="divide-midnight-100 dark:divide-midnight-600 divide-y overflow-y-auto">
        {notes.map((note) => (
          <li className="first:pt-5">
            <div
              className="hover:dark:bg-midnight-700 group relative"
              key={note.id}
            >
              <div className="flex items-center justify-between gap-2 p-2">
                <p className="text-midnight-50 bg-midnight-300 dark:bg-midnight-500 rounded-md px-4 py-1 text-xs">
                  スレッド名をここに
                </p>
                <p className="text-xs">{note.createdAt.toUTCString()}</p>
              </div>

              <p className="pb-4 pl-4 text-sm">{note.content}</p>
              <HoverMenu className="collapse absolute right-1 top-[-1.125rem] group-hover:visible">
                <HoverMenuItem onClick={() => onNoteRestoreClicked(note)}>
                  <ArrowUndoIcon />
                </HoverMenuItem>
                <HoverMenuItem onClick={() => onNoteDeleteClicked(note)}>
                  <DeleteForeverIcon />
                </HoverMenuItem>
              </HoverMenu>
            </div>
          </li>
        ))}
        {!hasLoadedAll && <li ref={refLoading}>Loading</li>}
      </ul>
    </div>
  )
}
