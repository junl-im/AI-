export const MAX_DUBBING_SCRIPT_LENGTH = 20_000

const SUBTITLE_TIMECODE = /\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3}\s*-->\s*\d{1,2}:\d{2}/

export function looksLikeSubtitleScript(raw: string, filename = ''): boolean {
  const normalized = raw.replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '')
  return /\.(srt|vtt)$/i.test(filename)
    || /(?:^|\n)WEBVTT(?:\n|$)/.test(normalized)
    || SUBTITLE_TIMECODE.test(normalized)
}

export function normalizeImportedScript(raw: string, filename = ''): string {
  const normalized = raw.replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '')
  if (!looksLikeSubtitleScript(normalized, filename)) {
    return normalized.slice(0, MAX_DUBBING_SCRIPT_LENGTH)
  }

  const lines = normalized.split('\n')
  const cleaned = lines.flatMap((line) => {
    const value = line.trim()
    if (!value || value === 'WEBVTT' || /^\d+$/.test(value)) return []
    if (/^\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3}\s*-->/.test(value)) return []
    if (/^(NOTE|STYLE|REGION)(\s|$)/.test(value)) return []
    return [value.replace(/<[^>]+>/g, '')]
  })
  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').slice(0, MAX_DUBBING_SCRIPT_LENGTH)
}

export function polishScriptForSpeech(raw: string): string {
  const normalized = normalizeImportedScript(raw)
  const lines = normalized.split('\n').flatMap((line) => {
    let value = line.replace(/[\t ]+$/g, '').replace(/^[\t ]+/g, '')
    if (!value) return ['']
    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(value)) return []
    value = value
      .replace(/^#{1,6}\s+/, '')
      .replace(/^>\s?/, '')
      .replace(/^[-*+]\s+/, '')
      .replace(/^\d{1,3}[.)]\s+/, '')
    return [value]
  })
  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_DUBBING_SCRIPT_LENGTH)
}

export function countDetectedSpeakers(raw: string): number {
  const labels = new Set<string>()
  for (const line of raw.split(/\r?\n/)) {
    const match = line.trim().match(/^([^:：\n]{1,18})[:：]\s+\S/)
    if (!match) continue
    const label = match[1].trim()
    if (/^[\d\s.,!?]+$/.test(label)) continue
    labels.add(label)
  }
  return labels.size >= 2 ? labels.size : 0
}
