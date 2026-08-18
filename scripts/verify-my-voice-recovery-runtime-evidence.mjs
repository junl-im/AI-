import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const inputIndex = process.argv.indexOf('--input')
const input = inputIndex >= 0 && process.argv[inputIndex + 1]
  ? resolve(process.argv[inputIndex + 1])
  : resolve('.sorion/my-voice-recovery/runtime-evidence.json')
const requireSuccess = process.argv.includes('--require-success')

function fail(message) {
  console.error(`MY VOICE runtime evidence 검증 실패 · ${message}`)
  process.exit(1)
}

let raw
try { raw = await readFile(input, 'utf8') }
catch { fail(`증거 파일이 없습니다: ${input}`) }

let value
try { value = JSON.parse(raw) }
catch { fail('JSON 형식이 아닙니다.') }

if (value.schemaVersion !== 'my-voice-recovery-runtime/1') fail('schemaVersion이 my-voice-recovery-runtime/1이 아닙니다.')
if (value.evidenceClass !== 'observed-runtime') fail('실 runtime 증거는 evidenceClass=observed-runtime이어야 합니다.')
if (value.synthetic === true) fail('synthetic 증거를 실 runtime 성공으로 사용할 수 없습니다.')
if (value.consentVerified !== true) fail('동의 확인이 필요합니다.')
if (typeof value.profileFingerprint !== 'string' || !/^[a-f0-9]{64}$/i.test(value.profileFingerprint)) fail('profileFingerprint는 SHA-256 hex여야 합니다.')
if ('profileId' in value || 'samplePath' in value || 'sampleBlob' in value) fail('원본 profile ID/샘플 경로/바이너리를 증거 파일에 넣을 수 없습니다.')
if (value.workerReady !== true || value.modelReady !== true) fail('Worker와 모델 ready 증거가 모두 필요합니다.')
if (value.action !== 'replace-and-regenerate') fail('action은 replace-and-regenerate여야 합니다.')
if (!Number.isInteger(value.selectedCount) || value.selectedCount < 1) fail('selectedCount가 올바르지 않습니다.')
if (!Number.isInteger(value.unavailableCount) || value.unavailableCount < 1) fail('unavailableCount가 올바르지 않습니다.')
if (!Number.isInteger(value.changedCount) || value.changedCount !== value.unavailableCount) fail('changedCount는 unavailableCount와 같아야 합니다.')
if (value.selectedCount < value.changedCount) fail('changedCount가 selectedCount보다 클 수 없습니다.')
if (value.historicalAudioRestored !== false) fail('폐기된 과거 음원이 복원되었다고 기록할 수 없습니다.')
if (!['completed', 'failed', 'cancelled'].includes(value.outcome)) fail('outcome 값이 올바르지 않습니다.')
if (!Number.isFinite(Date.parse(value.startedAt ?? '')) || !Number.isFinite(Date.parse(value.finishedAt ?? ''))) fail('startedAt/finishedAt이 올바르지 않습니다.')
if (Date.parse(value.finishedAt) < Date.parse(value.startedAt)) fail('finishedAt이 startedAt보다 빠릅니다.')
if (value.outcome === 'completed') {
  if (typeof value.firstAudioMs !== 'number' || value.firstAudioMs < 0) fail('completed 증거에는 firstAudioMs가 필요합니다.')
  if (typeof value.audioDurationSeconds !== 'number' || value.audioDurationSeconds <= 0) fail('completed 증거에는 audioDurationSeconds가 필요합니다.')
  if (value.playbackCompleted !== true) fail('completed 증거에는 playbackCompleted=true가 필요합니다.')
}
if (requireSuccess && value.outcome !== 'completed') fail('--require-success에서는 completed 증거가 필요합니다.')

const digest = createHash('sha256').update(raw).digest('hex')
console.log(`MY VOICE recovery runtime evidence 검증 통과 · outcome=${value.outcome} · sha256=${digest}`)
