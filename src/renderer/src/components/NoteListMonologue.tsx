import { Note } from '@prisma/client'
import { useEffect, useRef } from 'react'
import { HoverMenu, HoverMenuItem } from './HoverMenu'
import DeleteIcon from './icons/DeleteIcon'
import EditIcon from './icons/EditIcon'
import TextBulletListTreeIcon from './icons/TextBulletListTreeIcon'
import { toHtml } from '../markdown/markdown'
import { ChildrenCountView, NoteType } from './NoteList'

function formatTime(date: Date) {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  const hour = date.getHours()
  const minute = pad(date.getMinutes())

  return `${hour}:${minute}`
}

type NoteListMonologueProps = {
  noteGroups: NoteType[][]
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
                  className="hover:bg-midnight-100 hover:dark:bg-midnight-700 group relative grid grid-cols-[auto_1fr] py-1"
                  key={note.id}
                >
                  <div className="w-16 pl-2 pr-4 pt-[1px] text-xs">
                    <p
                      className={
                        (i !== noteGroup.length - 1 &&
                        (noteGroup[i].childrenCount == null ||
                          noteGroup[i].childrenCount === 0)
                          ? 'invisible opacity-50 group-hover:visible'
                          : '') + ' dark:text-midnight-200 pb-1 pr-2 text-right'
                      }
                    >
                      {formatTime(note.createdAt)}
                    </p>
                    {note.childrenCount != null && note.childrenCount > 0 && (
                      <ChildrenCountView>
                        {note.childrenCount}
                      </ChildrenCountView>
                    )}
                  </div>
                  <p
                    className="markdown-body break-all text-sm"
                    dangerouslySetInnerHTML={{ __html: toHtml(note.content) }}
                  />
                  <HoverMenu className="collapse absolute right-1 top-[-1.125rem] group-hover:visible">
                    <HoverMenuItem onClick={() => onNoteClicked(note)}>
                      <TextBulletListTreeIcon className="fill-midnight-50" />
                    </HoverMenuItem>
                    <HoverMenuItem onClick={() => onNoteEditClicked(note)}>
                      <EditIcon className="fill-midnight-50 h-4 w-4" />
                    </HoverMenuItem>
                    <HoverMenuItem onClick={() => onNoteRemoveClicked(note)}>
                      <DeleteIcon className="fill-midnight-50" />
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
