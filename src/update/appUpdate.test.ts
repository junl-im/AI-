import { describe, expect, it, vi } from 'vitest'
import { fetchRemoteBuildInfo } from './appUpdate'

const manifest = {
  schemaVersion: 1,
  appVersion: '0.10.0',
  heartbeat: '6.8.4',
  revision: 'abc123',
  buildId: 'build-abc123',
}

describe('appUpdate', () => {
  it('loads a no-store build manifest', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(manifest), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    await expect(fetchRemoteBuildInfo(fetcher, 'https://example.com/version.json')).resolves.toEqual(manifest)
    expect(fetcher).toHaveBeenCalledWith('https://example.com/version.json', expect.objectContaining({
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    }))
  })

  it('rejects an invalid build manifest', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ buildId: '' }), {
      status: 200,
    }))
    await expect(fetchRemoteBuildInfo(fetcher, 'https://example.com/version.json')).rejects.toThrow('형식')
  })
})
