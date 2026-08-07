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

const lease = await source('services/api/app/services/writer_lease.py')
requireTokens('services/api/app/services/writer_lease.py', lease, [
  'class WriterLeaseCoordinator(Protocol):',
  'backend_name: str',
  'class SQLiteWriterLeaseCoordinator:',
  'backend_name = "sqlite"',
  'def create_writer_lease_coordinator(',
  '지원하지 않는 writer lease backend',
])

const config = await source('services/api/app/core/config.py')
requireTokens('services/api/app/core/config.py', config, [
  'voice_review_writer_lease_backend: str = "sqlite"',
  'voice_review_writer_lease_path:',
])

const main = await source('services/api/app/main.py')
requireTokens('services/api/app/main.py', main, [
  'create_writer_lease_coordinator(',
  'settings.voice_review_writer_lease_backend',
])

const soak = await source('services/api/app/services/runtime_soak.py')
requireTokens('services/api/app/services/runtime_soak.py', soak, [
  'RUNTIME_SOAK_SCHEMA_VERSION = "runtime-soak/2"',
  'class RuntimeRecoveryEvent:',
  'def compare_runtime_soak_reports(',
  'baseline_report_sha256',
  'max_recovery_seconds',
  '"comparison": comparison',
])

const soakRunner = await source('services/api/scripts/run_runtime_soak.py')
requireTokens('services/api/scripts/run_runtime_soak.py', soakRunner, [
  '"--baseline-report"',
  '"--recovery-events"',
  '"--history-output"',
  '_load_recovery_events',
])

const recoveryDrill = await source('services/api/scripts/run_worker_recovery_drill.py')
requireTokens('services/api/scripts/run_worker_recovery_drill.py', recoveryDrill, [
  '"kind": "worker-restart"',
  'signal.SIGTERM',
  'uvicorn',
  'recovery_seconds',
])

const workflow = await source('.github/workflows/ci.yml')
requireTokens('.github/workflows/ci.yml', workflow, [
  'Restore previous runtime soak baseline',
  'Schedule Worker restart recovery drill',
  '--baseline-report ../../.sorion/soak-history/latest.json',
  '--recovery-events ../../.sorion/soak/recovery-events.json',
  'Save runtime soak baseline',
  "steps.runtime-soak.outcome == 'success'",
])

const layout = await source('src/hooks/useDesktopStudioLayout.ts')
requireTokens('src/hooks/useDesktopStudioLayout.ts', layout, [
  'DESKTOP_STUDIO_BREAKPOINT = 1024',
  'calculateDesktopStudioViewport(',
  'DESKTOP_STUDIO_DIVIDER_WIDTH * 2',
])

const layoutTest = await source('src/hooks/useDesktopStudioLayout.test.ts')
requireTokens('src/hooks/useDesktopStudioLayout.test.ts', layoutTest, [
  '[1024, 502]',
  '[1280, 758]',
  '[1440, 918]',
  'uses the full width below the desktop breakpoint',
])

const docs = await source('docs/RECOVERY_SOAK_AND_MANAGED_LOCK.md')
requireTokens('docs/RECOVERY_SOAK_AND_MANAGED_LOCK.md', docs, [
  'Recovery Soak',
  '이전 실행 비교',
  'Worker 재시작',
  'WriterLeaseCoordinator',
  '1024·1280·1440px',
])

if (failures.length > 0) {
  console.error('Recovery soak / managed lock 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Recovery soak / managed lock 계약 검사 통과')
