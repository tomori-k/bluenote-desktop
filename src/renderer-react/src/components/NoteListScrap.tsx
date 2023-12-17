import { Note } from '@prisma/client'
import { useRef, useEffect, useState } from 'react'
import { ContextMenu } from './SideMenu'

type NoteListScrapProps = {
  notes: Note[]
  hasLoadedAll: boolean
  onReachedLast: () => void
  onNoteClicked: (note: Note) => void
  onNoteEditClicked: (note: Note) => void
  onNoteRemoveClicked: (note: Note) => void
}

export default function NoteListScrap({
  notes,
  hasLoadedAll,
  onReachedLast,
  onNoteClicked,
  onNoteEditClicked,
  onNoteRemoveClicked,
}: NoteListScrapProps) {
  const refLoading = useRef<HTMLLIElement>(null)
  const refOnReachedLast = useRef(() => {})
  const [contextMenuState, setContextMenuState] = useState<{
    left: number
    top: number
    note: Note
  } | null>(null)

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
    <>
      <ul className="divide-midnight-600 divide-y overflow-y-auto">
        {notes.map((x) => (
          <li
            className="hover:bg-midnight-700 group relative"
            key={x.id}
            onClick={() => onNoteClicked(x)}
          >
            <p className="p-2 text-right text-xs">
              {x.createdAt.toUTCString()}
            </p>
            <p className="pb-4 pl-4 text-sm">{x.content}</p>
            <button
              type="button"
              className="collapse absolute right-0 top-0 group-hover:visible"
              onClick={(e) => onNoteMenuClicked(e, x)}
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
            <li onClick={() => onNoteEditClicked(contextMenuState.note)}>
              編集
            </li>
            <li onClick={() => onNoteRemoveClicked(contextMenuState.note)}>
              ごみ箱に移動
            </li>
          </ul>
        </ContextMenu>
      )}
    </>
  )
}
