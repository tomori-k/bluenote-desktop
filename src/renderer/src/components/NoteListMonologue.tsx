import { Note } from '@prisma/client'
import { useEffect, useRef, useState } from 'react'
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

/**
 * YYYY年MM月DD日の形式にフォーマットする
 */
function formatDate(date: Date) {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())

  return `${year}年${month}月${day}日`
}

function reversed<T>(array: T[]) {
  return array.map((_, i) => array[array.length - 1 - i])
}

export type NoteGroupList = {
  date: Date
  noteGroups: NoteType[][]
}[]

type NoteListMonologueProps = {
  noteGroups: NoteGroupList
  hasLoadedAll: boolean
  onReachedLast: () => void
  onNoteClicked: (note: Note) => void
  onNoteEditClicked: (note: Note) => void
  onNoteRemoveClicked: (note: Note) => void
}

function NoteGroupItem({
  note,
  isLastItem,
  onNoteClicked,
  onNoteEditClicked,
  onNoteRemoveClicked,
}: {
  note: NoteType
  isLastItem: boolean
  onNoteClicked: (note: Note) => void
  onNoteEditClicked: (note: Note) => void
  onNoteRemoveClicked: (note: Note) => void
}) {
  return (
    <li className="hover:bg-midnight-100 hover:dark:bg-midnight-700 group relative grid grid-cols-[auto_1fr] py-1">
      <div className="w-16 pl-2 pr-4 pt-[1px] text-xs">
        <p
          className={
            (!isLastItem &&
            (note.childrenCount == null || note.childrenCount === 0)
              ? 'invisible opacity-50 group-hover:visible'
              : '') + ' dark:text-midnight-200 pb-1 pr-2 text-right'
          }
        >
          {formatTime(note.createdAt)}
        </p>
        {note.childrenCount != null && note.childrenCount > 0 && (
          <ChildrenCountView>{note.childrenCount}</ChildrenCountView>
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
  )
}

function NoteGroup({
  noteGroup,
  onNoteClicked,
  onNoteEditClicked,
  onNoteRemoveClicked,
}: {
  noteGroup: NoteType[]
  onNoteClicked: (note: Note) => void
  onNoteEditClicked: (note: Note) => void
  onNoteRemoveClicked: (note: Note) => void
}) {
  const reversedGroup = reversed(noteGroup)

  return (
    <li className="py-2">
      <ul className="">
        {reversedGroup.map((note, i) => (
          <NoteGroupItem
            key={note.id}
            note={note}
            isLastItem={i === 0}
            onNoteClicked={onNoteClicked}
            onNoteEditClicked={onNoteEditClicked}
            onNoteRemoveClicked={onNoteRemoveClicked}
          />
        ))}
      </ul>
    </li>
  )
}

function NoteListWithDate({
  date,
  noteGroups,
  onNoteClicked,
  onNoteEditClicked,
  onNoteRemoveClicked,
}: {
  date: Date
  noteGroups: NoteType[][]
  onNoteClicked: (note: Note) => void
  onNoteEditClicked: (note: Note) => void
  onNoteRemoveClicked: (note: Note) => void
}) {
  const reversedGroups = reversed(noteGroups)

  return (
    <>
      <li className="relative h-0">
        <div className="border-midnight-600 absolute left-0 right-0 top-3 border-t"></div>
      </li>
      <li className="sticky top-1 z-10 h-6 text-center">
        <span className="bg-midnight-500 rounded-full px-5 py-1.5 text-xs">
          {formatDate(date)}
        </span>
      </li>
      <li>
        <ul>
          {reversedGroups.map((noteGroup) => (
            <NoteGroup
              key={noteGroup[0].id}
              noteGroup={noteGroup}
              onNoteClicked={onNoteClicked}
              onNoteEditClicked={onNoteEditClicked}
              onNoteRemoveClicked={onNoteRemoveClicked}
            />
          ))}
        </ul>
      </li>
    </>
  )
}

export default function NoteListMonologue({
  noteGroups,
  hasLoadedAll,
  onReachedLast,
  onNoteClicked,
  onNoteEditClicked,
  onNoteRemoveClicked,
}: NoteListMonologueProps) {
  const [first, setFirst] = useState(true)
  const refLoading = useRef<HTMLLIElement>(null)
  const refList = useRef<HTMLUListElement>(null)
  const refOnReachedLast = useRef(() => {})

  refOnReachedLast.current = onReachedLast

  useEffect(() => {
    const target = refLoading.current

    if (target == null || refList.current == null) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          refOnReachedLast.current()
        }
      },
      { root: refList.current, rootMargin: '300px 0px 0px 0px', threshold: 0 }
    )

    observer.observe(target)

    return () => {
      observer.unobserve(target)
    }
  }, [refLoading.current, refList.current])

  useEffect(() => {
    if (first && noteGroups.length > 0) {
      refList.current?.scrollTo({ left: 0, top: refList.current.scrollHeight })
      setFirst(false)
    }
  }, [noteGroups])

  const reversedNoteGroups = reversed(noteGroups)

  return (
    <div className="flex h-full flex-col justify-end">
      <ul className="overflow-y-auto" ref={refList}>
        {!hasLoadedAll && (
          <li key="loading" ref={refLoading}>
            Loading
          </li>
        )}

        {reversedNoteGroups.map((noteGroup) => (
          <NoteListWithDate
            key={noteGroup.date.toString()}
            date={noteGroup.date}
            noteGroups={noteGroup.noteGroups}
            onNoteClicked={onNoteClicked}
            onNoteEditClicked={onNoteEditClicked}
            onNoteRemoveClicked={onNoteRemoveClicked}
          />
        ))}
      </ul>
    </div>
  )
}
