import { useState, useRef, useEffect } from 'react'

const WIDTH_RESIZER_PX = 4
const WIDTH_DEFAULT_TAB_PX = 200

export default function AppLayout({
  sideMenu,
  mainView,
  tabs,
}: {
  sideMenu: React.ReactNode | null
  mainView: React.ReactNode
  tabs: (React.ReactElement | null)[]
}) {
  // assertion
  for (const tab of tabs) {
    if (tab != null && tab.key == null) throw new Error('key must be specified')
  }

  const [sideMenuWidth, setSideMenuWidth] = useState(100)
  const [tabWidths, setTabWidths] = useState<
    Record<string, number | undefined>
  >({})
  const refTabs = useRef<([string, HTMLDivElement] | null)[]>([])
  const [isDraggingSideMenuResizer, setIsDraggingSideMenuResizer] =
    useState(false)
  const [isDraggingMainViewResizer, setIsDraggingMainViewResizer] =
    useState(false)
  const [resizingTabIndex, setResizingTabIndex] = useState<number | null>(null)

  const onResizeSideMenu = useRef((_: number) => {})
  const onResizeTabNextToMainView = useRef((_: number) => {})
  const onResizeTabNextToTab = useRef((_: number) => {})

  function getSideMenuAndResizerWidth() {
    return sideMenu != null ? sideMenuWidth + WIDTH_RESIZER_PX : 0
  }

  function getTabWidth(key: string) {
    return tabWidths[key] ?? WIDTH_DEFAULT_TAB_PX
  }

  const gridTemplateColumns =
    (sideMenu != null ? `${sideMenuWidth}px auto ` : '') +
    `1fr` +
    tabs
      .filter((tab) => tab != null) // 表示してるタブの分だけカラムを追加
      .map((tab) => ` auto ${getTabWidth(tab!.key!)}px`)
      .join('')

  function calculateTabWidthSum() {
    return tabs
      .filter((tab) => tab != null) // 表示してるタブの分だけ加算
      .map((tab) => getTabWidth(tab!.key!))
      .reduce((sum, w) => sum + w + WIDTH_RESIZER_PX, 0)
  }

  // Resizer の MouseMove イベントは、Resizer の上にポインタが
  // 載っていないときは発火しないため、Window の MouseMove,
  // MouseUp イベントを購読する

  function onMouseUpWindow(_: MouseEvent) {
    setIsDraggingSideMenuResizer(false)
    setIsDraggingMainViewResizer(false)
    setResizingTabIndex(null)
  }

  function onMouseMoveWindow(e: MouseEvent) {
    onResizeSideMenu.current(e.clientX)
    onResizeTabNextToMainView.current(e.clientX)
    onResizeTabNextToTab.current(e.clientX)
  }

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMoveWindow)
    window.addEventListener('mouseup', onMouseUpWindow)

    return () => {
      window.removeEventListener('mousemove', onMouseMoveWindow)
      window.removeEventListener('mouseup', onMouseUpWindow)
    }
  }, [])

  onResizeSideMenu.current = function onResizeSideMenu(mouseX: number) {
    if (!isDraggingSideMenuResizer) return

    const vw = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth || 0
    )

    const maxWidth = vw - calculateTabWidthSum() - WIDTH_RESIZER_PX
    const newWidth = Math.min(mouseX, maxWidth)

    setSideMenuWidth(newWidth)
  }

  onResizeTabNextToMainView.current = function onResizeTabNextToMainView(
    mouseX: number
  ) {
    if (!isDraggingMainViewResizer) return

    const refTab = refTabs.current[0]

    if (refTab == null) return

    const [key, tab] = refTab
    const tabWidth = getTabWidth(key)

    const vw = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth || 0
    )
    const maxWidth =
      vw - getSideMenuAndResizerWidth() - calculateTabWidthSum() + tabWidth
    const bounds = tab.getBoundingClientRect()
    const w = Math.min(Math.max(tabWidth + bounds.x - mouseX, 0), maxWidth)

    setTabWidths({ ...tabWidths, [key]: w })
  }

  onResizeTabNextToTab.current = function onResizeTabNextToTab(mouseX: number) {
    if (resizingTabIndex == null) return

    const splitterLeft = refTabs.current[resizingTabIndex - 1]
    const splitterRight = refTabs.current[resizingTabIndex]

    if (splitterLeft == null || splitterRight == null) return

    const [keyLeft, _] = splitterLeft
    const [keyRight, tabRight] = splitterRight

    const bounds = tabRight.getBoundingClientRect()
    const delta = bounds.x - mouseX

    if (delta >= 0) {
      const deltaActual = Math.min(getTabWidth(keyLeft), delta)

      setTabWidths({
        ...tabWidths,
        [keyLeft]: getTabWidth(keyLeft) - deltaActual,
        [keyRight]: getTabWidth(keyRight) + deltaActual,
      })
    } else {
      const deltaActual = Math.max(-getTabWidth(keyRight), delta)

      setTabWidths({
        ...tabWidths,
        [keyLeft]: getTabWidth(keyLeft) - deltaActual,
        [keyRight]: getTabWidth(keyRight) + deltaActual,
      })
    }
  }

  return (
    <div
      className="grid grid-rows-[minmax(0,_1fr)]"
      style={{
        gridTemplateColumns: gridTemplateColumns,
      }}
    >
      {sideMenu != null && (
        <>
          {sideMenu}
          <div
            className="dark:bg-midnight-950 w-2 cursor-col-resize"
            // ドラッグ時のゴーストを表示させたくないため
            // Mouse{Down,Up} イベントを駆使してドラッグ操作の検知を行う
            onMouseDown={() => setIsDraggingSideMenuResizer(true)}
          ></div>
        </>
      )}
      {mainView}
      {tabs
        .filter((tab) => tab != null)
        .map((tab, i) => [
          i === 0 ? (
            <div
              className="dark:bg-midnight-800 border-l-midnight-600 w-1 cursor-col-resize border-l"
              onMouseDown={() => setIsDraggingMainViewResizer(true)}
              ref={(elem) =>
                (refTabs.current[i] = elem != null ? [tab!.key!, elem] : null)
              }
            ></div>
          ) : (
            <div
              className="dark:bg-midnight-800 border-l-midnight-600 w-1 cursor-col-resize border-l"
              onMouseDown={() => setResizingTabIndex(i)}
              ref={(elem) =>
                (refTabs.current[i] = elem != null ? [tab!.key!, elem] : null)
              }
            ></div>
          ),
          tab,
        ])
        .flatMap((x) => x)}
    </div>
  )
}
