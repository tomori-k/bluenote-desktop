import EditIcon from './icons/EditIcon'

export enum EditorMode {
  Create,
  Edit,
}

export type EditorState = {
  text: string
  selectionStart: number
  selectionEnd: number
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
  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onTextChange(e.currentTarget.value)
  }

  function onTab(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    e.preventDefault()

    const textarea = e.currentTarget

    // 選択範囲がない場合: タブの挿入
    if (textarea.selectionStart === textarea.selectionEnd) {
      const cursor = textarea.selectionStart
      const left = textarea.value.slice(0, textarea.selectionStart)
      const right = textarea.value.slice(textarea.selectionStart)
      const newText = left + '\t' + right

      textarea.value = newText
      textarea.selectionEnd = cursor + 1
    }
    // 選択範囲がある場合: インデントを上げる
    else {
      // 元の選択範囲を保存しておく
      const cursorStart = textarea.selectionStart
      const cursorEnd = textarea.selectionEnd

      // 選択範囲を含む行をすべて取得

      // selection.start を含む行の先頭文字のインデックス
      const start =
        textarea.value.lastIndexOf('\n', textarea.selectionStart) + 1
      // selection.end を含む行とその次の行の間の改行文字のインデックス
      // 存在しなければ文字列の最後
      const end = (function () {
        const nextNewLineIndex = textarea.value.indexOf(
          '\n',
          textarea.selectionEnd
        )
        return nextNewLineIndex != -1 ? nextNewLineIndex : textarea.value.length
      })()

      const lines = textarea.value.slice(start, end).split('\n')
      const newText = lines.map((x) => '\t' + x).join('\n')

      // [start, end) の範囲を newText で更新
      textarea.value =
        textarea.value.slice(0, start) + newText + textarea.value.slice(end)

      // 選択範囲を設定しなおす
      // 選択範囲の開始インデックスは、先頭にタブ文字を1つ挿入するので1ずらす
      // 選択範囲の終了インデックスは、加えたタブ文字の数だけずらす
      textarea.selectionStart = cursorStart + 1
      textarea.selectionEnd = cursorEnd + lines.length
    }
  }

  function onShiftTab(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    e.preventDefault()

    // インデントを下げる

    const textarea = e.currentTarget

    // 元の選択範囲を保存しておく
    const cursorStart = textarea.selectionStart
    const cursorEnd = textarea.selectionEnd

    // 選択範囲を含む行をすべて取得

    // selection.start を含む行の先頭文字のインデックス
    const start = textarea.value.lastIndexOf('\n', textarea.selectionStart) + 1
    // selection.end を含む行とその次の行の間の改行文字のインデックス
    // 存在しなければ文字列の最後
    const end = (function () {
      const nextNewLineIndex = textarea.value.indexOf(
        '\n',
        textarea.selectionEnd
      )
      return nextNewLineIndex != -1 ? nextNewLineIndex : textarea.value.length
    })()

    const lines = textarea.value.slice(start, end).split('\n')
    const removedTabOnFirstLine = lines[0].startsWith('\t')
    const removedTabCount = lines
      .map((x) => (x.startsWith('\t') ? 1 : 0))
      .reduce((a, b) => a + b, 0 as number)
    const newText = lines
      .map((x) => (x.startsWith('\t') ? x.slice(1) : x))
      .join('\n')

    // [start, end) の範囲を newText で更新
    textarea.value =
      textarea.value.slice(0, start) + newText + textarea.value.slice(end)

    // 選択範囲を設定しなおす
    // 選択範囲の開始インデックスは、先頭のタブ文字を削除した場合1ずらす
    // 選択範囲の終了インデックスは、減らしたタブ文字の数だけずらす
    textarea.selectionStart = cursorStart - (removedTabOnFirstLine ? 1 : 0)
    textarea.selectionEnd = cursorEnd - removedTabCount
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    switch (e.key) {
      case 'Tab':
        if (e.shiftKey) onShiftTab(e)
        else onTab(e)
        break
      default:
        break
    }
  }

  return (
    <div className="border-t-midnight-100 relative border-t dark:border-t-0">
      <textarea
        className="bg-midnight-50 dark:bg-midnight-900 block h-40 w-full resize-none pl-4 pt-3 font-mono text-sm outline-none"
        itemType="text"
        placeholder="メモを入力"
        value={text}
        // ref={refTextarea}
        onChange={onChange}
        onKeyDown={onKeyDown}
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
