import { Note } from '@prisma/client'
import { useEffect, useRef } from 'react'
import { HoverMenu, HoverMenuItem } from './HoverMenu'
import DeleteIcon from './icons/DeleteIcon'
import EditIcon from './icons/EditIcon'
import TextBulletListTreeIcon from './icons/TextBulletListTreeIcon'

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
      <ul className="flex h-full flex-col-reverse overflow-y-auto">
        {noteGroups.map((noteGroup) => (
          <li key={noteGroup[0].id} className="py-2">
            <ul className="flex flex-col-reverse">
              {noteGroup.map((note, i) => (
                <li
                  className="hover:bg-midnight-700 group relative flex flex-row py-1"
                  key={note.id}
                >
                  <p
                    className={
                      (i !== noteGroup.length - 1
                        ? 'invisible opacity-50 group-hover:visible'
                        : '') + ' w-14 px-2 pt-[1px] text-xs'
                    }
                  >
                    {note.createdAt.getHours()}:{note.createdAt.getMinutes()}
                  </p>
                  <p className="break-all text-sm">{note.content}</p>
                  <HoverMenu className="collapse absolute right-1 top-[-1.125rem] group-hover:visible">
                    <HoverMenuItem onClick={() => onNoteClicked(note)}>
                      <TextBulletListTreeIcon />
                    </HoverMenuItem>
                    <HoverMenuItem onClick={() => onNoteEditClicked(note)}>
                      <EditIcon className="h-4 w-4" />
                    </HoverMenuItem>
                    <HoverMenuItem onClick={() => onNoteRemoveClicked(note)}>
                      <DeleteIcon />
                    </HoverMenuItem>
                  </HoverMenu>
                </li>
              ))}
            </ul>
          </li>
        ))}
        {!hasLoadedAll && <li ref={refLoading}>Loading</li>}
      </ul>
    </>
  )
}
