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
    if (extension === '.svg') {
      failures.push(`${path}: 브랜드 원본은 PNG이며 SVG 파일은 허용하지 않습니다.${path === 'public/sorion-icon.svg' ? ' npm run cleanup:stale-brand 실행 후 Git 삭제를 커밋하세요.' : ''}`)
    }
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
async function requireAbsent(relativePath, forbiddenTexts) {
  const fullPath = join(root, relativePath)
  let content = ''
  try {
    content = await readFile(fullPath, 'utf8')
  } catch {
    failures.push(`${relativePath}: 필수 파일이 없습니다.`)
    return
  }
  for (const forbiddenText of forbiddenTexts) {
    if (content.includes(forbiddenText)) {
      failures.push(`${relativePath}: 금지된 구문 "${forbiddenText}"가 남아 있습니다.`)
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
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')); const currentVersion = packageJson.version
await requireText('DELIVERY_RULES.md', [
  '## 1. 결과',
  '## 2. 전체 통파일 ZIP과 덮어쓰기용 패치 ZIP',
  '## 3. 다음 예상 업데이트 내역',
  '## 임시채팅 인수인계 메모리 절대 규칙',
  'docs/HANDOVER.md',
])
await requireText('docs/HANDOVER.md', [
  currentVersion,
  '임시채팅 영구 메모리 원본',
  '## 2. 프로젝트의 궁극적 목표',
  '## 4. 사용자가 확정한 UX·디자인',
  '## 6. 현재 아키텍처와 배포 현실',
  '## 18. 알려진 제한과 위험',
  '## 19. 절대 전달 규칙',
  '## 21. 다음 목표',
])
const handoverContent = await readFile(join(root, 'docs/HANDOVER.md'), 'utf8')
const handoverLineCount = handoverContent.split(/\r?\n/).length
if (handoverLineCount > 500) {
  failures.push(`docs/HANDOVER.md: ${handoverLineCount}줄로 500줄 제한을 초과했습니다.`)
}
await requireText('docs/CHANGELOG.md', [`## ${currentVersion}`])
await requireText('docs/NEXT_UPDATE.md', ['# NEXT UPDATE', '## 목표 버전'])
await requireText('docs/RELEASE.md', ['전체 통파일 ZIP', '덮어쓰기용 패치 ZIP'])
await requireText('docs/ENGINE_STRATEGY.md', ['CosyVoice Worker', '무료 로컬', '품질 결정 방식'])
await requireText('services/api/app/api/routes/engines.py', [
  '/strategy',
  'current_engine_strategy',
])
await requireText('services/api/app/services/job_manager.py', [
  'return cast(T, await asyncio.shield(task))',
  'self._request_keys: dict[str, str] = {}',
  'raise JobConflictError(job_id)',
  'result = await asyncio.wait_for(',
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
  'CosyVoice Worker quality · Python 3.10',
  'working-directory: services/worker',
  'Run Worker tests',
  'Check free-only boundary', 'Check web toolchain manifest', 'Check installed web toolchain',
  'Validate full dependency tree', "node-version: '22.18.0'", 'Write empty static-host runtime configuration', 'Lockfiles · generate or verify', 'actions/upload-artifact@v4', 'actions/download-artifact@v4', 'npm ci --no-audit --no-fund', 'uv sync --locked', 'generate_lockfiles', 'Check lock bootstrap selector', 'Detect lockfile mode', 'Generate and audit missing or explicitly refreshed lockfiles', "steps.lock-mode.outputs.mode == 'generate'", "steps.lock-mode.outputs.mode == 'verify'", 'npm run locks:mode',
])
await requireText('.nvmrc', ['22.18.0']); await requireText('.node-version', ['22.18.0'])
await requireText('docs/LOCKFILE_BOOTSTRAP.md', ['자동 bootstrap', 'generate_lockfiles', 'package-lock.json', 'services/api/uv.lock', 'services/worker/uv.lock', 'npm ci', 'uv sync --locked'])
await requireText('src/test/setup.ts', ['afterEach', 'cleanup()', 'Object.defineProperty(Blob.prototype', "reader.readAsArrayBuffer(this)"])
await requireText('src/tts/mockWave.test.ts', ['async function readBlob', "typeof blob.arrayBuffer === 'function'", 'reader.readAsArrayBuffer(blob)'])
await requireText('src/components/ui/BrandIcon.tsx', ['sorion-logo.png', 'SoriON AI']); await requireText('src/tts/browserSpeech.ts', ["BROWSER_SPEECH_ENGINE_ID = 'browser-speech'", "mode: 'browser'", 'recommended: false', 'SpeechSynthesisUtterance']); await requireText('src/tts/browserSpeech.test.ts', ['API 없는 결과를 다운로드 없는 실제 브라우저 재생 결과로 만든다', '한국어 목소리를 우선 선택하고 utterance에 속도를 반영한다'])
await requireText('src/components/layout/BrandMasthead.tsx', [
  'BrandIcon',
  'SoriON AI 첫 페이지',
  '장문 원고를 문장별 음성으로 빠르게.',
])
await requireText('src/components/layout/BrandMasthead.test.tsx', [
  '공식 아이콘과 제품·제작자 이름을 보여준다',
  '현재 장문 중심 소개 문구를 순환한다',
  'SoriON AI 첫 페이지',
])
await requireText('src/pages/VoiceClonePage.tsx', [
  '실제 AI 음성으로 연결합니다.',
  'prepareVoiceCloneProfile',
  'startVoiceCloneJob',
  'cancelVoiceCloneJob',
  'retryVoiceCloneJob',
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
  '만들기 화면에서는 음성이 없어도 고정 재생바를 표시한다',
  '완성 음성이 생기면 만들기 재생바에서 바로 재생할 수 있다',
  '더빙 재생 플레이어',
])
await requireText('src/components/layout/AppShell.tsx', [
  'soa-workspace-shell--has-player',
  'soa-workspace-shell--editor',
  'CompactWorkspaceHeader',
  'BrandMasthead',
  '{workspaceEntered ? <LinkedPlayerDock /> : null}',
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
await requireText('services/worker/app/main.py', [
  '@app.get("/health"',
  '@app.get("/ready"',
  '/v1/jobs/{job_id}/events',
  '/v1/jobs/{job_id}/audio',
])
await requireText('services/worker/app/jobs.py', [
  '실패하거나 취소된 구간만 다시 시도합니다.',
  'merge_wav_files',
  'first_audio_ms',
])
await requireText('services/worker/app/adapters/cosyvoice3.py', [
  'AutoModel',
  'inference_cross_lingual',
  '스트리밍 음성 조각',
])
await requireText('services/api/app/api/routes/voice_clones.py', [
  '/profiles/{profile_id}/jobs',
  '/jobs/{job_id}/cancel',
  '/jobs/{job_id}/retry',
  '/jobs/{job_id}/events',
])
await requireText('src/components/clone/CloneExecutionCard.tsx', [
  'REAL CLONE EXECUTION',
  '실패·취소 구간만 다시 시도',
  'Linked Player Dock에 연결했습니다.',
])
await requireText('docs/COSYVOICE_WORKER.md', [
  'GET /health',
  'GET /ready',
  'SORION_WORKER_MODEL_PATH',
  '실패하거나 취소된 구간만 다시 실행',
])
await requireText('src/api/httpClient.ts', ['X-SoriON-Client-ID', 'getApiConnectionProblem', 'rememberApiUrl'])
await requireText('src/api/apiConnection.ts', [
  'sorion-api-last-good-url',
  'sorion-api-url-history',
  'mobile-localhost',
  'mixed-content',
  'source: ApiBaseSource',
  'isKnownStaticHostingHostname',
])
await requireText('src/tts/voiceApi.ts', ['recoverSpeechResult', '/result', 'retries: 0'])
await requireText('services/api/app/api/routes/tts.py', ['@router.get("/jobs/{job_id}/result"', 'get_result'])
await requireText('services/api/app/main.py', ['PrivateNetworkCORSMiddleware', 'X-SoriON-Client-ID', 'X-Request-ID'])
await requireText('services/api/app/middleware/private_network_cors.py', ['Access-Control-Request-Private-Network', 'Access-Control-Allow-Private-Network', 'Disallowed CORS private-network'])
await requireText('services/api/app/services/sqlite_job_store.py', ['BEGIN IMMEDIATE', 'CREATE TABLE IF NOT EXISTS tts_jobs', 'claim_expires_at', 'cancel_requested'])
await requireText('services/api/app/main.py', ['SQLiteJobStore', 'job_store_file'])
await requireText('.env.example', ['SORION_JOB_STORE_PATH=.sorion/jobs.sqlite3', 'SORION_JOB_RESULT_TTL_MINUTES=30', 'SORION_JOB_HISTORY_TTL_HOURS=24'])
await requireText('.env.example', ['SORION_TTS_ENGINE_ORDER=cosyvoice3,melo,system,mock'])
await requireText('services/api/app/services/engine_strategy.py', ['free_only=True', 'firebase-static-plus-local-runtime'])
await requireText('services/api/app/api/routes/tts.py', ['/jobs/{job_id}/events', 'text/event-stream'])
await requireText('src/tts/jobProgressStream.ts', ['streamSpeechProgress', 'text/event-stream'])
await requireText('src/pages/SettingsPage.tsx', ['무료 전용 자동'])
await requireText('docs/FREE_ONLY_ENGINE_POLICY.md', ['FREE-ONLY', 'CosyVoice Worker'])
await requireText('docs/FIREBASE_SPARK_FREE_DEPLOYMENT.md', ['hosting', 'localhost'])
await requireText('docs/PROGRESSIVE_TTS_STREAMING.md', ['polling', 'X-Accel-Buffering'])
await requireText('src/settings/connectivityTypes.ts', ['workerHealthy', 'gpuReady', 'recommendedRecheckSeconds'])
await requireText('docs/MOBILE_ENGINE_RELIABILITY.md', ['API·TTS·Worker·GPU', 'GET  /api/v1/tts/jobs/{job_id}/result', 'SORION_ALLOW_PRIVATE_NETWORK=true', '0.8.3 서버 재시작·다중 프로세스 복구'])
await requireText('src/pages/HomePage.tsx', [
  'soa-dubbing-workspace',
  'DubbingStudioHeader',
  'DubbingVoiceControls',
  'LongformComposer',
  'timeline.stageText',
  'requestAutomaticApiReconnect',
  'timeline.restoreProject',
  'clearTimeline()',
  'clearQueue()',
])
await import('./check-session-rules.mjs')
await requireText('src/pages/LandingHome.tsx', [
  '장문 음성 스튜디오 시작',
  '긴 원고도,',
  '문장별 목소리로 완성합니다.',
])
await requireText('src/components/workspace/LongformComposer.tsx', [
  'MAX_SCRIPT_LENGTH = 20_000',
  '음성으로 만들 장문 원고',
  '새 더빙을 입력해 주세요.',
  '전체 원고 음성 제작',
])
await requireText('src/components/workspace/VoiceLibrary.tsx', [
  '목소리 라이브러리',
  '새 보이스 만들기',
  'previewingId',
])
await requireText('src/components/workspace/TimelineEditor.tsx', [
  '음성 블록 편집',
  '문장 나누기',
  '생성 실패',
  '쉼 추가',
  'onAddVoice',
])
await requireText('src/components/navigation/LinkedPlayerDock.tsx', [
  "window.scrollTo({ top: 0, behavior: 'smooth' })",
])
await requireText('src/components/workspace/DubbingStudioHeader.tsx', ['프로젝트 제목', '현재 음성 다운로드', '현재 작업 비우기', '프로젝트 메뉴 열기', 'aria-expanded={projectMenuOpen}']); await requireAbsent('src/components/workspace/DubbingStudioHeader.tsx', ['<details', '<summary'])
await requireText('src/components/workspace/TimelineEditor.tsx', ['번 대사 블록 메뉴 열기', 'aria-expanded={blockMenuOpen}']); await requireAbsent('src/components/workspace/TimelineEditor.tsx', ['<details', '<summary'])
await requireText('docs/DUBBING_STUDIO_UX.md', ['더빙 스튜디오', '하단 고정 플레이어', 'workspace reset'])
await requireText('src/components/workspace/DubbingVoiceControls.tsx', ['VoicePickerSheet', 'VoiceSettingsSheet', '음성 설정 열기'])
await requireText('src/styles/dubbing-overlays.css', ['.soa-dubbing-player-dock', '.soa-bottom-sheet', '.soa-dubbing-add-block'])
await requireText('services/api/app/schemas/tts.py', [
  'normalize_text: bool = True',
])
await requireText('services/api/app/services/tts_pipeline.py', [
  'if request.normalize_text:',
  'NormalizationResult(',
])
await requireText('src/styles/workspace-editor.css', [
  '.soa-editor-workspace',
  '.soa-voice-library',
])
await requireText('src/styles/longform-studio.css', [
  '.soa-script-stage',
  '.soa-longform-studio',
  '.soa-longform-submit',
])
await requireText('src/styles/brand-navigation.css', [
  '.soa-brand-mark',
  '.soa-exit-dialog',
])
await requireText('src/styles/timeline-editor.css', [
  '.soa-timeline-block--voice.is-ready',
  '.soa-timeline-block--voice.is-failed',
  '.soa-timeline-block--pause',
])
await requireText('src/styles/workspace-shell.css', [
  '.soa-workspace-shell--landing',
  '.soa-workspace-shell--editor',
  '.soa-compact-header',
])
await requireText('src/api/httpClient.ts', [
  'getApiConnectionContext',
  '배포된 음성 서버 주소가 설정되지 않았습니다.',
  'discoverApiBaseUrl',
  'probeApiBaseUrl',
  'requestAutomaticApiReconnect',
  'resolveApiAssetUrl',
])
await requireText('src/hooks/useBackendBootstrap.ts', ['discoverApiBaseUrl', 'saveApiBaseUrl', 'sorion-api-reconnect'])
await requireText('src/hooks/useExitConfirmation.ts', [
  'popstate', 'window.history.go(-2)',
  'window.history.back()',
])
await import('./check-web-test-contracts.mjs')
await requireText('src/components/ui/ExitConfirmDialog.tsx', [
  'SoriON을 닫을까요?',
  '뒤로가기를 한 번 더 누르면 바로 종료됩니다.',
])
await requireText('src/pages/ProjectsPage.tsx', ['openProject(project)', '프로젝트 불러오기', '불러오기 →'])
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
await requireText('docs/API_CONNECTIVITY.md', ['정적 호스트 보호', 'npm run dev:free', '127.0.0.1:8000'])
await requireText('docs/PLAYER_DOCK.md', [
  '재생 대기열',
  '이전·다음',
  '반복',
  '재생 속도',
])
await requireText('services/worker/app/security.py', [
  'X-SoriON-Service-Token'.toLowerCase(),
  'SOA-W7005',
  'hmac.compare_digest',
])
await requireText('services/api/app/services/worker_auth.py', [
  'X-SoriON-Service-Token',
  'X-SoriON-Signature',
  'hashlib.sha256',
])
await requireText('services/worker/app/main.py', [
  'Last-Event-ID',
  'id: {current.revision}',
  'WorkerAuditLogger',
  'FixedWindowRateLimiter',
])
await requireText('services/api/app/main.py', [
  'X-RateLimit-Remaining',
  'AuditLogger',
  'FixedWindowRateLimiter',
])
await requireText('docs/SECURITY.md', [
  'HMAC-SHA256',
  '서비스 토큰',
  '감사 로그',
])
await requireText('services/worker/app/security.py', [
  'from collections.abc import Mapping',
])
await requireAbsent('services/worker/app/security.py', [
  'from typing import Mapping',
])
await requireText('services/worker/app/runtime.py', [
  'from collections.abc import Awaitable, Callable',
  'factory = module.create_runtime',
])
await requireAbsent('services/worker/app/runtime.py', [
  'from typing import Awaitable, Callable',
  'getattr(module, "create_runtime")',
])
await requireText('services/worker/app/main.py', [
  'Annotated[UploadFile, File()]',
  'Annotated[str, Form(min_length=1, max_length=80)]',
])
await requireAbsent('services/worker/app/main.py', [
  'sample: UploadFile = File()',
])
await requireAbsent('services/api/tests/test_cosyvoice_worker.py', [
  'import json',
])
await requireText('src/tts/segmentText.ts', [
  '.flatMap((sentence) => splitOversized(sentence, maxChars))',
])
await requireText('src/pages/VoiceClonePage.tsx', [
  'const activeJobId = job?.id ?? null',
  'const activeJobStatus = job?.status ?? null',
  '[activeJobId, activeJobStatus]',
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
