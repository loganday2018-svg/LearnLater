import ItemCard from './ItemCard'

export default function ItemList({ items, onDelete }) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>No items saved yet.</p>
        <p>Tap "+ Add New" to save your first link or note!</p>
      </div>
    )
  }

  return (
    <div className="item-list">
      {items.map(item => (
        <ItemCard key={item.id} item={item} onDelete={onDelete} />
      ))}
    </div>
  )
}
