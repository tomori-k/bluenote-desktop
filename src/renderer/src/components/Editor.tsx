import EditIcon from './icons/EditIcon'

export enum EditorMode {
  Create,
  Edit,
}

type EditorProps = {
  text: string
  editorMode: EditorMode
  onTextChange: (text: string) => void
  onCreateClicked: () => void
}

export default function Editor({
  text,
  editorMode,
  onTextChange,
  onCreateClicked,
}: EditorProps) {
  return (
    <div className="border-t-midnight-100 relative border-t dark:border-t-0">
      <textarea
        className="bg-midnight-50 dark:bg-midnight-900 block h-40 w-full resize-none pl-4 pt-3 font-mono text-sm outline-none"
        itemType="text"
        placeholder="メモを入力"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
      />
      <div className="hover:dark:bg-midnight-800 absolute bottom-2 right-2 rounded-md p-3">
        <button
          className="flex items-center gap-3 text-sm"
          type="button"
          onClick={onCreateClicked}
        >
          <EditIcon className="fill-midnight-400 dark:fill-midnight-50 w-5 marker:h-5" />
          {editorMode === EditorMode.Create ? '追加' : '編集'}
        </button>
      </div>
    </div>
  )
}
