import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadExportArchiveReceipts, preserveExportByDownload, removeExportArchiveReceipt } from './exportArchive'

const result = {
  audioUrl: 'https://voice.example/api/v1/audio/final.wav',
  srtUrl: 'https://voice.example/api/v1/audio/final.srt',
  vttUrl: 'https://voice.example/api/v1/audio/final.vtt',
  outputFormat: 'wav' as const,
  durationSeconds: 60,
  skippedSegments: 0,
  message: 'ok',
  serverExpiresAt: '2026-08-03T06:00:00Z',
  serverRetentionMinutes: 30,
  preservationMode: 'download-only' as const,
}

describe('export archive policy', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    vi.useFakeTimers()
  })

  it('records only local download metadata, not audio content', () => {
    const receipt = preserveExportByDownload(result)
    vi.runAllTimers()
    expect(receipt.filenames).toEqual(['final.wav', 'final.srt', 'final.vtt'])
    expect(loadExportArchiveReceipts()).toHaveLength(1)
    expect(JSON.stringify(receipt)).not.toContain('voice.example')
  })

  it('deletes a local preservation receipt without touching server files', () => {
    const receipt = preserveExportByDownload(result)
    expect(removeExportArchiveReceipt(receipt.id)).toEqual([])
  })
})
