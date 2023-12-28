import { Note } from '@prisma/client'
import { useEffect, useRef, useState, memo } from 'react'
import { toHtml } from '../markdown/markdown'

// LocalTime の YYYY-MM-DD HH:mm の形式にフォーマットする
function formatDate(date: Date) {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())

  return `${year}-${month}-${day} ${hour}:${minute}`
}

type SearchProps = {
  searchText: string
}

type NoteWithThreadName = Note & { threadName: string }

function useSearchNoteList(
  loadNext: (
    lastId: string | null,
    count: number
  ) => Promise<NoteWithThreadName[]>
) {
  const [hasErrorOccured, setHasErrorOccured] = useState(false)
  const [hasLoadedAll, setHasLoadedAll] = useState(false)
  const [notes, setNotes] = useState<NoteWithThreadName[]>([])

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
export default memo(function Search({ searchText }: SearchProps) {
  const { notes, hasLoadedAll, hasErrorOccured, onReachedLast } =
    useSearchNoteList((lastId, count) => {
      return window.api.findNotes(searchText, lastId, count)
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
          <li className="hover:dark:bg-midnight-700 group" key={note.id}>
            <div className="flex items-center justify-between gap-2 p-2">
              <p className="dark:bg-midnight-500 rounded-md px-4 py-1 text-xs">
                {note.threadName}
              </p>
              <p className="text-xs">{formatDate(note.createdAt)}</p>
            </div>

            <p
              className="markdown-body break-all pb-4 pl-4 text-sm"
              dangerouslySetInnerHTML={{ __html: toHtml(note.content) }}
            />
          </li>
        ))}
        {!hasLoadedAll && <li ref={refLoading}>Loading</li>}
      </ul>
    </div>
  )
})
