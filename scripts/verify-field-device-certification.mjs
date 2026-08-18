import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const inputIndex = process.argv.indexOf('--input')
const input = inputIndex >= 0 && process.argv[inputIndex + 1] ? resolve(process.argv[inputIndex + 1]) : null
const requireReady = process.argv.includes('--require-ready')

function fail(message) {
  console.error(`Field device certification 검증 실패 · ${message}`)
  process.exit(1)
}
if (!input) fail('--input <file>이 필요합니다.')

let raw
try { raw = await readFile(input, 'utf8') }
catch { fail(`증거 파일이 없습니다: ${input}`) }
let value
try { value = JSON.parse(raw) }
catch { fail('JSON 형식이 아닙니다.') }

if (value.schemaVersion !== 'field-device-certification/1') fail('schemaVersion이 field-device-certification/1이 아닙니다.')
if (value.evidenceClass !== 'observed-device') fail('evidenceClass=observed-device가 필요합니다.')
if (value.synthetic !== false) fail('synthetic 증거를 실기기 인증에 사용할 수 없습니다.')
if (!['kakao-android', 'kakao-ios'].includes(value.surface)) fail('카카오 Android/iOS surface 증거가 필요합니다.')
if (!['android', 'ios'].includes(value.deviceProfile)) fail('deviceProfile은 android 또는 ios여야 합니다.')
if (value.inAppBrowserProvider !== 'kakao') fail('inAppBrowserProvider=kakao가 필요합니다.')
if (!value.checks || typeof value.checks !== 'object') fail('checks가 필요합니다.')
if ('userAgent' in value || 'deviceName' in value || 'projectText' in value || 'audioBlob' in value || 'samplePath' in value) fail('전체 UA/기기명/사용자 원문/오디오/샘플 경로를 증거에 넣을 수 없습니다.')
if (!Number.isFinite(Date.parse(value.recordedAt ?? '')) || !Number.isFinite(Date.parse(value.updatedAt ?? ''))) fail('recordedAt/updatedAt이 올바르지 않습니다.')

const failures = ['unsupported', 'voice-unavailable', 'blocked', 'watchdog-timeout', 'exception']
const previewDirect = value.checks.presetPreviewAttempted === true && value.checks.presetPreviewStarted === true
const previewFallback = value.checks.presetPreviewAttempted === true
  && failures.includes(value.checks.presetPreviewFailure)
  && value.checks.externalBrowserRequested === true
const exitReady = value.checks.exitDialogOpened === true && value.checks.exitStayClosed === true
const ready = (previewDirect || previewFallback) && exitReady && value.operatorConfirmed === true

if (requireReady && !ready) {
  fail(`READY 조건 미충족 · preview=${previewDirect ? 'direct' : previewFallback ? 'fallback' : 'pending'} · exit=${exitReady} · operatorConfirmed=${value.operatorConfirmed === true}`)
}
const digest = createHash('sha256').update(raw).digest('hex')
console.log(`Field device certification 검증 통과 · surface=${value.surface} · status=${ready ? 'ready' : 'pending'} · preview=${previewDirect ? 'direct' : previewFallback ? 'fallback' : 'pending'} · sha256=${digest}`)
