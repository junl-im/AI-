import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const allowMissing = process.argv.includes('--allow-missing')
const failures = []
const missing = []

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

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
  if (rootEntry?.version !== packageJson.version) {
    failures.push(`package-lock 루트 버전 불일치: ${rootEntry?.version ?? '누락'}`)
  }
  for (const section of ['dependencies', 'devDependencies']) {
    for (const [name, version] of Object.entries(packageJson[section] ?? {})) {
      if (rootEntry?.[section]?.[name] !== version) {
        failures.push(`package-lock ${section}.${name} 불일치`)
      }
      const lockKey = `node_modules/${name}`
      if (!lock.packages?.[lockKey]) failures.push(`package-lock에 ${lockKey}가 없습니다.`)
    }
  }
}

for (const relativePath of ['services/api/uv.lock', 'services/worker/uv.lock']) {
  const path = join(root, relativePath)
  if (!(await exists(path))) {
    missing.push(relativePath)
    continue
  }
  const content = await readFile(path, 'utf8')
  if (!content.includes('version = 1')) failures.push(`${relativePath}: uv lock format version 1이 아닙니다.`)
  if (!content.includes('requires-python')) failures.push(`${relativePath}: requires-python이 없습니다.`)
}

if (missing.length > 0) {
  const message = `누락된 lock 파일: ${missing.join(', ')}`
  if (allowMissing) console.warn(`${message}. npm run locks:refresh로 생성하세요.`)
  else failures.push(message)
}
if (failures.length > 0) {
  console.error('Lock 파일 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(missing.length > 0 ? 'Lock 전환 준비 상태 검사 완료' : 'Lock 파일 구조 검사 통과')
