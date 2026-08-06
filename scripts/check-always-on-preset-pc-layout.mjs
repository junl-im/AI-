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
    if (content.includes(token)) failures.push(`${relativePath}: 일반 화면 연결 상태 노출 ${token}`)
  }
}

const home = await source('src/pages/HomePage.tsx')
requireTokens('src/pages/HomePage.tsx', home, [
  'pendingPreview',
  'previewRunIdRef',
  'requestAutomaticApiReconnect()',
  'failed: true',
  'retryDelay',
  'void previewVoice(voiceIdToRetry)',
  'onVoiceChange={selectVoice}',
  "badge: '자동 진행'",
])
forbidTokens('src/pages/HomePage.tsx', home, [
  "badge: '음성 시스템 준비 중'",
  '음성 기능을 준비하고 있습니다. 잠시 후 다시 시도해 주세요.',
  '음성 기능을 자동으로 준비하고 있습니다.',
])

const bootstrap = await source('src/hooks/useBackendBootstrap.ts')
requireTokens('src/hooks/useBackendBootstrap.ts', bootstrap, [
  'HEALTHY_HEARTBEAT_MS = 12_000',
  'HIDDEN_HEARTBEAT_MS = 45_000',
  'FULL_AUDIT_INTERVAL_MS = 60_000',
  "window.addEventListener('focus', requestFastInspect)",
  "window.addEventListener('pageshow', requestFullInspect)",
  "window.removeEventListener('focus', requestFastInspect)",
  "window.removeEventListener('pageshow', requestFullInspect)",
  'lastCatalogRefreshAtRef',
  "window.dispatchEvent(new CustomEvent('sorion-engine-refresh'",
])

const appShell = await source('src/components/layout/AppShell.tsx')
forbidTokens('src/components/layout/AppShell.tsx', appShell, [
  'InAppBrowserEngineNotice',
  '엔진 연결',
  'API 연결',
  'Worker',
  'GPU',
])

const layoutHook = await source('src/hooks/useDesktopStudioLayout.ts')
requireTokens('src/hooks/useDesktopStudioLayout.ts', layoutHook, [
  "sorion.desktop-studio-layout.v2",
  'leftWidth: 224',
  'rightWidth: 286',
  'window.innerWidth < 1024',
])

const desktopCss = await source('src/styles/desktop-studio.css')
requireTokens('src/styles/desktop-studio.css', desktopCss, [
  '@media (min-width: 1024px)',
  'var(--soa-project-rail-width, 224px)',
  'var(--soa-voice-drawer-width, 286px)',
  'grid-template-columns:',
  '.soa-project-rail,',
  '.soa-voice-drawer {',
])
if (desktopCss.includes('@media (min-width: 1180px)')) {
  failures.push('src/styles/desktop-studio.css: 1180px 전용 3분할 계약이 남아 있습니다.')
}

const docs = await source('docs/ALWAYS_ON_PRESET_AND_PC_LAYOUT.md')
requireTokens('docs/ALWAYS_ON_PRESET_AND_PC_LAYOUT.md', docs, [
  'Always-on Preset Runtime',
  '자동 재연결',
  '연결 상태 비노출',
  '1024px',
  '3분할',
])

if (failures.length > 0) {
  console.error('Always-on preset / PC layout 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Always-on preset / PC layout 계약 검사 통과')
