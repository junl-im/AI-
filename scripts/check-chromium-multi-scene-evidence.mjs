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

const runner = await read('scripts/run-chromium-multi-scene-evidence.mjs')
requireTokens('scripts/run-chromium-multi-scene-evidence.mjs', runner, [
  "schemaVersion: 'chromium-multi-scene/1'",
  "scenes: ['workspace', 'voice-surface', 'recovery-impact']",
  "{ width: 360, height: 800, mobile: true }",
  "{ width: 390, height: 844, mobile: true }",
  "{ width: 430, height: 932, mobile: true }",
  '[1024, 1280, 1440].map',
  'Page.captureScreenshot',
  'sha256: await sha256(screenshotPath)',
  'ensureDesktopVoiceDrawerOpen',
  '보이스 패널 펼치기',
  'ensureProjectRailOpen',
  '프로젝트 패널 펼치기',
  'const alreadyOpen = await evaluate(cdp',
  "document.querySelector('.soa-dubbing-workspace')",
  "await closeVoiceSurface(cdp, interaction)",
  'previewDidNotSelectVoice',
  'selectAllRecoveryVoiceClips',
  "item.textContent?.trim() === '대사 전체'",
  "classList.contains('is-selected')",
  "classList.contains('is-voice-unavailable')",
  "schemaVersion: 'chromium-recovery-fixture-diagnostics/1'",
  "join(output, 'recovery-fixture-diagnostics.json')",
  '선택 3개 중 사용 불가 MY VOICE 2개만 변경합니다.',
  'realWorkerClaimed: false',
  "voiceId: 'myvoice:visual-missing-a'",
  "voiceId: 'myvoice:visual-missing-b'",
  '교체 후 재생성',
])

const runtimeVerifier = await read('scripts/verify-my-voice-recovery-runtime-evidence.mjs')
requireTokens('scripts/verify-my-voice-recovery-runtime-evidence.mjs', runtimeVerifier, [
  "schemaVersion !== 'my-voice-recovery-runtime/1'",
  "evidenceClass !== 'observed-runtime'",
  "value.synthetic === true",
  "value.consentVerified !== true",
  "value.workerReady !== true || value.modelReady !== true",
  "value.changedCount !== value.unavailableCount",
  "value.historicalAudioRestored !== false",
  "requireSuccess && value.outcome !== 'completed'",
])
const runtimeDoc = await read('docs/MY_VOICE_RECOVERY_RUNTIME_EVIDENCE.md')
requireTokens('docs/MY_VOICE_RECOVERY_RUNTIME_EVIDENCE.md', runtimeDoc, [
  '실 MY VOICE 생성 성공 증거가 아닙니다',
  'profileFingerprint',
  '원본 profile ID',
  'realWorkerClaimed=false',
])

const packageJson = await read('package.json')
requireTokens('package.json', packageJson, [
  '"quality:visual-scenes": "node scripts/run-chromium-multi-scene-evidence.mjs"',
  '"quality:mobile-scenes": "node scripts/run-chromium-multi-scene-evidence.mjs --mobile"',
])

const workflow = await read('.github/workflows/ci.yml')
requireTokens('.github/workflows/ci.yml', workflow, [
  'Run Chromium multi-scene desktop evidence',
  'id: visual_scenes',
  'npm run quality:visual-scenes',
  'Run Chromium multi-scene mobile evidence',
  'id: mobile_scenes',
  'npm run quality:mobile-scenes',
  "steps.visual_scenes.outcome == 'failure'",
  "steps.mobile_scenes.outcome == 'failure'",
])

if (failures.length) {
  console.error('Chromium multi-scene evidence 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Chromium multi-scene evidence 계약 검사 통과 · workspace / voice surface / recovery impact')
