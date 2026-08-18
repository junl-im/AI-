import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []

async function read(relativePath) {
  return readFile(join(root, relativePath), 'utf8')
}

const frontend = await read('src/tts/voicePresets.ts')
const backend = await read('services/api/app/services/voice_presets.py')
const requiredIds = ['sori-warm', 'on-clear', 'dam-calm', 'jun-deep', 'min-energetic']
const expectedPace = new Map([
  ['sori-warm', { frontend: "rateMultiplier: 1.0,", backend: '        1.00,' }],
  ['on-clear', { frontend: "rateMultiplier: 1.04,", backend: '        1.04,' }],
  ['dam-calm', { frontend: "rateMultiplier: 0.98,", backend: '        0.98,' }],
  ['jun-deep', { frontend: "rateMultiplier: 0.98,", backend: '        0.98,' }],
  ['min-energetic', { frontend: "rateMultiplier: 1.08,", backend: '        1.08,' }],
])
for (const voiceId of requiredIds) {
  if (!frontend.includes(`id: '${voiceId}'`)) failures.push(`frontend preset 누락: ${voiceId}`)
  if (!backend.includes(`"${voiceId}"`)) failures.push(`backend preset 누락: ${voiceId}`)
}
for (const [voiceId, pace] of expectedPace) {
  const frontendStart = frontend.indexOf(`id: '${voiceId}'`)
  const backendStart = backend.indexOf(`"${voiceId}"`)
  const frontendSlice = frontend.slice(frontendStart, frontendStart + 900)
  const backendSlice = backend.slice(backendStart, backendStart + 420)
  if (!frontendSlice.includes(pace.frontend)) failures.push(`frontend pace calibration 불일치: ${voiceId}`)
  if (!backendSlice.includes(pace.backend)) failures.push(`backend pace calibration 불일치: ${voiceId}`)
}
for (const required of [
  "export type VoiceGender = 'female' | 'male' | 'neutral'",
  "gender: 'male'",
  'filterVoicePresets',
  'voiceGenderLabels',
  'voiceVariantIndex',
  'requiresDedicatedReference',
  'requireVoicePreset',
]) {
  if (!frontend.includes(required)) failures.push(`src/tts/voicePresets.ts: ${required} 누락`)
}
if ((frontend.match(/gender: 'male'/g) ?? []).length !== 3) {
  failures.push('남성 프리셋은 정확히 3종이어야 합니다.')
}
for (const required of [
  'class VoicePresetUnavailableError',
  'requires_gender_match',
  'variant_index',
  '지원하지 않는 음성 프리셋',
]) {
  if (!backend.includes(required)) failures.push(`voice_presets.py: ${required} 누락`)
}

for (const relativePath of [
  'services/api/app/services/setup_diagnostics.py',
  'services/api/app/engines/tts/cosyvoice_worker_tts.py',
]) {
  const source = await read(relativePath)
  if (!source.includes('PRESET_VOICE_IDS') || !source.includes('app.services.voice_presets')) {
    failures.push(`${relativePath}: 공통 PRESET_VOICE_IDS를 사용하지 않습니다.`)
  }
}

const cosy = await read('services/api/app/engines/tts/cosyvoice_worker_tts.py')
for (const required of [
  'if voice_id in PRESET_VOICE_IDS',
  'VoicePresetUnavailableError',
  '다른 프리셋 또는 기본 음성으로 자동 대체하지 않습니다',
  'inspect_voice_preset_evidence',
  '동의·권리·사람 검수·SHA-256',
]) {
  if (!cosy.includes(required)) failures.push(`cosyvoice_worker_tts.py: ${required} 누락`)
}

const melo = await read('services/api/app/engines/tts/melo_tts.py')
for (const required of [
  '_select_speaker_id',
  'VoicePresetUnavailableError',
  'same-gender-cycle',
  '반대 성별 화자로 자동 대체하지 않습니다',
]) {
  if (!melo.includes(required)) failures.push(`melo_tts.py: ${required} 누락`)
}

const systemTts = await read('services/api/app/engines/tts/system_tts.py')
const windowsScript = await read('services/api/app/engines/tts/scripts/windows_speech.ps1')
for (const required of ['_detect_backends', '_available_backends', '_macos_voice_for', '_espeak_voice_for', 'preset.gender']) {
  if (!systemTts.includes(required)) failures.push(`system_tts.py: ${required} 누락`)
}
for (const required of [
  'ExpectedGender',
  'VoiceInfo.Gender',
  'VOICE_PRESET_UNAVAILABLE:',
  '$voiceIndex % $compatibleVoices.Count',
  '다른 성별 음성으로 자동 대체하지 않습니다',
]) {
  if (!windowsScript.includes(required)) failures.push(`windows_speech.ps1: ${required} 누락`)
}

const browserSpeech = await read('src/tts/browserSpeech.ts')
for (const required of [
  'inferBrowserVoiceGender',
  'preset.voiceVariantIndex',
  '반대 성별 음성 재생을 차단했습니다',
  'compatible.length === 0',
  "selectionBasis: 'preferred-token' | 'variant-index' | 'compatible-cycle' | 'none'",
  'preset.voiceVariantIndex % compatible.length',
  'requireVoicePreset',
]) {
  if (!browserSpeech.includes(required)) failures.push(`browserSpeech.ts: ${required} 누락`)
}

const voiceApi = await read('src/tts/voiceApi.ts')
for (const required of [
  'isPresetCompatibilityFailure',
  "error.status === 422 && error.message.includes('SOA-4022')",
  'canFallbackToBrowserForRequest',
]) {
  if (!voiceApi.includes(required)) failures.push(`voiceApi.ts: ${required} 누락`)
}

const ttsRoute = await read('services/api/app/api/routes/tts.py')
for (const required of ['EngineRequestUnsupportedError', 'SOA-4022']) {
  if (!ttsRoute.includes(required)) failures.push(`tts.py: ${required} 누락`)
}

const orchestrator = await read('services/api/app/services/engine_orchestrator.py')
for (const required of [
  'except VoicePresetUnavailableError as error',
  'len(preset_errors) == len(attempts)',
  'EngineRequestUnsupportedError',
]) {
  if (!orchestrator.includes(required)) failures.push(`engine_orchestrator.py: ${required} 누락`)
}

const player = await read('src/components/navigation/LinkedPlayerDock.tsx')
if (!player.includes("프리셋과 맞는 브라우저 음성을 선택하지 못했습니다")) {
  failures.push('LinkedPlayerDock.tsx: 브라우저 성별 불일치 오류 표시 누락')
}

const picker = await read('src/components/workspace/VoicePickerSheet.tsx')
for (const required of [
  'aria-label="목소리 성별 필터"',
  "{ id: 'male', label: voiceGenderLabels.male }",
  'visibleVoices.map',
  'aria-pressed={filter === option.id}',
]) {
  if (!picker.includes(required)) failures.push(`VoicePickerSheet.tsx: ${required} 누락`)
}

const tests = await read('src/components/workspace/DubbingVoiceControls.test.tsx')
for (const required of ['준호', '민준', "getAllByRole('radio')).toHaveLength(3)"]) {
  if (!tests.includes(required)) failures.push(`DubbingVoiceControls.test.tsx: ${required} 누락`)
}

const browserTests = await read('src/tts/browserSpeech.test.ts')
const apiTests = [
  await read('services/api/tests/test_cosyvoice_worker_tts.py'),
  await read('services/api/tests/test_melo_tts.py'),
  await read('services/api/tests/test_engine_orchestrator.py'),
].join('\n')
for (const required of [
  '남성 프리셋을 여성 음성으로 자동 대체하지 않는다',
  '같은 성별 후보가 하나뿐이어도 준호와 민준 프리셋을 운율 차이로 재사용한다',
  '알 수 없는 프리셋 ID를 첫 여성 프리셋으로 바꾸지 않는다',
]) {
  if (!browserTests.includes(required)) failures.push(`browserSpeech.test.ts: ${required} 누락`)
}
for (const required of [
  'test_cosyvoice_does_not_fallback_missing_preset_to_default_reference',
  'test_melo_does_not_replace_male_preset_with_unknown_single_speaker',
  'test_preset_incompatibility_falls_back_without_opening_engine_circuit',
]) {
  if (!apiTests.includes(required)) failures.push(`API regression test 누락: ${required}`)
}


const evidence = await read('services/api/app/services/voice_preset_evidence.py')
for (const required of [
  'VoicePresetEvidenceInspection',
  'mark_duplicate_checksums',
  'tts-inference',
  '한 사람 음성을 여러 인물 프리셋에 중복 등록하지 않습니다',
]) {
  if (!evidence.includes(required)) failures.push(`voice_preset_evidence.py: ${required} 누락`)
}
for (const voiceId of requiredIds) {
  const manifest = await read(`voice-presets/${voiceId}.manifest.json`)
  for (const required of ['"schema_version": 2', `"voice_id": "${voiceId}"`, '"tts-inference"']) {
    if (!manifest.includes(required)) failures.push(`${voiceId}.manifest.json: ${required} 누락`)
  }
}

const presetReadme = await read('voice-presets/README.md')
const presetGuide = await read('docs/VOICE_PRESETS.md')
for (const filename of ['jun-deep.wav', 'min-energetic.wav']) {
  if (!presetReadme.includes(filename)) failures.push(`voice-presets/README.md: ${filename} 누락`)
  if (!presetGuide.includes(filename)) failures.push(`docs/VOICE_PRESETS.md: ${filename} 누락`)
}
for (const required of ['기본 프리셋 5종', '남성 3종', '실제 WAV 준비 조건']) {
  if (!presetGuide.includes(required)) failures.push(`docs/VOICE_PRESETS.md: ${required} 누락`)
}

if (failures.length > 0) {
  console.error('Voice preset 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Voice preset 계약 검사 통과 · 5종/남성 3종 · 같은 성별 순환 사용 및 반대 성별 차단')
