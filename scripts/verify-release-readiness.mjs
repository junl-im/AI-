import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { evidenceDigest, reportDigest } from './web-quality-report.mjs'
import { WEB_QUALITY_PHASES, WEB_QUALITY_SCHEMA_VERSION } from './web-quality-plan.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const requireCertified = process.argv.includes('--require-certified')

function option(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 && process.argv[index + 1] ? resolve(process.argv[index + 1]) : null
}

const inputs = {
  webQuality: option('--web-quality'),
  android: option('--android'),
  ios: option('--ios'),
  desktopScenes: option('--desktop-scenes'),
  mobileScenes: option('--mobile-scenes'),
  myVoice: option('--my-voice'),
}
const output = option('--output')
const appVersion = (await readFile(resolve(root, 'VERSION'), 'utf8')).trim()

function fail(message) {
  console.error(`Release readiness 검증 실패 · ${message}`)
  process.exit(1)
}

function sha256(raw) {
  return createHash('sha256').update(raw).digest('hex')
}

async function load(path, label) {
  if (!path) return null
  let raw
  try { raw = await readFile(path, 'utf8') }
  catch { fail(`${label} 파일을 읽을 수 없습니다: ${path}`) }
  let value
  try { value = JSON.parse(raw) }
  catch { fail(`${label} 파일이 JSON이 아닙니다.`) }
  return { raw, value, sha256: sha256(raw), path }
}

function sourceMetadata(value) {
  const source = value?.source && typeof value.source === 'object' ? value.source : null
  return {
    appVersion: typeof value?.appVersion === 'string' ? value.appVersion : null,
    commitSha: typeof source?.commitSha === 'string'
      ? source.commitSha
      : typeof value?.commitSha === 'string' ? value.commitSha : null,
    runId: typeof source?.runId === 'string'
      ? source.runId
      : typeof value?.runId === 'string' ? value.runId : null,
  }
}

function result(kind, loaded, status, detail) {
  if (!loaded) return { kind, status: 'pending', detail: 'evidence missing', sha256: null, ...sourceMetadata(null) }
  return { kind, status, detail, sha256: loaded.sha256, ...sourceMetadata(loaded.value) }
}

function verifyField(loaded, expectedSurface) {
  if (!loaded) return result(expectedSurface, null, 'pending', 'evidence missing')
  const value = loaded.value
  if (value.schemaVersion !== 'field-device-certification/1') fail(`${expectedSurface}: schemaVersion 오류`)
  if (value.evidenceClass !== 'observed-device' || value.synthetic !== false) fail(`${expectedSurface}: observed-device가 아닙니다.`)
  if (value.surface !== expectedSurface || value.inAppBrowserProvider !== 'kakao') fail(`${expectedSurface}: surface/provider 불일치`)
  if (!value.checks || typeof value.checks !== 'object') fail(`${expectedSurface}: checks 누락`)
  const direct = value.checks.presetPreviewStarted === true
  const fallback = value.checks.presetPreviewAttempted === true
    && value.checks.presetPreviewFailure !== 'none'
    && value.checks.externalBrowserRequested === true
  const exitReady = value.checks.exitDialogOpened === true && value.checks.exitStayClosed === true
  const ready = (direct || fallback) && exitReady && value.operatorConfirmed === true
  return result(expectedSurface, loaded, ready ? 'ready' : 'blocked', ready ? 'observed-device READY' : '필수 field check 미완료')
}

function verifyWebQuality(loaded) {
  if (!loaded) return result('web-quality', null, 'pending', 'evidence missing')
  const value = loaded.value
  if (value.schemaVersion !== WEB_QUALITY_SCHEMA_VERSION || value.mode !== 'run') fail('Web quality run report가 아닙니다.')
  const expectedIds = WEB_QUALITY_PHASES.map((phase) => phase.id)
  const actualIds = Array.isArray(value.phases) ? value.phases.map((phase) => phase.id) : []
  const phasesReady = JSON.stringify(actualIds) === JSON.stringify(expectedIds)
    && value.phases.every((phase) => phase.status === 'passed' && phase.exitCode === 0 && /^[a-f0-9]{64}$/i.test(phase.logSha256 ?? ''))
  const checksumReady = reportDigest(value) === value.reportSha256 && evidenceDigest(value) === value.evidenceSha256
  const ready = value.passed === true && value.appVersion === appVersion && phasesReady && checksumReady
  return result('web-quality', loaded, ready ? 'ready' : 'blocked', ready ? `${value.phases.length} phases PASS` : 'phase/version/checksum 불일치')
}

function verifyScenes(loaded, mode) {
  const kind = `chromium-${mode}`
  if (!loaded) return result(kind, null, 'pending', 'evidence missing')
  const value = loaded.value
  if (value.schemaVersion !== 'chromium-multi-scene/1' || value.mode !== mode) fail(`${kind}: manifest schema/mode 오류`)
  const scenesReady = Array.isArray(value.scenes) && value.scenes.join(',') === 'workspace,voice-surface,recovery-impact'
  const capturesReady = Array.isArray(value.captures)
    && value.captures.length === 9
    && value.captures.every((item) => item.passed === true && /^[a-f0-9]{64}$/i.test(item.sha256 ?? ''))
  const fixtureReady = value.recoveryFixture?.realWorkerClaimed === false
  const ready = value.passed === true && value.appVersion === appVersion && scenesReady && capturesReady && fixtureReady
  return result(kind, loaded, ready ? 'ready' : 'blocked', ready ? '9/9 scenes PASS' : 'scene/version/synthetic-boundary 불일치')
}

function verifyMyVoice(loaded) {
  if (!loaded) return result('my-voice', null, 'pending', 'evidence missing')
  const value = loaded.value
  if (value.schemaVersion !== 'my-voice-recovery-runtime/1') fail('MY VOICE runtime schemaVersion 오류')
  if (value.evidenceClass !== 'observed-runtime' || value.synthetic === true) fail('MY VOICE는 observed-runtime이어야 합니다.')
  if ('profileId' in value || 'samplePath' in value || 'sampleBlob' in value) fail('MY VOICE raw profile/sample 식별자를 readiness에 사용할 수 없습니다.')
  const versionReady = value.appVersion == null || value.appVersion === appVersion
  const countReady = Number.isInteger(value.selectedCount)
    && Number.isInteger(value.unavailableCount)
    && Number.isInteger(value.changedCount)
    && value.unavailableCount >= 1
    && value.changedCount === value.unavailableCount
    && value.selectedCount >= value.changedCount
  const ready = value.consentVerified === true
    && /^[a-f0-9]{64}$/i.test(value.profileFingerprint ?? '')
    && value.workerReady === true
    && value.modelReady === true
    && value.action === 'replace-and-regenerate'
    && countReady
    && value.historicalAudioRestored === false
    && value.outcome === 'completed'
    && typeof value.firstAudioMs === 'number'
    && value.firstAudioMs >= 0
    && typeof value.audioDurationSeconds === 'number'
    && value.audioDurationSeconds > 0
    && value.playbackCompleted === true
    && versionReady
  return result('my-voice', loaded, ready ? 'ready' : 'blocked', ready ? `completed · firstAudio=${Math.round(value.firstAudioMs)}ms` : 'observed runtime 미완료')
}

const loaded = {
  webQuality: await load(inputs.webQuality, 'Web quality'),
  android: await load(inputs.android, 'Kakao Android'),
  ios: await load(inputs.ios, 'Kakao iOS'),
  desktopScenes: await load(inputs.desktopScenes, 'Chromium desktop'),
  mobileScenes: await load(inputs.mobileScenes, 'Chromium mobile'),
  myVoice: await load(inputs.myVoice, 'MY VOICE'),
}

const slots = [
  verifyWebQuality(loaded.webQuality),
  verifyField(loaded.android, 'kakao-android'),
  verifyField(loaded.ios, 'kakao-ios'),
  verifyScenes(loaded.desktopScenes, 'desktop'),
  verifyScenes(loaded.mobileScenes, 'mobile'),
  verifyMyVoice(loaded.myVoice),
]

function groupStatus(kinds) {
  const items = slots.filter((item) => kinds.includes(item.kind))
  if (items.every((item) => item.status === 'ready')) return 'ready'
  if (items.some((item) => item.status === 'blocked')) return 'blocked'
  return 'pending'
}

const groups = {
  githubActions: groupStatus(['web-quality']),
  fieldDevices: groupStatus(['kakao-android', 'kakao-ios']),
  chromium: groupStatus(['chromium-desktop', 'chromium-mobile']),
  myVoice: groupStatus(['my-voice']),
}
const certified = slots.every((item) => item.status === 'ready')
const summary = {
  schemaVersion: 'release-readiness/1',
  appVersion,
  generatedAt: new Date().toISOString(),
  overall: certified ? 'certified' : 'pending',
  groups,
  slots,
  missing: slots.filter((item) => item.status === 'pending').map((item) => item.kind),
}

if (output) await writeFile(output, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
if (requireCertified && !certified) {
  fail(`--require-certified 조건 미충족 · ${slots.filter((item) => item.status !== 'ready').map((item) => `${item.kind}:${item.status}`).join(', ')}`)
}
console.log(`Release readiness 검증 통과 · overall=${summary.overall} · ready=${slots.filter((item) => item.status === 'ready').length}/6`)
