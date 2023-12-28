import { Note } from '@prisma/client'
import { useRef, useEffect } from 'react'
import TextBulletListTreeIcon from './icons/TextBulletListTreeIcon'
import EditIcon from './icons/EditIcon'
import DeleteIcon from './icons/DeleteIcon'
import { HoverMenu, HoverMenuItem } from './HoverMenu'
import { toHtml } from '../markdown/markdown'
import { ChildrenCountView, NoteType } from './NoteList'

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

type NoteListScrapProps = {
  notes: NoteType[]
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
      <ul className="divide-midnight-100 dark:divide-midnight-600 divide-y overflow-y-auto">
        {notes.map((x) => (
          <li key={x.id} className="first:pt-5">
            <div
              className="hover:bg-midnight-100 hover:dark:bg-midnight-700 group relative"
              key={x.id}
            >
              <div className="flex flex-row-reverse justify-between p-2 text-xs">
                <p>{formatDate(x.createdAt)}</p>
                <div className="ml-1 w-12">
                  {x.childrenCount != null && x.childrenCount > 0 && (
                    <ChildrenCountView>{x.childrenCount}</ChildrenCountView>
                  )}
                </div>
              </div>
              <p
                className="markdown-body break-all pb-4 pl-4 text-sm"
                dangerouslySetInnerHTML={{ __html: toHtml(x.content) }}
              />
              <HoverMenu className="collapse absolute right-1 top-[-1.125rem] group-hover:visible">
                <HoverMenuItem onClick={() => onNoteClicked(x)}>
                  <TextBulletListTreeIcon className="fill-midnight-50" />
                </HoverMenuItem>
                <HoverMenuItem onClick={() => onNoteEditClicked(x)}>
                  <EditIcon className="fill-midnight-50 h-4 w-4" />
                </HoverMenuItem>
                <HoverMenuItem onClick={() => onNoteRemoveClicked(x)}>
                  <DeleteIcon className="fill-midnight-50" />
                </HoverMenuItem>
              </HoverMenu>
            </div>
          </li>
        ))}
        {!hasLoadedAll && <li ref={refLoading}>Loading</li>}
      </ul>
    </>
  )
}
