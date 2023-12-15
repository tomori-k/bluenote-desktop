export default function Editor() {
  return (
    <div className="grid grid-cols-[1fr_auto]">
      <textarea
        className="resize-none"
        itemType="text"
        placeholder="メモを入力"
      />
      <button type="button">追加</button>
    </div>
  )
}
