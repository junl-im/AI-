import { describe, expect, it } from 'vitest'
import { buildLocalExportBundle, validateLocalBundleFiles } from './localExportBundle'

describe('localExportBundle', () => {
  it('creates a stored ZIP with a SHA-256 manifest', async () => {
    const files = [
      new File(['RIFFdemo'], 'voice.wav', { type: 'audio/wav' }),
      new File(['WEBVTT\n'], 'subtitle.vtt', { type: 'text/vtt' }),
      new File(['{"valid":true}'], 'evidence.json', { type: 'application/json' }),
    ]
    const result = await buildLocalExportBundle(files)
    const bytes = new Uint8Array(await result.blob.arrayBuffer())
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04])
    expect(result.manifest.files).toHaveLength(3)
    expect(result.manifest.files.every((item) => /^[0-9a-f]{64}$/.test(item.sha256))).toBe(true)
    expect(new TextDecoder().decode(bytes)).toContain('sorion-bundle-manifest.json')
  })

  it('reports progress and honors cancellation', async () => {
    const progress: number[] = []
    const controller = new AbortController()
    const files = [new File(['one'], 'one.json', { type: 'application/json' }), new File(['two'], 'two.srt')]
    await buildLocalExportBundle(files, { onProgress: (item) => progress.push(item.processedFiles) })
    expect(progress).toEqual(expect.arrayContaining([0, 1, 2]))

    controller.abort()
    await expect(buildLocalExportBundle(files, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('rejects unsupported files', () => {
    expect(() => validateLocalBundleFiles([new File(['x'], 'script.exe')])).toThrow('지원하지 않는 파일 형식')
  })
})
