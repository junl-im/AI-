import { describe, expect, it } from 'vitest'
import { buildAudioFilename } from './audioFile'

describe('buildAudioFilename', () => {
  it('creates a safe Korean WAV filename', () => {
    const filename = buildAudioFilename('안녕하세요: 소리온 / 테스트?', '소리', 'wav')

    expect(filename).toMatch(/^SoriON-\d{8}-소리-/)
    expect(filename.endsWith('.wav')).toBe(true)
    expect(filename).not.toMatch(/[\\/:*?"<>|]/)
  })

  it('falls back when text and extension are empty', () => {
    expect(buildAudioFilename('   ', '', '')).toMatch(/새-음성\.wav$/)
  })
})
