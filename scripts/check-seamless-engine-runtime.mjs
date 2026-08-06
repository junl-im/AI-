import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []

async function source(relativePath) {
  try {
    return await readFile(join(root, relativePath), 'utf8')
  } catch {
    failures.push(`${relativePath}: 필수 파일이 없습니다.`)
    return ''
  }
}

function requireTokens(relativePath, content, tokens) {
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${relativePath}: 계약 누락 ${token}`)
  }
}

function forbidTokens(relativePath, content, tokens) {
  for (const token of tokens) {
    if (content.includes(token)) failures.push(`${relativePath}: 일반 화면 기술 상태 노출 ${token}`)
  }
}

const httpClient = await source('src/api/httpClient.ts')
requireTokens('src/api/httpClient.ts', httpClient, [
  'Promise.any(probes)',
  'new AbortController()',
  'probeApiBaseUrl(candidate, 2_800',
  "failure.kind !== 'cancelled'",
])

const bootstrap = await source('src/hooks/useBackendBootstrap.ts')
requireTokens('src/hooks/useBackendBootstrap.ts', bootstrap, [
  'HEALTHY_HEARTBEAT_MS = 20_000',
  'HIDDEN_HEARTBEAT_MS = 90_000',
  'FULL_AUDIT_INTERVAL_MS = 120_000',
  'discoverApiBaseUrl',
  'probeApiBaseUrl',
  "window.addEventListener('online'",
  "document.addEventListener('visibilitychange'",
  "networkInformation?.addEventListener('change'",
  'applySeamlessFallback()',
])

const connectivity = await source('src/settings/connectivityApi.ts')
requireTokens('src/settings/connectivityApi.ts', connectivity, [
  "apiRequest<ApiConnectivityResponse>('/connectivity'",
  "timeoutMs: 7_000",
  "retries: 0",
  '통합 연결 응답으로 API 준비 상태를 확인했습니다.',
])

const voiceApi = await source('src/tts/voiceApi.ts')
requireTokens('src/tts/voiceApi.ts', voiceApi, [
  'ENGINE_CATALOG_CACHE_MS = 15_000',
  'engineCatalogRequest',
  'primeEngineCatalog',
  'readPrimedEngineCatalog',
])

const workerClient = await source('services/api/app/engines/voiceclone/cosyvoice_worker.py')
requireTokens('services/api/app/engines/voiceclone/cosyvoice_worker.py', workerClient, [
  'self._client: httpx.AsyncClient | None = None',
  'max_keepalive_connections=10',
  'keepalive_expiry=60.0',
  'health, readiness = await asyncio.gather(',
  'async def close(self) -> None:',
])

const apiMain = await source('services/api/app/main.py')
requireTokens('services/api/app/main.py', apiMain, [
  'async def maintain_worker_readiness() -> None:',
  'cosyvoice_worker_probe_interval_seconds',
  'asyncio.create_task(maintain_worker_readiness())',
  'await cosyvoice_worker.close()',
])

const config = await source('services/api/app/core/config.py')
requireTokens('services/api/app/core/config.py', config, [
  'cosyvoice_worker_probe_interval_seconds',
  'default=15.0',
])
const envExample = await source('.env.example')
requireTokens('.env.example', envExample, ['SORION_COSYVOICE_WORKER_PROBE_INTERVAL_SECONDS=15'])

const settings = await source('src/pages/SettingsPage.tsx')
requireTokens('src/pages/SettingsPage.tsx', settings, [
  '음성 자동 준비',
  '고급 진단 및 개발자 정보',
  'advancedOpen ? <AdvancedEngineDiagnostics /> : null',
])

const normalUiFiles = [
  'src/components/layout/CompactWorkspaceHeader.tsx',
  'src/components/workspace/DubbingStudioHeader.tsx',
  'src/components/workspace/LongformComposer.tsx',
  'src/pages/HomePage.tsx',
  'src/pages/VoiceClonePage.tsx',
]
for (const relativePath of normalUiFiles) {
  const content = await source(relativePath)
  forbidTokens(relativePath, content, [
    'soa-engine-chip',
    'API 연결 실패',
    'Worker 연결 실패',
    'GPU 미연결',
    '음성 서버 연결 대기',
    'CosyVoice Worker 확인 중',
    'Voice API 미연결',
  ])
}

const header = await source('src/components/workspace/DubbingStudioHeader.tsx')
forbidTokens('src/components/workspace/DubbingStudioHeader.tsx', header, ['backendStatus', 'engineLabel'])
const composer = await source('src/components/workspace/LongformComposer.tsx')
forbidTokens('src/components/workspace/LongformComposer.tsx', composer, ['backendStatus', 'backendMessage'])
const compactHeader = await source('src/components/layout/CompactWorkspaceHeader.tsx')
forbidTokens('src/components/layout/CompactWorkspaceHeader.tsx', compactHeader, ['engineHealth', 'latencyMs'])

const docs = await source('docs/SEAMLESS_ENGINE_RUNTIME.md')
requireTokens('docs/SEAMLESS_ENGINE_RUNTIME.md', docs, [
  'Seamless Engine Runtime',
  '병렬 자동 탐색',
  '연결 유지',
  '기술 상태 비노출',
  '지연을 0으로 보장할 수 없는 경계',
])

if (failures.length > 0) {
  console.error('Seamless Engine Runtime 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Seamless Engine Runtime 계약 검사 통과')
