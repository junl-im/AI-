import { afterEach, describe, expect, it, vi } from 'vitest'
import { readEvidenceFile } from './evidenceIntake'

describe('evidenceIntake', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reads an evidence JSON object', async () => {
    const file = new File(['{"schema_version":"2"}'], 'evidence.json', { type: 'application/json' })
    await expect(readEvidenceFile(file)).resolves.toMatchObject({ schema_version: '2' })
  })

  it('rejects arrays and oversized files', async () => {
    await expect(readEvidenceFile(new File(['[]'], 'array.json'))).rejects.toThrow('객체')
    const oversized = { size: 5 * 1024 * 1024 + 1, text: vi.fn() } as unknown as File
    await expect(readEvidenceFile(oversized)).rejects.toThrow('5MiB')
  })
})
