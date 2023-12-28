import { Thread } from '@prisma/client'
import { memo, useEffect, useState } from 'react'
import ThreadIcon from './icons/ThreadIcon'
import AddIcon from './icons/AddIcon'
import MoreVerticalIcon from './icons/MoreVerticalIcon'
import SettingsIcon from './icons/SettingsIcon'
import DeleteIcon from './icons/DeleteIcon'

type ContextMenuPosition = {
  left: number
  top: number
}

type ContextMenuProps = {
  position: ContextMenuPosition
  children: React.ReactNode
  onClose: () => void
}

export function ContextMenu({ position, children, onClose }: ContextMenuProps) {
  return (
    <div
      className="absolute left-0 top-0 z-10 h-screen w-screen"
      onClick={onClose}
    >
      <div
        className="dark:bg-midnight-800 dark:border-midnight-600 absolute rounded-md border"
        style={{ left: `${position.left}px`, top: `${position.top}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

type ContextMenuItemProps = {
  children: React.ReactNode
  onClick?: () => void
}

export function ContextMenuItem({ children, onClick }: ContextMenuItemProps) {
  return (
    <li
      className="hover:dark:bg-midnight-500 px-4 py-1 text-sm first:pt-2 last:pb-2"
      onClick={onClick}
    >
      {children}
    </li>
  )
}

type RadioButtonWithCheckmarkProps = {
  name: string
  value: string
  label: string
  checked: boolean
  onChange: () => void
}

function RadioButtonWithCheckmark({
  name,
  value,
  label,
  checked,
  onChange,
}: RadioButtonWithCheckmarkProps) {
  return (
    <label className="flex items-center justify-between gap-10" htmlFor={value}>
      {label}
      <input
        className="invisible checked:visible"
        name={name}
        id={value}
        type="radio"
        checked={checked}
        onChange={onChange}
      />
    </label>
  )
}

type SideMenuLiProps = {
  children: React.ReactNode
  onClick: () => void
}

/**
 * サイドメニューのトップレベル li 要素
 * @param props
 */
function SideMenuLi({ children, onClick }: SideMenuLiProps) {
  return (
    <li
      className="hover:dark:bg-midnight-800 flex h-8 items-center gap-4 rounded-md px-3 text-sm"
      onClick={onClick}
    >
      {children}
    </li>
  )
}

type ThreadWithState = Thread & { isRenaming: boolean }
type SideMenuProps = {
  selectedThraed: Thread | null
  onThreadSelected: (thread: Thread) => void
  onTrashClicked: () => void
  onSettingsClicked: () => void
}

export default memo(function SideMenu({
  selectedThraed,
  onThreadSelected,
  onTrashClicked,
  onSettingsClicked,
}: SideMenuProps) {
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
    e.stopPropagation()

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

  async function onThreadDisplayModeChanged(mode: 'monologue' | 'scrap') {
    if (contextMenuState == null) return

    try {
      const updated = await window.api.changeThreadDisplayMode(
        contextMenuState.thread,
        mode
      )
      const updatedWithState = { ...updated, isRenaming: false }

      setThreads(
        threads.map((x) => {
          if (x.id !== contextMenuState.thread.id) return x
          return updatedWithState
        })
      )
      setContextMenuState({ ...contextMenuState, thread: updatedWithState })
      // 現在表示中のスレッドなら、新しくそのスレッドが選択されたことにして再読み込みする
      onThreadSelected(updatedWithState)
    } catch (e) {
      setHasErrorOccured(true)
    }
  }

  return (
    <div className="text-midnight-50 bg-midnight-300 dark:bg-midnight-950 px-2">
      <div className="flex h-11 items-center justify-between">
        <h2 className="flex items-center gap-3 pl-2 text-base">
          <ThreadIcon />
          スレッド
        </h2>
        <button
          className="hover:dark:bg-midnight-800 rounded-md p-2"
          type="button"
          onClick={onNewThreadClicked}
        >
          <AddIcon />
        </button>
      </div>

      {hasErrorOccured && <p className="text-red-600">問題が発生しました</p>}

      <ul>
        {threads.map((thread) => {
          return (
            <li
              className={
                'flex items-center justify-between rounded-md px-3 py-1 text-sm' +
                (thread === selectedThraed
                  ? ' dark:bg-midnight-500'
                  : ' hover:dark:bg-midnight-800')
              }
              key={thread.id}
              onClick={() => onThreadSelected(thread)}
            >
              {!thread.isRenaming && thread.name}
              {thread.isRenaming && (
                <input
                  className="bg-midnight-300 dark:bg-midnight-950 focus:border-midnight-200 focus:dark:border-midnight-600 rounded-md focus:border focus:outline-none"
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
                  autoFocus
                />
              )}
              <button
                className="pl-2 pr-1"
                type="button"
                onClick={(e) => onThreadMenuClicked(e, thread)}
              >
                <MoreVerticalIcon />
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
              <ContextMenuItem onClick={onRenameClicked}>
                名前変更
              </ContextMenuItem>
              <ContextMenuItem onClick={onRemoveClicked}>
                ごみ箱に移動
              </ContextMenuItem>
              <ContextMenuItem>
                <RadioButtonWithCheckmark
                  name="thread-display-mode"
                  value="monologue"
                  label="Monologue"
                  checked={contextMenuState.thread.displayMode === 'monologue'}
                  onChange={() => onThreadDisplayModeChanged('monologue')}
                />
              </ContextMenuItem>
              <ContextMenuItem>
                <RadioButtonWithCheckmark
                  name="thread-display-mode"
                  value="scrap"
                  label="Scrap"
                  checked={contextMenuState.thread.displayMode === 'scrap'}
                  onChange={() => onThreadDisplayModeChanged('scrap')}
                />
              </ContextMenuItem>
            </ul>
          </ContextMenu>
        )}
      </ul>

      <hr className="dark:bg-midnight-700 my-3 h-px border-0" />

      <ul>
        <SideMenuLi onClick={onTrashClicked}>
          <DeleteIcon className="fill-midnight-50" />
          ごみ箱
        </SideMenuLi>
        <SideMenuLi onClick={onSettingsClicked}>
          <SettingsIcon className="h-4 w-4" />
          設定
        </SideMenuLi>
      </ul>
    </div>
  )
})
