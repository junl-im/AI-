import { describe, expect, it } from 'vitest'
import {
  buildRuntimeSoakComparisonEvidence,
  compareRuntimeSoakReports,
  parseRuntimeSoakReport,
} from './runtimeSoakReport'

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

it('comparison evidence keeps source filenames and hashes as provenance', () => {
  const previous = report(20)
  const current = report(21)
  const comparison = compareRuntimeSoakReports(previous, current)
  const previousProvenance = {
    file_name: 'previous.json',
    file_sha256: '1'.repeat(64),
    report_sha256: previous.report_sha256,
    app_version: previous.app_version,
    completed_at: previous.completed_at,
    loaded_at: '2026-08-07T01:00:00Z',
  }
  const currentProvenance = {
    file_name: 'current.json',
    file_sha256: '2'.repeat(64),
    report_sha256: current.report_sha256,
    app_version: current.app_version,
    completed_at: current.completed_at,
    loaded_at: '2026-08-07T02:00:00Z',
  }
  const evidence = buildRuntimeSoakComparisonEvidence(
    previousProvenance,
    currentProvenance,
    comparison,
    '2026-08-07T03:00:00Z',
  )

  expect(evidence.schema_version).toBe('runtime-soak-comparison/1')
  expect(evidence.previous.file_name).toBe('previous.json')
  expect(evidence.current.file_sha256).toBe('2'.repeat(64))
  expect(evidence.compared_at).toBe('2026-08-07T03:00:00Z')
})
