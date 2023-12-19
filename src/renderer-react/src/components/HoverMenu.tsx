export function HoverMenu({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <ul
      className={
        className +
        ' bg-midnight-400 dark:bg-midnight-800 dark:border-midnight-600 z-10 flex h-9 items-center rounded-md dark:border'
      }
    >
      {children}
    </ul>
  )
}

export function HoverMenuItem({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <li
      className="hover:bg-midnight-300 hover:dark:bg-midnight-600 flex h-full items-center rounded-md px-3"
      onClick={onClick}
    >
      {children}
    </li>
  )
}
