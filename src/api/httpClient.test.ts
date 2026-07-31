import { describe, expect, it } from 'vitest'
import { normalizeApiBaseUrl } from './httpClient'

describe('normalizeApiBaseUrl', () => {
  it('adds the API version path to a server origin', () => {
    expect(normalizeApiBaseUrl('http://127.0.0.1:8000/')).toBe('http://127.0.0.1:8000/api/v1')
  })

  it('does not duplicate an existing API path', () => {
    expect(normalizeApiBaseUrl('https://voice.example.com/api/v1')).toBe('https://voice.example.com/api/v1')
  })
})
