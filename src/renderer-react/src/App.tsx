import SideMenu from './components/SideMenu'
import ThreadView from './components/ThreadView'
import Tree from './components/Tree'
import Search from './components/Search'
import Trash from './components/Trash'
import Closable from './components/Closable'
import { useState } from 'react'
import { Note, Thread } from '@prisma/client'

function App() {
  const [isSearchViewOpen, setIsSearchViewOpen] = useState(false)
  const [isTrashViewOpen, setIsTrashViewOpen] = useState(false)
  const [selection, setSelection] = useState<{
    thread: Thread | null
    note: Note | null
  }>({ thread: null, note: null })

  function onNoteInThreadClicked(note: Note) {
    setSelection({ ...selection, note })
  }

  return (
    <div className="grid h-screen grid-rows-[auto_minmax(0,_1fr)]">
      <div>
        <button type="button">メニュー</button>
        <input type="text" placeholder="検索..." />
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

        {isSearchViewOpen && (
          <Closable onClose={() => setIsSearchViewOpen(false)}>
            <Search />
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
