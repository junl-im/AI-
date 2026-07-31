function normalizeFilenamePart(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36)
}

export function buildAudioFilename(text: string, voiceName: string, extension = 'wav'): string {
  const textPart = normalizeFilenamePart(text) || '새-음성'
  const voicePart = normalizeFilenamePart(voiceName) || 'sorion'
  const datePart = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  const safeExtension = extension.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'wav'
  return `SoriON-${datePart}-${voicePart}-${textPart}.${safeExtension}`
}

export function downloadAudioFile(url: string, filename: string): void {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}
