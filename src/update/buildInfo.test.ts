import { describe, expect, it } from 'vitest'
import { formatBuildLabel, isDifferentBuild, parseAppBuildInfo } from './buildInfo'

const valid = {
  schemaVersion: 1,
  appVersion: '0.9.7',
  heartbeat: '6.8.4',
  revision: 'abcdef123456',
  buildId: '0.9.7-6.8.4-abcdef123456',
} as const

describe('buildInfo', () => {
  it('accepts a complete build manifest', () => {
    expect(parseAppBuildInfo(valid)).toEqual(valid)
  })

  it('rejects malformed or incomplete manifests', () => {
    expect(parseAppBuildInfo([])).toBeNull()
    expect(parseAppBuildInfo({ ...valid, buildId: '' })).toBeNull()
    expect(parseAppBuildInfo({ ...valid, schemaVersion: 2 })).toBeNull()
  })

  it('detects a different deployment build', () => {
    const remote = { ...valid, revision: 'fedcba654321', buildId: 'next-build' }
    expect(isDifferentBuild(valid, remote)).toBe(true)
    expect(isDifferentBuild(valid, valid)).toBe(false)
  })

  it('formats a compact operator label', () => {
    expect(formatBuildLabel(valid)).toBe('v0.9.7')
  })
})
