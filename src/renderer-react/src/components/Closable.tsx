type Props = {
  children: React.ReactNode
  onClose: () => void
}

export default function Closable({ children, onClose }: Props) {
  return (
    <div className="grid grid-rows-[auto_minmax(0,_1fr)]">
      <div>
        Closable View
        <button type="button" onClick={onClose}>
          閉じる
        </button>
      </div>
      {children}
    </div>
  )
}
