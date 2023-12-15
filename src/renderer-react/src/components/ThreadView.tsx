import Editor from './Editor'

export default function ThreadView() {
  let listItems = []

  for (let i = 0; i < 100; i++) {
    listItems.push(<li key={i}>{i}</li>)
  }

  return (
    <div className="grid grid-rows-[minmax(0,_1fr)_auto]">
      <div className="overflow-y-auto">
        ThreadView
        <ul>{listItems}</ul>
      </div>
      <Editor />
    </div>
  )
}
