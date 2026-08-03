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
for (const voiceId of requiredIds) {
  if (!frontend.includes(`id: '${voiceId}'`)) failures.push(`frontend preset 누락: ${voiceId}`)
  if (!backend.includes(`"${voiceId}"`)) failures.push(`backend preset 누락: ${voiceId}`)
}
for (const required of [
  "export type VoiceGender = 'female' | 'male' | 'neutral'",
  "gender: 'male'",
  'filterVoicePresets',
  'voiceGenderLabels',
]) {
  if (!frontend.includes(required)) failures.push(`src/tts/voicePresets.ts: ${required} 누락`)
}
if ((frontend.match(/gender: 'male'/g) ?? []).length !== 3) {
  failures.push('남성 프리셋은 정확히 3종이어야 합니다.')
}
for (const relativePath of [
  'services/api/app/services/setup_diagnostics.py',
  'services/api/app/engines/tts/cosyvoice_worker_tts.py',
]) {
  const source = await read(relativePath)
  if (!source.includes('from app.services.voice_presets import PRESET_VOICE_IDS')) {
    failures.push(`${relativePath}: 공통 PRESET_VOICE_IDS를 사용하지 않습니다.`)
  }
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

console.log('Voice preset 계약 검사 통과 · 5종 중 남성 3종')
