import { Note, Thread } from '@prisma/client'
import { useEffect, useRef, useState } from 'react'

type SearchProps = {
  thread: Thread
  searchText: string
}

function useSearchNoteList(
  loadNext: (lastId: string | null, count: number) => Promise<Note[]>
) {
  const [hasErrorOccured, setHasErrorOccured] = useState(false)
  const [hasLoadedAll, setHasLoadedAll] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])

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
  }
}

// TODO: 検索部分の仕様をちゃんと決める
// 特に検索範囲: 全体(ごみ箱含める)、ごみ箱以外、開いてるスレッド、その他 (?)
// 一旦今開いているスレッドのメモを検索することにする
export default function Search({ thread, searchText }: SearchProps) {
  const { notes, hasLoadedAll, hasErrorOccured, onReachedLast } =
    useSearchNoteList((lastId, count) => {
      return window.api.findNotesInThread(
        thread,
        searchText,
        lastId,
        count,
        true
      )
    })
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
      <div>
        <p>検索結果</p>
        {hasErrorOccured && <p className="text-red-600">問題が発生しました</p>}
      </div>

      <ul className="overflow-y-auto">
        {notes.map((note) => (
          <li className="group relative" key={note.id}>
            <p>{note.createdAt.toUTCString()}</p>
            <p>{note.content}</p>
          </li>
        ))}
        {!hasLoadedAll && <li ref={refLoading}>Loading</li>}
      </ul>
    </div>
  )
}
