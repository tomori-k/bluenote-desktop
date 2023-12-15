export default function Search() {
  let listItems = []

  for (let i = 0; i < 100; i++) {
    listItems.push(<li key={i}>{i}</li>)
  }

  return (
    <div className="overflow-y-auto">
      Search
      <ul>{listItems}</ul>
    </div>
  )
}
