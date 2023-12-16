import { Note } from '@prisma/client'
import { useEffect, useRef } from 'react'

type NoteListMonologueProps = {
  noteGroups: Note[][]
  hasLoadedAll: boolean
  onReachedLast: () => void
}

export default function NoteListMonologue({
  noteGroups,
  hasLoadedAll,
  onReachedLast,
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
    <ul className="flex h-full flex-col-reverse overflow-y-auto">
      {noteGroups.map((noteGroup) => (
        <li key={noteGroup[0].id} className="">
          <ul>
            {noteGroup.map((note) => (
              <li key={note.id}>{note.content}</li>
            ))}
          </ul>
        </li>
      ))}
      {!hasLoadedAll && <li ref={refLoading}>Loading</li>}
    </ul>
  )
}
