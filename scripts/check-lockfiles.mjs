import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const allowMissing = process.argv.includes('--allow-missing')
const componentIndex = process.argv.indexOf('--component')
const component = componentIndex >= 0 ? process.argv[componentIndex + 1] : 'all'
if (!['all', 'npm', 'api', 'worker'].includes(component)) {
  throw new Error('--component는 all|npm|api|worker 중 하나여야 합니다.')
}
const failures = []
const missing = []

async function exists(path) {
  try { await access(path); return true } catch { return false }
}

if (component === 'all' || component === 'npm') {
  const packagePath = join(root, 'package.json')
  const lockPath = join(root, 'package-lock.json')
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
  if (!(await exists(lockPath))) {
    missing.push('package-lock.json')
  } else {
    const lock = JSON.parse(await readFile(lockPath, 'utf8'))
    if (lock.lockfileVersion < 3) failures.push('package-lock.json lockfileVersion은 3 이상이어야 합니다.')
    const rootEntry = lock.packages?.['']
    if (!rootEntry) failures.push('package-lock.json에 루트 packages[""] 항목이 없습니다.')
    if (rootEntry?.version !== packageJson.version) failures.push(`package-lock 루트 버전 불일치: ${rootEntry?.version ?? '누락'}`)
    for (const section of ['dependencies', 'devDependencies']) {
      for (const [name, version] of Object.entries(packageJson[section] ?? {})) {
        if (rootEntry?.[section]?.[name] !== version) failures.push(`package-lock ${section}.${name} 불일치`)
        if (!lock.packages?.[`node_modules/${name}`]) failures.push(`package-lock에 node_modules/${name}가 없습니다.`)
      }
    }
  }
}

for (const [name, relativePath] of [
  ['api', 'services/api/uv.lock'],
  ['worker', 'services/worker/uv.lock'],
]) {
  if (component !== 'all' && component !== name) continue
  const path = join(root, relativePath)
  if (!(await exists(path))) {
    missing.push(relativePath)
    continue
  }
  const content = await readFile(path, 'utf8')
  if (!content.includes('version = 1')) failures.push(`${relativePath}: uv lock format version 1이 아닙니다.`)
  if (!content.includes('requires-python')) failures.push(`${relativePath}: requires-python이 없습니다.`)
}

if (missing.length) {
  const message = `누락된 lock 파일: ${missing.join(', ')}`
  if (allowMissing) console.warn(`${message}. component lock 생성 작업을 실행하세요.`)
  else failures.push(message)
}
if (failures.length) {
  console.error('Lock 파일 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(missing.length ? 'Lock 전환 준비 상태 검사 완료' : `${component} lock 파일 구조 검사 통과`)
