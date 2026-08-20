import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []
const read = (path) => readFile(join(root, path), 'utf8')

const presets = await read('src/tts/voicePresets.ts')
for (const required of [
  "personaLabel: '따뜻한 대화'",
  "personaLabel: '또렷한 설명'",
  "personaLabel: '편안한 장문'",
  "personaLabel: '묵직한 다큐'",
  "personaLabel: '빠른 숏폼'",
  "cadence: 'conversation'",
  "cadence: 'explainer'",
  "cadence: 'narrative'",
  "cadence: 'documentary'",
  "cadence: 'shortform'",
  'rateMultiplier: 1.06',
  'rateMultiplier: 1.11',
  'rateMultiplier: 1.04',
  'rateMultiplier: 1.05',
  'rateMultiplier: 1.14',
]) {
  if (!presets.includes(required)) failures.push(`voicePresets.ts: ${required} 누락`)
}

const browser = await read('src/tts/browserSpeech.ts')
for (const required of [
  'BROWSER_USER_PITCH_SCALE = 0.3',
  'BROWSER_PITCH_MIN = 0.92',
  'BROWSER_PITCH_MAX = 1.08',
  'prepareBrowserSpeechText',
  "policy: 'characterized-korean-system'",
  'preset.cadence',
  'preset.personaLabel',
]) {
  if (!browser.includes(required)) failures.push(`browserSpeech.ts: ${required} 누락`)
}

const landing = await read('src/pages/LandingHome.tsx')
if (!landing.includes('scheduleStudioEntryAlignment')) failures.push('LandingHome.tsx: 최초 진입 정렬 예약 누락')
const longform = await read('src/components/workspace/LongformComposer.tsx')
if (!longform.includes('id="text-to-speech-studio"')) failures.push('LongformComposer.tsx: 텍스트→음성 진입 anchor 누락')
const navigation = await read('src/navigation/studioEntryNavigation.ts')
for (const required of ['STUDIO_ENTRY_ANCHOR_ID', "document.querySelector('.soa-compact-header')", 'window.scrollTo']) {
  if (!navigation.includes(required)) failures.push(`studioEntryNavigation.ts: ${required} 누락`)
}

const masthead = await read('src/components/layout/BrandMasthead.tsx')
for (const required of ['soa-signature-visual', '목소리에<br />감정을 입히다.', 'SORI ON · VOICE / EMOTION / RHYTHM']) {
  if (!masthead.includes(required)) failures.push(`BrandMasthead.tsx: ${required} 누락`)
}
if (masthead.includes('CURRENT VOICE') || masthead.includes('current voice')) failures.push('BrandMasthead.tsx: 기능형 CURRENT VOICE 카드가 남아 있습니다.')

const drawer = await read('src/components/workspace/DesktopVoiceDrawer.tsx')
for (const required of ['VoiceRhythmSignature', 'personaLabel', 'personaSummary', 'paceLabel']) {
  if (!drawer.includes(required)) failures.push(`DesktopVoiceDrawer.tsx: ${required} 누락`)
}
const picker = await read('src/components/workspace/VoicePickerSheet.tsx')
for (const required of ['VoiceRhythmSignature', 'personaLabel', 'personaSummary', 'paceLabel']) {
  if (!picker.includes(required)) failures.push(`VoicePickerSheet.tsx: ${required} 누락`)
}

const backend = await read('services/api/app/services/voice_presets.py')
for (const rate of ['        1.06,', '        1.11,', '        1.04,', '        1.05,', '        1.14,']) {
  if (!backend.includes(rate)) failures.push(`voice_presets.py: pace ${rate.trim()} 누락`)
}
const systemTts = await read('services/api/app/engines/tts/system_tts.py')
if (!systemTts.includes('round((effective_speed - 1) * 16)')) failures.push('system_tts.py: Windows pace 민감도 x16 누락')

const styles = await read('src/styles/index.css')
const overhaulImport = '@import "./studio-voice-overhaul.css";'
const themeIndex = styles.indexOf('@theme')
if (!styles.includes(overhaulImport)) failures.push('styles/index.css: studio-voice-overhaul import 누락')
else if (styles.indexOf(overhaulImport) > themeIndex) failures.push('styles/index.css: overhaul @import가 @theme 이후에 위치합니다.')

if (failures.length) {
  console.error('Studio entry / voice character overhaul 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Studio entry / voice character overhaul 계약 검사 통과 · 진입 정렬 / 5 persona / cadence / pace / signature visual')
