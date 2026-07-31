import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const ignored = new Set(['.git', '.venv', 'node_modules', 'dist', 'coverage', '__pycache__', '.pytest_cache', '.ruff_cache'])
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.py', '.css'])
const failures = []

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
    const lineCount = content.split(/\r?\n/).length
    if (lineCount > 500) failures.push(`${path}: ${lineCount}줄로 500줄 제한을 초과했습니다.`)

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
await requireText('.github/workflows/ci.yml', [
  'name: SoriON CI & Pages',
  'branches:',
  'astral-sh/setup-uv@v8',
  "python-version: '3.10'",
  'actions/checkout@v6',
  'actions/setup-node@v6',
  'actions/setup-python@v6',
  'actions/configure-pages@v6',
  'actions/upload-pages-artifact@v5',
  'actions/deploy-pages@v5',
])
await requireText('src/test/setup.ts', ["afterEach", "cleanup()", "Blob.prototype.arrayBuffer"])

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
