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

const readiness = await read('src/quality/releaseReadiness.ts')
requireTokens('src/quality/releaseReadiness.ts', readiness, [
  "schemaVersion: 'release-readiness/1'",
  "'web-quality'",
  "'kakao-android'",
  "'kakao-ios'",
  "'chromium-desktop'",
  "'chromium-mobile'",
  "'my-voice'",
  "value.evidenceClass !== 'observed-runtime'",
  "fixture?.realWorkerClaimed === false",
  'verifyWebQualityChecksums',
  "overall = missing.length === 0",
])
const card = await read('src/components/evaluation/ReleaseReadinessCard.tsx')
requireTokens('src/components/evaluation/ReleaseReadinessCard.tsx', card, [
  'RELEASE READINESS',
  '출시 인증 상태',
  'CERTIFIED',
  'GitHub Actions',
  'Kakao Android',
  'Kakao iOS',
  'Chromium Desktop',
  'Chromium Mobile',
  'MY VOICE Runtime',
  'readiness JSON 저장',
])
const page = await read('src/pages/QualityPage.tsx')
requireTokens('src/pages/QualityPage.tsx', page, ['ReleaseReadinessCard', '<ReleaseReadinessCard />'])
const verifier = await read('scripts/verify-release-readiness.mjs')
requireTokens('scripts/verify-release-readiness.mjs', verifier, [
  "schemaVersion: 'release-readiness/1'",
  '--require-certified',
  'reportDigest(value) === value.reportSha256',
  'evidenceDigest(value) === value.evidenceSha256',
  "value.recoveryFixture?.realWorkerClaimed === false",
  "value.evidenceClass !== 'observed-runtime'",
  "overall: certified ? 'certified' : 'pending'",
])
const tests = await read('src/quality/releaseReadiness.test.ts')
requireTokens('src/quality/releaseReadiness.test.ts', tests, [
  "overall).toBe('certified')",
  "'web-quality'",
  "'kakao-android'",
  "'chromium-desktop'",
  "'my-voice'",
])
const docs = await read('docs/RELEASE_READINESS.md')
requireTokens('docs/RELEASE_READINESS.md', docs, [
  'release-readiness/1',
  'GitHub Actions',
  'Kakao Android',
  'Kakao iOS',
  'Chromium',
  'MY VOICE',
  'synthetic',
])

if (failures.length) {
  console.error('Release readiness 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Release readiness 계약 검사 통과 · CI + field device + Chromium + MY VOICE')
