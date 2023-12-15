export default function Trash() {
  let listItems = []

  for (let i = 0; i < 100; i++) {
    listItems.push(<li key={i}>{i}</li>)
  }

  return (
    <div className="overflow-y-auto">
      Trash
      <ul>{listItems}</ul>
    </div>
  )
}
