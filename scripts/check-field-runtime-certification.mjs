import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []
async function read(relative) {
  try { return await readFile(join(root, relative), 'utf8') }
  catch { failures.push(`${relative}: 필수 파일이 없습니다.`); return '' }
}
function requireTokens(relative, source, tokens) {
  for (const token of tokens) if (!source.includes(token)) failures.push(`${relative}: 계약 누락 · ${token}`)
}

const evidence = await read('src/quality/fieldDeviceCertification.ts')
requireTokens('src/quality/fieldDeviceCertification.ts', evidence, [
  "schemaVersion: 'field-device-certification/1'",
  "evidenceClass: 'observed-device'",
  'synthetic: false',
  "surface: 'kakao-android'",
  "surface: 'kakao-ios'",
  "'preset-preview-watchdog-timeout'",
  "'external-browser-requested'",
  "'exit-dialog-opened'",
  "'exit-stay-closed'",
  'operatorConfirmed',
])
const home = await read('src/pages/HomePage.tsx')
requireTokens('src/pages/HomePage.tsx', home, [
  "recordFieldDeviceEvent('preset-preview-attempted')",
  "recordFieldDeviceEvent('preset-preview-started')",
  "recordFieldDeviceEvent('preset-preview-blocked')",
  "recordFieldDeviceEvent('preset-preview-watchdog-timeout')",
])
const exitHook = await read('src/hooks/useExitConfirmation.ts')
requireTokens('src/hooks/useExitConfirmation.ts', exitHook, [
  "recordFieldDeviceEvent('exit-dialog-opened')",
  "recordFieldDeviceEvent('exit-stay-closed')",
])
const notice = await read('src/components/layout/InAppBrowserEngineNotice.tsx')
requireTokens('src/components/layout/InAppBrowserEngineNotice.tsx', notice, ["recordFieldDeviceEvent('external-browser-requested')"])
const card = await read('src/components/evaluation/FieldDeviceCertificationCard.tsx')
requireTokens('src/components/evaluation/FieldDeviceCertificationCard.tsx', card, ['카카오 실기기 동작 인증', 'operatorConfirmed', '인증 JSON 저장'])
const deviceVerifier = await read('scripts/verify-field-device-certification.mjs')
requireTokens('scripts/verify-field-device-certification.mjs', deviceVerifier, [
  "value.schemaVersion !== 'field-device-certification/1'",
  "value.evidenceClass !== 'observed-device'",
  'value.synthetic !== false',
  "'kakao-android', 'kakao-ios'",
  'value.checks.externalBrowserRequested === true',
  'value.operatorConfirmed === true',
  "'userAgent' in value",
])
const aggregate = await read('scripts/verify-field-runtime-certification.mjs')
requireTokens('scripts/verify-field-runtime-certification.mjs', aggregate, [
  "verify-field-device-certification.mjs",
  "verify-my-voice-recovery-runtime-evidence.mjs",
  "schemaVersion !== 'chromium-multi-scene/1'",
  'value.captures.length !== 9',
  'realWorkerClaimed !== false',
  '--require-all',
])
const docs = await read('docs/FIELD_DEVICE_RUNTIME_CERTIFICATION.md')
requireTokens('docs/FIELD_DEVICE_RUNTIME_CERTIFICATION.md', docs, [
  'field-device-certification/1',
  '카카오톡 Android',
  '카카오톡 iOS',
  'operatorConfirmed',
  'MY VOICE',
  'synthetic',
])

if (failures.length) {
  console.error('Field device/runtime certification 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Field device/runtime certification 계약 검사 통과 · Kakao Android/iOS + MY VOICE observed runtime')
