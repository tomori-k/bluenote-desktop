import Editor from './Editor'

export default function Tree() {
  let listItems = []

  for (let i = 0; i < 100; i++) {
    listItems.push(<li key={i}>{i}</li>)
  }

  return (
    <div className="grid grid-rows-[1fr_auto]">
      <div className="overflow-y-auto">
        Tree
        <ul>{listItems}</ul>
      </div>
      <Editor />
    </div>
  )
}
