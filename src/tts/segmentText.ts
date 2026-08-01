const SENTENCE_BOUNDARY = /(?<=[.!?。！？])\s+/

function splitOversized(text: string, maxChars: number): string[] {
  const output: string[] = []
  let remaining = text.trim()

  while (remaining.length > maxChars) {
    const window = remaining.slice(0, maxChars + 1)
    const splitAt = Math.max(window.lastIndexOf(', '), window.lastIndexOf('; '), window.lastIndexOf(' '))
    const safeSplit = splitAt < Math.floor(maxChars / 2) ? maxChars : splitAt
    output.push(remaining.slice(0, safeSplit).trim())
    remaining = remaining.slice(safeSplit).trim()
  }

  if (remaining) output.push(remaining)
  return output
}

export function splitTextForUi(text: string, maxChars = 180): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return []

  return cleaned
    .split(SENTENCE_BOUNDARY)
    .flatMap((sentence) => splitOversized(sentence, maxChars))
    .filter(Boolean)
}
