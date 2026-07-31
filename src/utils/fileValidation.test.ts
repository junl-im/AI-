import { describe, expect, it } from 'vitest'
import { validateVoiceSample } from './fileValidation'

describe('validateVoiceSample', () => {
  it('accepts a normal wav file', () => {
    const result = validateVoiceSample({ name: 'voice.wav', type: 'audio/wav', size: 1024 })
    expect(result.valid).toBe(true)
  })

  it('rejects files larger than 25MB', () => {
    const result = validateVoiceSample({ name: 'large.wav', type: 'audio/wav', size: 26 * 1024 * 1024 })
    expect(result.valid).toBe(false)
    expect(result.message).toContain('25MB')
  })

  it('rejects unsupported formats', () => {
    const result = validateVoiceSample({ name: 'note.txt', type: 'text/plain', size: 200 })
    expect(result.valid).toBe(false)
  })
})
