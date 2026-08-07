export interface RuntimeSoakTargetSummary {
  success_rate: number
  p95_latency_ms: number | null
  memory_growth_mb: number | null
  open_file_descriptors_growth: number | null
  p95_recovery_seconds: number | null
}

export interface RuntimeSoakReport {
  schema_version: string
  app_version: string
  completed_at: string
  status: 'passed' | 'warning' | 'failed'
  report_sha256: string
  targets: Record<string, RuntimeSoakTargetSummary>
}

export interface RuntimeSoakTargetComparison {
  target: string
  status: 'stable' | 'regressed' | 'new' | 'missing'
  reasons: string[]
  previous: RuntimeSoakTargetSummary | null
  current: RuntimeSoakTargetSummary | null
}

export interface RuntimeSoakComparison {
  status: 'stable' | 'regressed'
  reasons: string[]
  targets: RuntimeSoakTargetComparison[]
}

function numeric(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function parseTarget(value: unknown): RuntimeSoakTargetSummary | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  const successRate = numeric(item.success_rate)
  if (successRate === null) return null
  return {
    success_rate: successRate,
    p95_latency_ms: numeric(item.p95_latency_ms),
    memory_growth_mb: numeric(item.memory_growth_mb),
    open_file_descriptors_growth: numeric(item.open_file_descriptors_growth),
    p95_recovery_seconds: numeric(item.p95_recovery_seconds),
  }
}

export function parseRuntimeSoakReport(text: string): RuntimeSoakReport {
  const parsed = JSON.parse(text) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('runtime soak JSON 객체가 필요합니다.')
  }
  const value = parsed as Record<string, unknown>
  if (value.schema_version !== 'runtime-soak/2') {
    throw new Error('runtime-soak/2 보고서만 비교할 수 있습니다.')
  }
  if (!value.targets || typeof value.targets !== 'object') {
    throw new Error('soak target 요약이 없습니다.')
  }
  const targets: Record<string, RuntimeSoakTargetSummary> = {}
  for (const [key, target] of Object.entries(value.targets as Record<string, unknown>)) {
    const parsed = parseTarget(target)
    if (parsed) targets[key] = parsed
  }
  if (!Object.keys(targets).length) throw new Error('비교 가능한 soak target이 없습니다.')
  return {
    schema_version: 'runtime-soak/2',
    app_version: String(value.app_version ?? ''),
    completed_at: String(value.completed_at ?? ''),
    status: value.status === 'failed' ? 'failed' : value.status === 'warning' ? 'warning' : 'passed',
    report_sha256: String(value.report_sha256 ?? ''),
    targets,
  }
}

function compareTarget(
  target: string,
  previous: RuntimeSoakTargetSummary | null,
  current: RuntimeSoakTargetSummary | null,
): RuntimeSoakTargetComparison {
  if (!previous) return { target, status: 'new', reasons: [], previous, current }
  if (!current) return { target, status: 'missing', reasons: [], previous, current }
  const reasons: string[] = []
  if (
    previous.p95_latency_ms !== null
    && current.p95_latency_ms !== null
    && current.p95_latency_ms > Math.max(previous.p95_latency_ms * 1.35, previous.p95_latency_ms + 75)
  ) reasons.push(`P95 응답 ${previous.p95_latency_ms}ms → ${current.p95_latency_ms}ms`)
  if (previous.success_rate - current.success_rate >= 0.01) {
    reasons.push(`성공률 ${(previous.success_rate * 100).toFixed(1)}% → ${(current.success_rate * 100).toFixed(1)}%`)
  }
  if (
    previous.memory_growth_mb !== null
    && current.memory_growth_mb !== null
    && current.memory_growth_mb - previous.memory_growth_mb > 64
  ) reasons.push(`메모리 증가 ${previous.memory_growth_mb}MiB → ${current.memory_growth_mb}MiB`)
  if (
    previous.open_file_descriptors_growth !== null
    && current.open_file_descriptors_growth !== null
    && current.open_file_descriptors_growth - previous.open_file_descriptors_growth > 16
  ) reasons.push(`열린 파일·연결 증가 ${previous.open_file_descriptors_growth}개 → ${current.open_file_descriptors_growth}개`)
  if (
    previous.p95_recovery_seconds !== null
    && current.p95_recovery_seconds !== null
    && current.p95_recovery_seconds > Math.max(previous.p95_recovery_seconds * 1.5, previous.p95_recovery_seconds + 10)
  ) reasons.push(`P95 복구 ${previous.p95_recovery_seconds}초 → ${current.p95_recovery_seconds}초`)
  return { target, status: reasons.length ? 'regressed' : 'stable', reasons, previous, current }
}

export function compareRuntimeSoakReports(
  previous: RuntimeSoakReport,
  current: RuntimeSoakReport,
): RuntimeSoakComparison {
  const keys = Array.from(new Set([...Object.keys(previous.targets), ...Object.keys(current.targets)])).sort()
  const targets = keys.map((target) => compareTarget(
    target,
    previous.targets[target] ?? null,
    current.targets[target] ?? null,
  ))
  const reasons = targets.flatMap((item) => item.reasons.map((reason) => `${item.target} ${reason}`))
  return { status: reasons.length ? 'regressed' : 'stable', reasons, targets }
}

export interface RuntimeSoakArtifactProvenance {
  file_name: string
  file_sha256: string
  report_sha256: string
  app_version: string
  completed_at: string
  loaded_at: string
}

export interface RuntimeSoakComparisonEvidence {
  schema_version: 'runtime-soak-comparison/1'
  compared_at: string
  previous: RuntimeSoakArtifactProvenance
  current: RuntimeSoakArtifactProvenance
  comparison: RuntimeSoakComparison
}

export function buildRuntimeSoakArtifactProvenance(
  report: RuntimeSoakReport,
  fileName: string,
  fileSha256: string,
  loadedAt: string,
): RuntimeSoakArtifactProvenance {
  return {
    file_name: fileName,
    file_sha256: fileSha256,
    report_sha256: report.report_sha256,
    app_version: report.app_version,
    completed_at: report.completed_at,
    loaded_at: loadedAt,
  }
}

export function buildRuntimeSoakComparisonEvidence(
  previous: RuntimeSoakArtifactProvenance,
  current: RuntimeSoakArtifactProvenance,
  comparison: RuntimeSoakComparison,
  comparedAt = new Date().toISOString(),
): RuntimeSoakComparisonEvidence {
  return {
    schema_version: 'runtime-soak-comparison/1',
    compared_at: comparedAt,
    previous,
    current,
    comparison,
  }
}
