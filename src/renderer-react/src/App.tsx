import SideMenu from './components/SideMenu'
import ThreadView from './components/ThreadView'
import Tree from './components/Tree'
import Search from './components/Search'
import Trash from './components/Trash'
import Closable from './components/Closable'
import { useState } from 'react'
import { Thread } from '@prisma/client'

function App() {
  const [isTreeViewOpen, setIsTreeViewOpen] = useState(false)
  const [isSearchViewOpen, setIsSearchViewOpen] = useState(false)
  const [isTrashViewOpen, setIsTrashViewOpen] = useState(false)
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)

  return (
    <div className="grid h-screen grid-rows-[auto_minmax(0,_1fr)]">
      <div>
        <button type="button">メニュー</button>
        <input type="text" placeholder="検索..." />
      </div>
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] grid-rows-[minmax(0,_1fr)]">
        <SideMenu onThreadSelected={(x) => setSelectedThread(x)} />
        <ThreadView thread={selectedThread} key={selectedThread?.id} />

        {isTreeViewOpen && (
          <Closable onClose={() => setIsTreeViewOpen(false)}>
            <Tree />
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
