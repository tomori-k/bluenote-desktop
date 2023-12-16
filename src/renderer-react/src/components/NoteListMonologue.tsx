import { ContextMenu } from './SideMenu'
import { Note } from '@prisma/client'
import { useEffect, useRef, useState } from 'react'

type NoteListMonologueProps = {
  noteGroups: Note[][]
  hasLoadedAll: boolean
  onReachedLast: () => void
  onNoteClicked: (note: Note) => void
  onNoteEditClicked: (note: Note) => void
  onNoteRemoveClicked: (note: Note) => void
}

export default function NoteListMonologue({
  noteGroups,
  hasLoadedAll,
  onReachedLast,
  onNoteClicked,
  onNoteEditClicked,
  onNoteRemoveClicked,
}: NoteListMonologueProps) {
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
      <ul className="flex h-full flex-col-reverse gap-y-4 overflow-y-auto">
        {noteGroups.map((noteGroup) => (
          <li key={noteGroup[0].id} className="">
            <ul className="flex flex-col-reverse">
              {noteGroup.map((note, i) => (
                <li
                  className="group relative"
                  key={note.id}
                  onClick={() => onNoteClicked(note)}
                >
                  {i === noteGroup.length - 1 && (
                    <p>{note.createdAt.toUTCString()}</p>
                  )}
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
            </ul>
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
