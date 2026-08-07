import { describe, expect, it } from 'vitest'
import { compareRuntimeSoakReports, parseRuntimeSoakReport } from './runtimeSoakReport'

function report(latency: number, successRate = 1) {
  return parseRuntimeSoakReport(JSON.stringify({
    schema_version: 'runtime-soak/2',
    app_version: '0.10.7',
    completed_at: '2026-08-07T00:00:00+00:00',
    status: 'passed',
    report_sha256: 'a'.repeat(64),
    targets: {
      api: {
        success_rate: successRate,
        p95_latency_ms: latency,
        memory_growth_mb: 1,
        open_file_descriptors_growth: 0,
        p95_recovery_seconds: 2,
      },
    },
  }))
}

describe('runtime soak comparison', () => {
  it('detects the same latency regression threshold as the API report', () => {
    const comparison = compareRuntimeSoakReports(report(20), report(180))
    expect(comparison.status).toBe('regressed')
    expect(comparison.reasons[0]).toContain('P95 응답')
  })

  it('keeps stable reports green', () => {
    expect(compareRuntimeSoakReports(report(20), report(22)).status).toBe('stable')
  })
})
