export async function runBoundedOrderedBatch<T, R>(
  items: readonly T[],
  maxConcurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  isCancelled: () => boolean = () => false,
): Promise<Array<R | undefined>> {
  if (items.length === 0) return []
  const concurrency = Math.max(1, Math.min(items.length, Math.floor(maxConcurrency) || 1))
  const results = new Array<R | undefined>(items.length)
  let cursor = 0

  const runWorker = async () => {
    while (!isCancelled()) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      results[index] = await worker(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, runWorker))
  return results
}
