import { Thread } from '@prisma/client'
import { useEffect, useState } from 'react'

type ContextMenuPosition = {
  left: number
  top: number
}

type ContextMenuProps = {
  position: ContextMenuPosition
  children: React.ReactNode
  onClose: () => void
}

function ContextMenu({ position, children, onClose }: ContextMenuProps) {
  return (
    <div className="absolute left-0 top-0 h-screen w-screen" onClick={onClose}>
      <div
        className="absolute"
        style={{ left: `${position.left}px`, top: `${position.top}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

type ThreadWithState = Thread & { isRenaming: boolean }

export default function SideMenu() {
  const [threads, setThreads] = useState<ThreadWithState[]>([])
  const [hasErrorOccured, setHasErrorOccured] = useState(false)
  const [contextMenuState, setContextMenuState] = useState<{
    left: number
    top: number
    thread: ThreadWithState
  } | null>(null)
  const [newThreadName, setNewThreadName] = useState('')

  useEffect(() => {
    async function loadThreads() {
      try {
        const threads = await window.api.getAllThreads()
        setThreads(threads.map((x) => ({ ...x, isRenaming: false })))
      } catch (e) {
        setHasErrorOccured(true)
      }
    }

    loadThreads()

    return () => {
      /* cancel する仕組みがないので一旦何もしない */
    }
  }, [])

  async function onNewThreadClicked() {
    try {
      const created = await window.api.createThread({ name: '新規スレッド' })
      setThreads([...threads, { ...created, isRenaming: false }])
    } catch (e) {
      setHasErrorOccured(true)
    }
  }

  function onThreadMenuClicked(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    thread: ThreadWithState
  ) {
    const bounds = e.currentTarget.getBoundingClientRect()

    setContextMenuState({
      left: bounds.left + bounds.width,
      top: bounds.top,
      thread: thread,
    })
  }

  function onRenameClicked() {
    if (contextMenuState == null) return

    setThreads(
      threads.map((x) => {
        if (x !== contextMenuState.thread) return x
        return { ...x, isRenaming: true }
      })
    )
    setNewThreadName(contextMenuState.thread.name)
    setContextMenuState(null)
  }

  async function onRemoveClicked() {
    if (contextMenuState == null) return

    try {
      await window.api.removeThread(contextMenuState.thread.id)
      setThreads(threads.filter((x) => x !== contextMenuState.thread))
    } catch (e) {
      setHasErrorOccured(true)
    } finally {
      setContextMenuState(null)
    }
  }

  async function onRenameInputBlur(thread: ThreadWithState) {
    try {
      const renamed = await window.api.renameThread({
        ...thread,
        name: newThreadName,
      })
      setThreads(
        threads.map((x) => {
          if (x.id !== thread.id) return x
          return { ...renamed, isRenaming: false }
        })
      )
    } catch (_) {
      // エラーが発生したときはリネーム状態だけ元に戻す
      setHasErrorOccured(true)
      setThreads(
        threads.map((x) => {
          if (x.id !== thread.id) return x
          return { ...x, isRenaming: false }
        })
      )
    }
  }

  return (
    <div>
      <div className="flex">
        <h2>スレッド</h2>
        <button type="button" onClick={onNewThreadClicked}>
          新規スレッド
        </button>
      </div>

      {hasErrorOccured && <p className="text-red-600">問題が発生しました</p>}

      <ul>
        {threads.map((thread) => {
          return (
            <li key={thread.id}>
              {!thread.isRenaming && thread.name}
              {thread.isRenaming && (
                <input
                  type="text"
                  placeholder="スレッド名"
                  value={newThreadName}
                  onChange={(e) => setNewThreadName(e.target.value)}
                  onKeyUp={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      e.currentTarget.blur()
                    }
                  }}
                  onBlur={() => onRenameInputBlur(thread)}
                />
              )}
              <button
                type="button"
                onClick={(e) => onThreadMenuClicked(e, thread)}
              >
                ...
              </button>
            </li>
          )
        })}

        {contextMenuState && (
          <ContextMenu
            position={contextMenuState}
            onClose={() => setContextMenuState(null)}
          >
            <ul>
              <li onClick={onRenameClicked}>名前変更</li>
              <li onClick={onRemoveClicked}>ごみ箱に移動</li>
            </ul>
          </ContextMenu>
        )}
      </ul>

      <ul>
        <li>ごみ箱</li>
        <li>設定</li>
      </ul>
    </div>
  )
}
