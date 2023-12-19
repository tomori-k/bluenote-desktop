import CloseIcon from './icons/CloseIcon'

type Props = {
  children: React.ReactNode
  header: React.ReactNode
  onClose: () => void
}

export default function Closable({ header, children, onClose }: Props) {
  return (
    <div className="dark:bg-midnight-800 dark:border-l-midnight-600 border-l-midnight-100 divide-midnight-100 dark:divide-midnight-600 grid grid-rows-[auto_minmax(0,_1fr)] divide-y border-l">
      <div className="text-midnight-400 dark:text-midnight-50 flex h-11 items-center justify-between">
        {header}
        <button className="px-5" type="button" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      {children}
    </div>
  )
}
