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
    <div className="grid grid-cols-[1fr_auto]">
      <textarea
        className="resize-none"
        itemType="text"
        placeholder="メモを入力"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
      />
      <button type="button" onClick={onCreateClicked}>
        {editorMode === EditorMode.Create ? '追加' : '編集'}
      </button>
    </div>
  )
}
