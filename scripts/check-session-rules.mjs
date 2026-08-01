import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const requirements = new Map([
  ['src/pages/HomePage.tsx', ['useWorkspaceSessionPersistence', 'workspaceResetToken']],
  ['src/storage/database.ts', [
    'DATABASE_VERSION = 4',
    "WORKSPACE_SESSION_STORE = 'workspaceSessions'",
    'onversionchange',
  ]],
  ['src/workspace/workspaceSessionRepository.ts', [
    'saveToIndexedDb',
    'localstorage',
    'memory',
    'isNewer(current, session)',
    'checkpointWorkspaceSession',
  ]],
  ['src/hooks/useWorkspaceSessionPersistence.ts', [
    'pagehide',
    'persistCurrentDraft(true)',
    'visibilitychange',
    'dirtyBeforeHydrationRef',
    'loadPromiseRef',
  ]],
  ['src/hooks/useTimelineGeneration.ts', [
    'latestBlock.revision !== revision',
    'restoreSession',
    'revision: block.revision + 1',
  ]],
  ['docs/WORKSPACE_SESSION.md', ['IndexedDB', 'Object URL', 'revision', 'localStorage']],
])

const failures = []
for (const [relativePath, texts] of requirements) {
  let content = ''
  try {
    content = await readFile(join(root, relativePath), 'utf8')
  } catch {
    failures.push(`${relativePath}: 필수 파일이 없습니다.`)
    continue
  }
  for (const text of texts) {
    if (!content.includes(text)) failures.push(`${relativePath}: 필수 문구 "${text}"가 없습니다.`)
  }
}

if (failures.length > 0) {
  console.error('0.9.1 세션 규칙 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
