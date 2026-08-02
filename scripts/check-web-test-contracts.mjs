import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []

async function read(relativePath) {
  return readFile(join(root, relativePath), 'utf8')
}

const exitTest = await read('src/hooks/useExitConfirmation.test.tsx')
for (const required of [
  "import { act, fireEvent, render, screen } from '@testing-library/react'",
  'act(() => {',
  "window.dispatchEvent(new PopStateEvent('popstate'))",
]) {
  if (!exitTest.includes(required)) {
    failures.push(`useExitConfirmation.test.tsx: ${required} 누락`)
  }
}

const homeTest = await read('src/pages/HomePage.test.tsx')
if (!homeTest.includes("toHaveAttribute('maxlength', '20000')")) {
  failures.push('HomePage.test.tsx: 장문 입력 계약 검사가 없습니다.')
}
if (homeTest.includes("toContain('긴 내용')")) {
  failures.push('HomePage.test.tsx: 변경 가능한 placeholder 문구에 결합돼 있습니다.')
}
if (!homeTest.includes("const voiceSettings = screen.getByRole('dialog', { name: '음성 설정' })")) {
  failures.push('HomePage.test.tsx: 음성 설정 Sheet 조회 범위가 dialog로 고정되지 않았습니다.')
}
if (!homeTest.includes("within(voiceSettings).getByRole('radio', { name: '밝게' })")) {
  failures.push('HomePage.test.tsx: 중복 말투 선택지를 음성 설정 dialog 내부에서 검증하지 않습니다.')
}
if (homeTest.includes("screen.getByRole('radio', { name: '밝게' })")) {
  failures.push('HomePage.test.tsx: 데스크톱 Drawer와 모바일 Sheet의 중복 버튼을 전역 조회합니다.')
}


const voiceControlOptions = await read('src/voice/voiceControlOptions.ts')
for (const required of [
  'VOICE_SPEED_CONTROL',
  'VOICE_PITCH_CONTROL',
  'VOICE_EMOTION_OPTIONS',
  'normalizeVoicePitch',
  'step: 1',
]) {
  if (!voiceControlOptions.includes(required)) {
    failures.push(`voiceControlOptions.ts: ${required} 누락`)
  }
}

const modalDialog = await read('src/hooks/useModalDialog.ts')
for (const required of [
  "event.key === 'Escape'",
  "event.key !== 'Tab'",
  "document.body.style.overflow = 'hidden'",
  'const previousFocus = document.activeElement instanceof HTMLElement',
  'const explicitReturnTarget = returnFocusRef?.current ?? null',
  'const returnTarget = explicitReturnTarget?.isConnected',
  ': previousFocus?.isConnected',
]) {
  if (!modalDialog.includes(required)) {
    failures.push(`useModalDialog.ts: ${required} 누락`)
  }
}
const modalCleanup = modalDialog.slice(modalDialog.indexOf('return () =>'))
if (modalCleanup.includes('returnFocusRef?.current')) {
  failures.push('useModalDialog.ts: effect cleanup에서 mutable returnFocusRef.current를 직접 읽습니다.')
}

const voiceSettingsSheet = await read('src/components/workspace/VoiceSettingsSheet.tsx')
for (const required of [
  'VOICE_EMOTION_OPTIONS.map',
  'role="radiogroup"',
  'aria-label="음성 속도"',
  'disabled={previewing}',
]) {
  if (!voiceSettingsSheet.includes(required)) {
    failures.push(`VoiceSettingsSheet.tsx: ${required} 누락`)
  }
}

for (const relativePath of [
  'src/components/workspace/DesktopVoiceDrawer.tsx',
  'src/components/voice/AdvancedVoiceSettings.tsx',
]) {
  const source = await read(relativePath)
  for (const required of [
    'VOICE_SPEED_CONTROL',
    'VOICE_PITCH_CONTROL',
    'aria-label="음성 속도"',
    'aria-label="음성 높낮이"',
  ]) {
    if (!source.includes(required)) failures.push(`${relativePath}: ${required} 누락`)
  }
}

const emotionSelector = await read('src/components/voice/EmotionSelector.tsx')
if (!emotionSelector.includes('VOICE_EMOTION_OPTIONS.map')) {
  failures.push('EmotionSelector.tsx: 공통 말투 선택지를 사용하지 않습니다.')
}

if (failures.length > 0) {
  console.error('Web 테스트 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Web 테스트 계약 검사 통과')
