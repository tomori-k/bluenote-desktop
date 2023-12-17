import { Note } from '@prisma/client'
import { useRef, useEffect } from 'react'
import TextBulletListTreeIcon from './icons/TextBulletListTreeIcon'
import EditIcon from './icons/EditIcon'
import DeleteIcon from './icons/DeleteIcon'
import { HoverMenu, HoverMenuItem } from './HoverMenu'

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
          <li className="hover:bg-midnight-700 group relative" key={x.id}>
            <p className="p-2 text-right text-xs">
              {x.createdAt.toUTCString()}
            </p>
            <p className="pb-4 pl-4 text-sm">{x.content}</p>
            <HoverMenu className="collapse absolute right-1 top-[-1.125rem] group-hover:visible">
              <HoverMenuItem onClick={() => onNoteClicked(x)}>
                <TextBulletListTreeIcon />
              </HoverMenuItem>
              <HoverMenuItem onClick={() => onNoteEditClicked(x)}>
                <EditIcon className="h-4 w-4" />
              </HoverMenuItem>
              <HoverMenuItem onClick={() => onNoteRemoveClicked(x)}>
                <DeleteIcon />
              </HoverMenuItem>
            </HoverMenu>
          </li>
        ))}
        {!hasLoadedAll && <li ref={refLoading}>Loading</li>}
      </ul>
    </>
  )
}
