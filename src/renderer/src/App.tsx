import SideMenu from './components/SideMenu'
import ThreadView from './components/ThreadView'
import Tree from './components/Tree'
import Search from './components/Search'
import Trash from './components/Trash'
import Closable from './components/Closable'
import HamburgerIcon from './components/icons/HamburgerIcon'
import TextBulletListTreeIcon from './components/icons/TextBulletListTreeIcon'
import { useCallback, useEffect, useState } from 'react'
import { Note, Thread } from '@prisma/client'
import DeleteIcon from './components/icons/DeleteIcon'
import SearchIcon from './components/icons/SearchIcon'
import Settings from './components/Settings'
import SyncIcon from './components/icons/SyncIcon'
import AppLayout from './components/AppLayout'

function useSearchDebounce(value: string) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (value.length > 0) setDebouncedValue(value)
    }, 200)
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
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [isSearchViewOpen, setIsSearchViewOpen] = useState(false)
  const [isTrashViewOpen, setIsTrashViewOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [selection, setSelection] = useState<{
    thread: Thread | null
    note: Note | null
  }>({ thread: null, note: null })
  const [searchText, setSearchText] = useState('')
  const searchTextDebounced = useSearchDebounce(searchText)
  const [hasErrorOccured, setHasErrorOccured] = useState(false) // todo: これをどこかで表示する

  const onNoteInThreadClicked = useCallback((note: Note) => {
    setSelection((selection) => ({ ...selection, note }))
  }, [])

  const onThreadClicked = useCallback((thread: Thread) => {
    setSelection({ thread, note: null })
  }, [])

  const onTrashClicked = useCallback(() => {
    setIsTrashViewOpen((isTrashViewOpen) => !isTrashViewOpen)
  }, [])

  const onSettingsClicked = useCallback(() => {
    setIsSettingsModalOpen(true)
  }, [])

  async function onSearchTextChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchText(e.target.value)

    if (!isSearchViewOpen && e.target.value.length > 0) {
      setIsSearchViewOpen(true)
    }
  }

  async function onSyncClicked() {
    if (isSyncing) return

    try {
      setIsSyncing(true)
      await window.api.sync()
    } catch (e) {
      setHasErrorOccured(true)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="text-midnight-950 bg-midnight-50 dark:text-midnight-50 grid h-screen grid-rows-[auto_minmax(0,_1fr)]">
      <div className="bg-midnight-300 dark:bg-midnight-900 electron-drag relative flex h-12 items-center justify-center gap-4">
        <button
          className="electron-no-drag hover:dark:bg-midnight-800 absolute left-0 m-1 rounded-md p-3"
          type="button"
          onClick={() => setIsSideMenuOpen(!isSideMenuOpen)}
        >
          <HamburgerIcon />
        </button>
        <SearchIcon className="fill-midnight-50" />
        <input
          className="electron-no-drag bg-midnight-50 dark:bg-midnight-700 focus:dark:border-midnight-400 h-8 w-80 rounded-lg pl-3 focus:border focus:outline-none"
          type="text"
          placeholder="検索..."
          value={searchText}
          onChange={onSearchTextChanged}
        />

        <button
          className="electron-no-drag [&:not([disabled])]:hover:dark:bg-midnight-800 rounded-md p-2"
          onClick={onSyncClicked}
          disabled={isSyncing}
        >
          <SyncIcon isRotating={isSyncing} />
        </button>
      </div>
      <AppLayout
        sideMenu={
          isSideMenuOpen ? (
            <SideMenu
              selectedThraed={selection.thread}
              onThreadSelected={onThreadClicked}
              onTrashClicked={onTrashClicked}
              onSettingsClicked={onSettingsClicked}
            />
          ) : null
        }
        mainView={
          <ThreadView
            thread={selection.thread}
            key={selection.thread?.id}
            onNoteClicked={onNoteInThreadClicked}
          />
        }
        tabs={[
          selection.thread != null && selection.note != null ? (
            <Closable
              key={'tree'}
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
          ) : null,

          isSearchViewOpen ? (
            <Closable
              key={'search'}
              header={
                <ClosableTabHeader icon={<SearchIcon />} title="検索結果" />
              }
              onClose={() => setIsSearchViewOpen(false)}
            >
              <Search
                key={searchTextDebounced}
                searchText={searchTextDebounced}
              />
            </Closable>
          ) : null,

          isTrashViewOpen ? (
            <Closable
              key={'trash'}
              header={
                <ClosableTabHeader icon={<DeleteIcon />} title="ごみ箱" />
              }
              onClose={() => setIsTrashViewOpen(false)}
            >
              <Trash />
            </Closable>
          ) : null,
        ]}
      />
      {isSettingsModalOpen && (
        <Settings onClose={() => setIsSettingsModalOpen(false)} />
      )}
    </div>
  )
}

export default App
