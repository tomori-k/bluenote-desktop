type EditorProps = {
  text: string
  onTextChange: (text: string) => void
  onCreateClicked: () => void
}

export default function Editor({
  text,
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
        追加
      </button>
    </div>
  )
}
