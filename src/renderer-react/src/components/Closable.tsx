type Props = {
  children: React.ReactNode
  header: React.ReactNode
  onClose: () => void
}

export default function Closable({ header, children, onClose }: Props) {
  return (
    <div className="bg-midnight-800 grid grid-rows-[auto_minmax(0,_1fr)]">
      <div className="flex h-11 items-center justify-between">
        {header}
        <button type="button" onClick={onClose}>
          閉じる
        </button>
      </div>
      {children}
    </div>
  )
}
