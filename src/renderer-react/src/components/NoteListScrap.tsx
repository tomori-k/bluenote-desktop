import { Note } from '@prisma/client'
import { useRef, useEffect } from 'react'

type NoteListScrapProps = {
  notes: Note[]
  hasLoadedAll: boolean
  onReachedLast: () => void
  onNoteClicked: (note: Note) => void
}

export default function NoteListScrap({
  notes,
  hasLoadedAll,
  onReachedLast,
  onNoteClicked,
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
    <ul className="overflow-y-auto">
      {notes.map((x) => (
        <li key={x.id} onClick={() => onNoteClicked(x)}>
          <p>{x.createdAt.toUTCString()}</p>
          <p>{x.content}</p>
        </li>
      ))}
      {!hasLoadedAll && <li ref={refLoading}>Loading</li>}
    </ul>
  )
}
