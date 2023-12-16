import { Note } from '@prisma/client'
import { useEffect, useRef } from 'react'

type NoteListMonologueProps = {
  noteGroups: Note[][]
  hasLoadedAll: boolean
  onReachedLast: () => void
  onNoteClicked: (note: Note) => void
}

export default function NoteListMonologue({
  noteGroups,
  hasLoadedAll,
  onReachedLast,
  onNoteClicked,
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
    <ul className="flex h-full flex-col-reverse gap-y-4 overflow-y-auto">
      {noteGroups.map((noteGroup) => (
        <li key={noteGroup[0].id} className="">
          <ul className="flex flex-col-reverse">
            {noteGroup.map((note, i) => (
              <li key={note.id} onClick={() => onNoteClicked(note)}>
                {i === noteGroup.length - 1 && (
                  <p>{note.createdAt.toUTCString()}</p>
                )}
                <p>{note.content}</p>
              </li>
            ))}
          </ul>
        </li>
      ))}
      {!hasLoadedAll && <li ref={refLoading}>Loading</li>}
    </ul>
  )
}
