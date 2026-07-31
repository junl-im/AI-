const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/mp4',
  'audio/x-m4a',
])

const MAX_AUDIO_BYTES = 25 * 1024 * 1024

export interface FileValidationResult {
  valid: boolean
  message: string
}

export function validateVoiceSample(file: Pick<File, 'size' | 'type' | 'name'>): FileValidationResult {
  if (file.size === 0) return { valid: false, message: '비어 있는 파일은 사용할 수 없습니다.' }
  if (file.size > MAX_AUDIO_BYTES) return { valid: false, message: '음성 파일은 25MB 이하만 사용할 수 있습니다.' }
  if (!ALLOWED_AUDIO_TYPES.has(file.type)) {
    return { valid: false, message: 'MP3, WAV, FLAC 또는 M4A 파일을 선택해 주세요.' }
  }
  return { valid: true, message: `${file.name} 파일을 사용할 수 있습니다.` }
}
