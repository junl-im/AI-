export function formatBytes(value: number | null): string {
  if (value === null) return '측정 전'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

export function formatMilliseconds(value: number | null): string {
  if (value === null) return '측정 전'
  if (value < 1000) return `${value} ms`
  return `${(value / 1000).toFixed(2)}초`
}
