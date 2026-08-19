export type ReleaseReadinessKind =
  | 'web-quality'
  | 'kakao-android'
  | 'kakao-ios'
  | 'chromium-desktop'
  | 'chromium-mobile'
  | 'my-voice'

export type ReleaseReadinessSlotStatus = 'pending' | 'ready' | 'blocked'
export type OverallReleaseReadinessStatus = 'pending' | 'certified'

export interface ReleaseReadinessSlot {
  kind: ReleaseReadinessKind
  status: ReleaseReadinessSlotStatus
  label: string
  detail: string
  sourceFile: string
  sourceSha256: string
  sourceAppVersion: string | null
  sourceCommitSha: string | null
  sourceRunId: string | null
  loadedAt: string
}

export interface ReleaseReadinessSummary {
  schemaVersion: 'release-readiness/1'
  appVersion: string
  generatedAt: string
  overall: OverallReleaseReadinessStatus
  groups: {
    githubActions: ReleaseReadinessSlotStatus
    fieldDevices: ReleaseReadinessSlotStatus
    chromium: ReleaseReadinessSlotStatus
    myVoice: ReleaseReadinessSlotStatus
  }
  slots: Partial<Record<ReleaseReadinessKind, ReleaseReadinessSlot>>
  missing: ReleaseReadinessKind[]
}

interface JsonObject {
  [key: string]: unknown
}

const EXPECTED_WEB_PHASES = [
  'lock-structure',
  'web-toolchain',
  'dependency-tree',
  'lint',
  'typecheck',
  'critical-regression',
  'test',
  'build',
]

const labels: Record<ReleaseReadinessKind, string> = {
  'web-quality': 'GitHub Actions Web quality',
  'kakao-android': 'Kakao Android',
  'kakao-ios': 'Kakao iOS',
  'chromium-desktop': 'Chromium Desktop 9-scene',
  'chromium-mobile': 'Chromium Mobile 9-scene',
  'my-voice': 'MY VOICE observed runtime',
}

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value)
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function parseJson(text: string): JsonObject {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error('JSON 형식이 아닙니다.')
  }
  if (!isObject(value)) throw new Error('JSON 객체가 필요합니다.')
  return value
}

export async function sha256Text(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('')
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (isObject(value)) {
    const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

async function verifyWebQualityChecksums(value: JsonObject): Promise<boolean> {
  if (!isSha256(value.reportSha256) || !isSha256(value.evidenceSha256)) return false
  const unsigned = { ...value }
  delete unsigned.reportSha256
  const reportSha256 = await sha256Text(canonicalJson(unsigned))
  const phases = Array.isArray(value.phases)
    ? value.phases.map((phase) => {
      if (!isObject(phase)) return phase
      const next = { ...phase }
      delete next.durationMs
      return next
    })
    : []
  const source = isObject(value.source) ? value.source : {}
  const evidenceProjection = {
    schemaVersion: value.schemaVersion,
    mode: value.mode,
    appVersion: value.appVersion,
    heartbeat: value.heartbeat,
    runtime: value.runtime,
    source: { repository: source.repository ?? null, commitSha: source.commitSha ?? null },
    inputs: value.inputs,
    phases,
    dist: value.dist,
    passed: value.passed,
  }
  const evidenceSha256 = await sha256Text(canonicalJson(evidenceProjection))
  return reportSha256 === value.reportSha256 && evidenceSha256 === value.evidenceSha256
}

function fieldDeviceSlot(
  value: JsonObject,
  expected: 'kakao-android' | 'kakao-ios',
): Pick<ReleaseReadinessSlot, 'status' | 'detail' | 'sourceAppVersion' | 'sourceCommitSha' | 'sourceRunId'> {
  if (value.schemaVersion !== 'field-device-certification/1') {
    throw new Error('field-device-certification/1 파일이 아닙니다.')
  }
  if (value.evidenceClass !== 'observed-device' || value.synthetic !== false) {
    throw new Error('실기기 observed-device evidence만 허용합니다.')
  }
  if (value.surface !== expected || value.inAppBrowserProvider !== 'kakao') {
    throw new Error(`${labels[expected]} evidence가 아닙니다.`)
  }
  const checks = isObject(value.checks) ? value.checks : null
  if (!checks) throw new Error('실기기 checks가 없습니다.')
  const previewDirect = checks.presetPreviewStarted === true
  const previewFallback = checks.presetPreviewAttempted === true
    && checks.presetPreviewFailure !== 'none'
    && checks.externalBrowserRequested === true
  const exitReady = checks.exitDialogOpened === true && checks.exitStayClosed === true
  const operatorReady = value.operatorConfirmed === true
  const ready = (previewDirect || previewFallback) && exitReady && operatorReady
  const previewLabel = previewDirect ? 'direct preview' : previewFallback ? 'fallback observed' : 'preview pending'
  return {
    status: ready ? 'ready' : 'blocked',
    detail: ready
      ? `${previewLabel} · exit guard observed · operator confirmed`
      : `${previewLabel} · exit=${exitReady ? 'ready' : 'pending'} · operator=${operatorReady ? 'confirmed' : 'pending'}`,
    sourceAppVersion: asString(value.appVersion),
    sourceCommitSha: asString(value.commitSha),
    sourceRunId: asString(value.runId),
  }
}

function webQualitySlot(
  value: JsonObject,
  expectedAppVersion: string,
): Pick<ReleaseReadinessSlot, 'status' | 'detail' | 'sourceAppVersion' | 'sourceCommitSha' | 'sourceRunId'> {
  if (value.schemaVersion !== 1 || value.mode !== 'run') {
    throw new Error('Web quality run report가 아닙니다.')
  }
  const appVersion = asString(value.appVersion)
  const source = isObject(value.source) ? value.source : null
  const phases = Array.isArray(value.phases) ? value.phases : []
  const actualPhaseIds = phases.map((phase) => isObject(phase) ? phase.id : null)
  const phaseOrderReady = JSON.stringify(actualPhaseIds) === JSON.stringify(EXPECTED_WEB_PHASES)
  const phasesReady = phaseOrderReady && phases.every((phase) => {
    if (!isObject(phase)) return false
    return phase.status === 'passed' && phase.exitCode === 0 && isSha256(phase.logSha256)
  })
  const versionReady = appVersion === expectedAppVersion
  const digestReady = isSha256(value.reportSha256) && isSha256(value.evidenceSha256)
  const ready = value.passed === true && phasesReady && versionReady && digestReady
  return {
    status: ready ? 'ready' : 'blocked',
    detail: ready
      ? `${phases.length} phases PASS · current version matched`
      : `passed=${value.passed === true} · phases=${phasesReady ? 'ready' : 'invalid'} · version=${appVersion ?? 'missing'}`,
    sourceAppVersion: appVersion,
    sourceCommitSha: source ? asString(source.commitSha) : null,
    sourceRunId: source ? asString(source.runId) : null,
  }
}

function chromiumSlot(
  value: JsonObject,
  expectedMode: 'desktop' | 'mobile',
  expectedAppVersion: string,
): Pick<ReleaseReadinessSlot, 'status' | 'detail' | 'sourceAppVersion' | 'sourceCommitSha' | 'sourceRunId'> {
  if (value.schemaVersion !== 'chromium-multi-scene/1' || value.mode !== expectedMode) {
    throw new Error(`Chromium ${expectedMode} multi-scene manifest가 아닙니다.`)
  }
  const appVersion = asString(value.appVersion)
  const scenes = Array.isArray(value.scenes) ? value.scenes : []
  const captures = Array.isArray(value.captures) ? value.captures : []
  const fixture = isObject(value.recoveryFixture) ? value.recoveryFixture : null
  const scenesReady = scenes.join(',') === 'workspace,voice-surface,recovery-impact'
  const capturesReady = captures.length === 9 && captures.every((capture) => {
    if (!isObject(capture)) return false
    return capture.passed === true && isSha256(capture.sha256)
  })
  const fixtureSafe = fixture?.realWorkerClaimed === false
  const versionReady = appVersion === expectedAppVersion
  const ready = value.passed === true && scenesReady && capturesReady && fixtureSafe && versionReady
  return {
    status: ready ? 'ready' : 'blocked',
    detail: ready
      ? '9/9 scenes PASS · recovery fixture synthetic boundary preserved'
      : `captures=${capturesReady ? '9/9' : `${captures.length}/9`} · fixture=${fixtureSafe ? 'safe' : 'invalid'} · version=${appVersion ?? 'missing'}`,
    sourceAppVersion: appVersion,
    sourceCommitSha: asString(value.commitSha),
    sourceRunId: asString(value.runId),
  }
}

function myVoiceSlot(
  value: JsonObject,
  expectedAppVersion: string,
): Pick<ReleaseReadinessSlot, 'status' | 'detail' | 'sourceAppVersion' | 'sourceCommitSha' | 'sourceRunId'> {
  if (value.schemaVersion !== 'my-voice-recovery-runtime/1') {
    throw new Error('my-voice-recovery-runtime/1 evidence가 아닙니다.')
  }
  if (value.evidenceClass !== 'observed-runtime' || value.synthetic === true) {
    throw new Error('실제 observed-runtime evidence만 허용합니다.')
  }
  if ('profileId' in value || 'samplePath' in value || 'sampleBlob' in value) {
    throw new Error('원본 profile/sample 식별자가 포함된 evidence는 허용하지 않습니다.')
  }
  const appVersion = asString(value.appVersion)
  const versionReady = appVersion === null || appVersion === expectedAppVersion
  const countsReady = Number.isInteger(value.selectedCount)
    && Number.isInteger(value.unavailableCount)
    && Number.isInteger(value.changedCount)
    && Number(value.selectedCount) >= Number(value.changedCount)
    && Number(value.unavailableCount) >= 1
    && value.changedCount === value.unavailableCount
  const runtimeReady = value.consentVerified === true
    && isSha256(value.profileFingerprint)
    && value.workerReady === true
    && value.modelReady === true
    && value.action === 'replace-and-regenerate'
    && countsReady
    && value.historicalAudioRestored === false
    && value.outcome === 'completed'
    && typeof value.firstAudioMs === 'number'
    && value.firstAudioMs >= 0
    && typeof value.audioDurationSeconds === 'number'
    && value.audioDurationSeconds > 0
    && value.playbackCompleted === true
  const ready = runtimeReady && versionReady
  return {
    status: ready ? 'ready' : 'blocked',
    detail: ready
      ? `completed · first audio ${Math.round(Number(value.firstAudioMs))}ms · playback verified`
      : `runtime=${runtimeReady ? 'ready' : 'incomplete'} · version=${appVersion ?? 'not-declared'}`,
    sourceAppVersion: appVersion,
    sourceCommitSha: asString(value.commitSha),
    sourceRunId: asString(value.runId),
  }
}

export function evaluateReleaseReadinessValue(
  value: JsonObject,
  kind: ReleaseReadinessKind,
  expectedAppVersion: string,
): Pick<ReleaseReadinessSlot, 'status' | 'detail' | 'sourceAppVersion' | 'sourceCommitSha' | 'sourceRunId'> {
  if (kind === 'web-quality') return webQualitySlot(value, expectedAppVersion)
  if (kind === 'kakao-android') return fieldDeviceSlot(value, 'kakao-android')
  if (kind === 'kakao-ios') return fieldDeviceSlot(value, 'kakao-ios')
  if (kind === 'chromium-desktop') return chromiumSlot(value, 'desktop', expectedAppVersion)
  if (kind === 'chromium-mobile') return chromiumSlot(value, 'mobile', expectedAppVersion)
  return myVoiceSlot(value, expectedAppVersion)
}

export async function inspectReleaseReadinessFile(
  file: File,
  kind: ReleaseReadinessKind,
  expectedAppVersion: string,
): Promise<ReleaseReadinessSlot> {
  const text = await file.text()
  const value = parseJson(text)
  let result = evaluateReleaseReadinessValue(value, kind, expectedAppVersion)
  if (kind === 'web-quality' && !await verifyWebQualityChecksums(value)) {
    result = { ...result, status: 'blocked', detail: 'Web quality report/evidence SHA-256가 일치하지 않습니다.' }
  }
  return {
    kind,
    label: labels[kind],
    sourceFile: file.name,
    sourceSha256: await sha256Text(text),
    loadedAt: new Date().toISOString(),
    ...result,
  }
}

function groupStatus(items: Array<ReleaseReadinessSlot | undefined>): ReleaseReadinessSlotStatus {
  if (items.every((item) => item?.status === 'ready')) return 'ready'
  if (items.some((item) => item?.status === 'blocked')) return 'blocked'
  return 'pending'
}

export function buildReleaseReadinessSummary(
  slots: Partial<Record<ReleaseReadinessKind, ReleaseReadinessSlot>>,
  appVersion: string,
  generatedAt = new Date().toISOString(),
): ReleaseReadinessSummary {
  const expectedKinds: ReleaseReadinessKind[] = [
    'web-quality',
    'kakao-android',
    'kakao-ios',
    'chromium-desktop',
    'chromium-mobile',
    'my-voice',
  ]
  const missing = expectedKinds.filter((kind) => !slots[kind])
  const groups = {
    githubActions: groupStatus([slots['web-quality']]),
    fieldDevices: groupStatus([slots['kakao-android'], slots['kakao-ios']]),
    chromium: groupStatus([slots['chromium-desktop'], slots['chromium-mobile']]),
    myVoice: groupStatus([slots['my-voice']]),
  }
  const overall = missing.length === 0
    && Object.values(groups).every((status) => status === 'ready')
    ? 'certified'
    : 'pending'
  return {
    schemaVersion: 'release-readiness/1',
    appVersion,
    generatedAt,
    overall,
    groups,
    slots,
    missing,
  }
}

export function downloadReleaseReadinessSummary(summary: ReleaseReadinessSummary): void {
  const payload = JSON.stringify(summary, null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `sorion-release-readiness-${summary.appVersion}-${summary.generatedAt.slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
