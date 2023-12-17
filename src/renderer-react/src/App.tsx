import SideMenu from './components/SideMenu'
import ThreadView from './components/ThreadView'
import Tree from './components/Tree'
import Search from './components/Search'
import Trash from './components/Trash'
import Closable from './components/Closable'
import HamburgerIcon from './components/icons/HamburgerIcon'
import TextBulletListTreeIcon from './components/icons/TextBulletListTreeIcon'
import { useEffect, useState } from 'react'
import { Note, Thread } from '@prisma/client'
import DeleteIcon from './components/icons/DeleteIcon'
import SearchIcon from './components/icons/SearchIcon'

function useDebounce<T>(value: T) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedValue(value), 1000)
    return () => clearTimeout(timerId)
  }, [value])

  return debouncedValue
}

type ClosableTabHeaderProps = {
  icon: React.ReactNode
  title: string
}

function ClosableTabHeader({ icon, title }: ClosableTabHeaderProps) {
  return (
    <div className="flex items-center gap-4 pl-4">
      {icon}
      {title}
    </div>
  )
}

function App() {
  const [isSearchViewOpen, setIsSearchViewOpen] = useState(false)
  const [isTrashViewOpen, setIsTrashViewOpen] = useState(false)
  const [selection, setSelection] = useState<{
    thread: Thread | null
    note: Note | null
  }>({ thread: null, note: null })
  const [searchText, setSearchText] = useState('')
  const searchTextDebounced = useDebounce(searchText)

  function onNoteInThreadClicked(note: Note) {
    setSelection({ ...selection, note })
  }

  async function onSearchTextChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchText(e.target.value)

    if (!isSearchViewOpen && e.target.value.length > 0) {
      setIsSearchViewOpen(true)
    }
  }

  return (
    <div className="text-midnight-50 grid h-screen grid-rows-[auto_minmax(0,_1fr)]">
      <div className="bg-midnight-900  relative flex h-12 items-center justify-center gap-4">
        <button className="absolute left-4" type="button">
          <HamburgerIcon />
        </button>
        <SearchIcon />
        <input
          className="bg-midnight-700 focus:border-midnight-400 h-8 w-80 rounded-lg pl-3 focus:border focus:outline-none"
          type="text"
          placeholder="検索..."
          // value={searchText}
          onChange={onSearchTextChanged}
        />
      </div>
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] grid-rows-[minmax(0,_1fr)]">
        <SideMenu
          selectedThraed={selection.thread}
          onThreadSelected={(x) => setSelection({ thread: x, note: null })}
          onTrashClicked={() => setIsTrashViewOpen(true)}
        />

        <ThreadView
          thread={selection.thread}
          key={selection.thread?.id}
          onNoteClicked={onNoteInThreadClicked}
        />

        {selection.thread != null && selection.note != null && (
          <Closable
            header={
              <ClosableTabHeader
                icon={<TextBulletListTreeIcon />}
                title={selection.note.content.slice(0, 10)}
              />
            }
            onClose={() => setSelection({ ...selection, note: null })}
          >
            <Tree
              thread={selection.thread}
              parentNote={selection.note}
              key={selection.note.id}
            />
          </Closable>
        )}

        {isSearchViewOpen && selection.thread != null && (
          <Closable
            header={
              <ClosableTabHeader icon={<SearchIcon />} title="検索結果" />
            }
            onClose={() => setIsSearchViewOpen(false)}
          >
            <Search
              key={searchTextDebounced}
              thread={selection.thread}
              searchText={searchTextDebounced}
            />
          </Closable>
        )}

        {isTrashViewOpen && (
          <Closable
            header={<ClosableTabHeader icon={<DeleteIcon />} title="ごみ箱" />}
            onClose={() => setIsTrashViewOpen(false)}
          >
            <Trash />
          </Closable>
        )}
      </div>
      {/* TODO: 設定モーダル */}
    </div>
  )
}

export default App
