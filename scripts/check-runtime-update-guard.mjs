import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []

async function requireText(relativePath, requiredTexts) {
  const content = await readFile(join(root, relativePath), 'utf8')
  for (const requiredText of requiredTexts) {
    if (!content.includes(requiredText)) {
      failures.push(`${relativePath}: 필수 문구 "${requiredText}"가 없습니다.`)
    }
  }
}

await requireText('vite.config.ts', [
  "fileName: 'version.json'",
  '__SORION_BUILD_INFO__',
  "const heartbeat = '6.8.4'",
  'sorion-build-info',
])
await requireText('firebase.json', [
  '"source": "/version.json"',
  '"value": "no-cache, no-store, must-revalidate"',
])
await requireText('src/update/appUpdate.ts', [
  "cache: 'no-store'",
  'CHECK_COOLDOWN_MS',
  'REQUEST_TIMEOUT_MS',
  'navigator.serviceWorker.getRegistrations()',
  "registration.waiting?.postMessage({ type: 'SKIP_WAITING' })",
  "nextUrl.searchParams.set('sorion-build', remoteBuildId)",
  'window.location.replace(nextUrl.toString())',
])
await requireText('src/update/useAppUpdateMonitor.ts', [
  'visibilitychange',
  "window.addEventListener('online'",
  'PERIODIC_CHECK_MS',
])
await requireText('src/components/ui/AppUpdateNotice.tsx', [
  '새 SoriON 업데이트가 준비됐습니다.',
  '지금 적용',
  '나중에',
])
await requireText('src/components/evaluation/AppUpdateStatusCard.tsx', [
  '앱 업데이트',
  '업데이트 확인',
  '새 버전 적용',
])
await requireText('src/app/App.tsx', [
  'lazy(() => import',
  '<Suspense fallback={<PageLoading />}>',
  '<HomePage />',
])
await requireText('src/hooks/useEngineDoctor.ts', [
  'const requestSequence = useRef(0)',
  'requestSequence.current !== requestId',
  "window.addEventListener('online', handleOnline)",
  'lastCheckedAt',
])
await requireText('docs/RUNTIME_UPDATE_AND_PERFORMANCE.md', [
  'Runtime Update Guard',
  '보조 화면 지연 로딩',
  '오래된 진단 결과 차단',
  '의존성 업데이트 판단',
])

if (failures.length) {
  console.error('Runtime update·performance guard 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Runtime update·performance guard 계약 검사 통과')
