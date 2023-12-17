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
    <div className="relative">
      <textarea
        className="bg-midnight-900 h-40 w-full resize-none pl-4 pt-3 font-mono text-sm outline-none"
        itemType="text"
        placeholder="メモを入力"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
      />
      <div className="absolute bottom-0 right-0 p-4">
        <button
          className="flex items-center gap-3 text-sm"
          type="button"
          onClick={onCreateClicked}
        >
          <EditIcon />
          {editorMode === EditorMode.Create ? '追加' : '編集'}
        </button>
      </div>
    </div>
  )
}
