import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const ignored = new Set(['.git', '.venv', 'node_modules', 'dist', 'coverage', '__pycache__', '.pytest_cache', '.ruff_cache', '.sorion'])
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.py', '.css'])
const failures = []

function isWideCodePoint(codePoint) {
  return (
    (codePoint >= 0x1100 && codePoint <= 0x115f) ||
    codePoint === 0x2329 ||
    codePoint === 0x232a ||
    (codePoint >= 0x2e80 && codePoint <= 0xa4cf) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
    (codePoint >= 0xff01 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x1f300 && codePoint <= 0x1faff)
  )
}

function ruffDisplayWidth(line) {
  return Array.from(line).reduce((width, character) => {
    const codePoint = character.codePointAt(0)
    return width + (isWideCodePoint(codePoint) ? 2 : 1)
  }, 0)
}

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue
    const fullPath = join(directory, entry.name)
    if (entry.isDirectory()) {
      await walk(fullPath)
      continue
    }

    const path = relative(root, fullPath)
    const extension = extname(entry.name).toLowerCase()
    if (extension === '.svg') failures.push(`${path}: SVG 파일은 프로젝트 원칙상 금지됩니다.`)
    if (!sourceExtensions.has(extension)) continue

    const content = await readFile(fullPath, 'utf8')
    const lines = content.split(/\r?\n/)
    const lineCount = lines.length
    if (lineCount > 500) failures.push(`${path}: ${lineCount}줄로 500줄 제한을 초과했습니다.`)
    if (extension === '.py') {
      lines.forEach((line, index) => {
        const displayWidth = ruffDisplayWidth(line)
        if (displayWidth > 100) {
          failures.push(
            `${path}:${index + 1}: Ruff 표시 폭 100자를 초과했습니다. (${displayWidth}칸)`,
          )
        }
      })
    }

    const secretPatterns = [
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
      /AIza[0-9A-Za-z_-]{30,}/,
      /sk-[A-Za-z0-9_-]{20,}/,
    ]
    if (secretPatterns.some((pattern) => pattern.test(content))) {
      failures.push(`${path}: 비밀키로 의심되는 문자열이 발견되었습니다.`)
    }
  }
}

async function requireText(relativePath, requiredTexts) {
  const fullPath = join(root, relativePath)
  let content = ''
  try {
    content = await readFile(fullPath, 'utf8')
  } catch {
    failures.push(`${relativePath}: 필수 파일이 없습니다.`)
    return
  }

  for (const requiredText of requiredTexts) {
    if (!content.includes(requiredText)) {
      failures.push(`${relativePath}: 필수 문구 "${requiredText}"가 없습니다.`)
    }
  }
}

await walk(root)

const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const currentVersion = packageJson.version

await requireText('DELIVERY_RULES.md', [
  '## 1. 결과',
  '## 2. 전체 통파일 ZIP과 덮어쓰기용 패치 ZIP',
  '## 3. 다음 예상 업데이트 내역',
  'docs/HANDOVER.md',
])
await requireText('docs/HANDOVER.md', [currentVersion, '다음 예상 업데이트'])
await requireText('docs/CHANGELOG.md', [`## ${currentVersion}`])
await requireText('docs/NEXT_UPDATE.md', ['# NEXT UPDATE', '## 목표 버전'])
await requireText('docs/RELEASE.md', ['전체 통파일 ZIP', '덮어쓰기용 패치 ZIP'])
await requireText('docs/ENGINE_STRATEGY.md', [
  'Fun-CosyVoice 3',
  'GPT-SoVITS',
  'Fish Audio S2',
  '왜 Python 백엔드인가',
])
await requireText('services/api/app/api/routes/engines.py', [
  '/strategy',
  'current_engine_strategy',
])
await requireText('services/api/app/services/job_manager.py', [
  'except asyncio.TimeoutError as error:',
  'await asyncio.gather(task, return_exceptions=True)',
  'raise GenerationTimeoutError(job_id) from error',
])
await requireText('.github/workflows/ci.yml', [
  'name: SoriON CI & Pages',
  'branches:',
  'astral-sh/setup-uv@08807647e7069bb48b6ef5acd8ec9567f424441b',
  "version: '0.11.32'",
  "python-version: '3.10'",
  'actions/checkout@v6',
  'actions/setup-node@v6',
  'actions/setup-python@v6',
  'actions/configure-pages@v6',
  'actions/upload-pages-artifact@v5',
  'actions/deploy-pages@v5',
])
await requireText('src/test/setup.ts', [
  'afterEach',
  'cleanup()',
  'Object.defineProperty(Blob.prototype',
  "reader.readAsArrayBuffer(this)",
])
await requireText('src/tts/mockWave.test.ts', [
  'async function readBlob',
  "typeof blob.arrayBuffer === 'function'",
  'reader.readAsArrayBuffer(blob)',
])
await requireText('src/components/layout/BrandMasthead.tsx', [
  'data-testid="brand-title-microphone"',
  'data-testid="voice-core-microphone"',
])
await requireText('src/components/layout/BrandMasthead.test.tsx', [
  '문장을 목소리로, 목소리를 새로운 가능성으로.',
  '한국어의 감정과 호흡을 더 자연스럽게.',
  '생성부터 복제와 변환까지, 모바일에서 빠르게.',
  "getByTestId('brand-title-microphone')",
  "getByTestId('voice-core-microphone')",
])

await requireText('src/pages/VoiceClonePage.tsx', [
  '10초 안에 준비합니다.',
  'prepareVoiceCloneProfile',
  'prohibitedUseConfirmed',
])
await requireText('src/components/navigation/LinkedPlayerDock.tsx', [
  '대기열',
  'selectNext',
  'playbackRate',
  'cycleRepeatMode',
  "track ? 'soa-dock--has-player' : 'soa-dock--nav-only'",
  "{track ? (",
  '<nav className="soa-dock__nav"',
])
await requireText('src/components/navigation/LinkedPlayerDock.test.tsx', [
  '음성이 없으면 메뉴 Dock만 표시한다',
  '완성 음성이 생기면 플레이어를 메뉴 위에 표시한다',
  'Node.DOCUMENT_POSITION_FOLLOWING',
])
await requireText('src/components/layout/AppShell.tsx', [
  'soa-workspace-shell--has-player',
  'getCurrentTrack(state) !== null',
])
await requireText('src/components/layout/AppShell.test.tsx', [
  '플레이어 유무에 따라 작업 화면의 하단 안전 여백을 바꾼다',
  'soa-workspace-shell--has-player',
])
await requireText('src/styles/player-dock.css', [
  '.soa-dock--nav-only',
  '.soa-linked-player',
  'order: 1',
  '.soa-dock__nav',
  'order: 2',
])
await requireText('services/api/app/api/routes/voice_clones.py', [
  'SOA-5001',
  'rights_confirmed',
  'prohibited_use_confirmed',
  '/capabilities',
  '/profiles',
])
await requireText('services/api/app/engines/voiceclone/cosyvoice_worker.py', [
  'Fun-CosyVoice 3 Worker',
  'SORION_COSYVOICE_WORKER_URL',
])
await requireText('docs/VOICE_CLONE.md', [
  '로컬 우선',
  '명시적 동의',
  '실제 복제 성공으로 표시하지 않는다',
])

await requireText('src/api/httpClient.ts', [
  'getApiConnectionContext',
  "source: ApiBaseSource",
  'Voice API 주소가 설정되지 않았습니다.',
  'resolveApiAssetUrl',
])
await requireText('src/settings/connectivityApi.ts', [
  'runApiConnectivityAudit',
  "'health-route'",
  "'engines-route'",
  "'clone-route'",
])
await requireText('services/api/app/api/routes/connectivity.py', [
  '@router.get("/connectivity"',
  'CosyVoice Worker',
  '실제 한국어 TTS',
])
await requireText('services/api/app/services/setup_diagnostics.py', [
  'sys.version_info >= (3, 10)',
  'Python 3.10 이상',
])
await requireText('services/api/app/core/config.py', [
  'https://junl-im.github.io',
  'cosyvoice_worker_timeout_seconds',
])
await requireText('docs/API_CONNECTIVITY.md', [
  'GitHub Pages에는 Python API가 포함되지 않는다',
  'npm run dev:api',
  '/api/v1/connectivity',
])
await requireText('docs/PLAYER_DOCK.md', [
  '재생 대기열',
  '이전·다음',
  '반복',
  '재생 속도',
])

try {
  const workflowFiles = await readdir(join(root, '.github', 'workflows'))
  const activeWorkflows = workflowFiles.filter((name) => /\.ya?ml$/i.test(name))
  if (activeWorkflows.length !== 1 || activeWorkflows[0] !== 'ci.yml') {
    failures.push(`.github/workflows: 활성 워크플로는 ci.yml 하나여야 합니다. 현재: ${activeWorkflows.join(', ')}`)
  }
} catch {
  failures.push('.github/workflows: 워크플로 폴더를 읽을 수 없습니다.')
}


const workflowContent = await readFile(join(root, '.github/workflows/ci.yml'), 'utf8')

if (/astral-sh\/setup-uv@v\d+(?:\.\d+){0,2}/.test(workflowContent)) {
  failures.push('.github/workflows/ci.yml: setup-uv는 존재 여부가 변할 수 있는 태그가 아니라 검증된 커밋 SHA로 고정해야 합니다.')
}

for (const legacyAction of ['actions/checkout@v4', 'actions/setup-node@v4', 'actions/setup-python@v4', 'astral-sh/setup-uv@v6', 'actions/configure-pages@v5', 'actions/upload-pages-artifact@v4', 'actions/deploy-pages@v4']) {
  if (workflowContent.includes(legacyAction)) {
    failures.push(`.github/workflows/ci.yml: Node.js 20 기반 액션 ${legacyAction}이 남아 있습니다.`)
  }
}

for (const relativePath of [
  'services/api/app/services/job_manager.py',
  'services/api/app/storage/audio_store.py',
]) {
  const content = await readFile(join(root, relativePath), 'utf8')
  if (/from datetime import .*\bUTC\b/.test(content) || /datetime\.UTC/.test(content)) {
    failures.push(`${relativePath}: Python 3.10과 호환되지 않는 datetime.UTC 사용이 있습니다.`)
  }
}

if (failures.length > 0) {
  console.error('프로젝트 규칙 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`프로젝트 규칙 검사 통과 (v${currentVersion})`)
