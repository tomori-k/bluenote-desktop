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
        ' bg-midnight-800 border-midnight-600 z-10 flex h-9 items-center rounded-md border'
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
      className="hover:bg-midnight-600 flex h-full items-center px-3"
      onClick={onClick}
    >
      {children}
    </li>
  )
}
