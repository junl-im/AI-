export function alignItemsById<T extends { id: string }>(
  items: readonly T[],
  orderedIds: readonly string[],
): T[] {
  const order = new Map(orderedIds.map((id, index) => [id, index]))
  const ordered = items
    .filter((item) => order.has(item.id))
    .sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0))
  if (ordered.length < 2) return [...items]

  let cursor = 0
  return items.map((item) => order.has(item.id) ? ordered[cursor++] : item)
}
