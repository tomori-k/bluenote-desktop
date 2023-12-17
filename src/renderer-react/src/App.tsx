import SideMenu from './components/SideMenu'
import ThreadView from './components/ThreadView'
import Tree from './components/Tree'
import Search from './components/Search'
import Trash from './components/Trash'
import Closable from './components/Closable'
import { useEffect, useState } from 'react'
import { Note, Thread } from '@prisma/client'

function useDebounce<T>(value: T) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedValue(value), 1000)
    return () => clearTimeout(timerId)
  }, [value])

  return debouncedValue
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
    <div className="grid h-screen grid-rows-[auto_minmax(0,_1fr)]">
      <div>
        <button type="button">メニュー</button>
        <input
          type="text"
          placeholder="検索..."
          // value={searchText}
          onChange={onSearchTextChanged}
        />
      </div>
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] grid-rows-[minmax(0,_1fr)]">
        <SideMenu
          onThreadSelected={(x) => setSelection({ thread: x, note: null })}
          onTrashClicked={() => setIsTrashViewOpen(true)}
        />

        <ThreadView
          thread={selection.thread}
          key={selection.thread?.id}
          onNoteClicked={onNoteInThreadClicked}
        />

        {selection.thread != null && selection.note != null && (
          <Closable onClose={() => setSelection({ ...selection, note: null })}>
            <Tree
              thread={selection.thread}
              parentNote={selection.note}
              key={selection.note.id}
            />
          </Closable>
        )}

        {isSearchViewOpen && selection.thread != null && (
          <Closable onClose={() => setIsSearchViewOpen(false)}>
            <Search
              key={searchTextDebounced}
              thread={selection.thread}
              searchText={searchTextDebounced}
            />
          </Closable>
        )}

        {isTrashViewOpen && (
          <Closable onClose={() => setIsTrashViewOpen(false)}>
            <Trash />
          </Closable>
        )}
      </div>
      {/* TODO: 設定モーダル */}
    </div>
  )
}

export default App
