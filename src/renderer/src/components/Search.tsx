import { Note, Thread } from '@prisma/client'
import { useEffect, useRef, useState, memo } from 'react'
import { toHtml } from '../markdown/markdown'

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
export default memo(function Search({ thread, searchText }: SearchProps) {
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
      {hasErrorOccured && <p className="text-red-600">問題が発生しました</p>}

      <ul className="divide-midnight-100 dark:divide-midnight-600 divide-y overflow-y-auto">
        {notes.map((note) => (
          <li className="hover:dark:bg-midnight-700" key={note.id}>
            <div className="flex items-center justify-between gap-2 p-2">
              <p className="dark:bg-midnight-500 rounded-md px-4 py-1 text-xs">
                スレッド名をここに
              </p>
              <p className="text-xs">{note.createdAt.toUTCString()}</p>
            </div>

            <p
              className="pb-4 pl-4 text-sm"
              dangerouslySetInnerHTML={{ __html: toHtml(note.content) }}
            />
          </li>
        ))}
        {!hasLoadedAll && <li ref={refLoading}>Loading</li>}
      </ul>
    </div>
  )
})
