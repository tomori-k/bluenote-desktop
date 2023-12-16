import { useEffect, useRef } from 'react'
import { useNotePagination } from './ThreadView'

export default function Trash() {
  const refLoading = useRef<HTMLLIElement>(null)
  const refOnReachedLast = useRef(() => {})
  const { notes, hasLoadedAll, hasErrorOccured, loadMore } = useNotePagination(
    async (lastId, count) => {
      return await window.api.findNotesInTrash('', lastId, count)
    }
  )

  async function onReachedLast() {
    await loadMore()
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
          <li key={note.id}>
            <p>{note.createdAt.toUTCString()}</p>
            <p>{note.content}</p>
          </li>
        ))}
        {!hasLoadedAll && <li ref={refLoading}>Loading</li>}
      </ul>
    </div>
  )
}
