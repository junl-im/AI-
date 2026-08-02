import { access, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const packagePath = join(root, 'package.json')
const lockPath = join(root, 'package-lock.json')

try {
  await access(lockPath)
} catch {
  console.log('package-lock.json이 없어 버전 메타데이터 동기화를 건너뜁니다.')
  process.exit(0)
}

const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
const lock = JSON.parse(await readFile(lockPath, 'utf8'))
const rootEntry = lock.packages?.['']
if (!rootEntry) throw new Error('package-lock.json에 packages[""] 항목이 없습니다.')

function sameRecord(left, right) {
  const leftEntries = Object.entries(left).sort(([a], [b]) => a.localeCompare(b))
  const rightEntries = Object.entries(right).sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify(leftEntries) === JSON.stringify(rightEntries)
}

for (const section of ['dependencies', 'devDependencies']) {
  const expected = packageJson[section] ?? {}
  const actual = rootEntry[section] ?? {}
  if (!sameRecord(expected, actual)) {
    throw new Error(
      `package-lock ${section}가 package.json과 다릅니다. lock을 다시 생성하세요.`,
    )
  }
}

lock.version = packageJson.version
rootEntry.version = packageJson.version
await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`, 'utf8')
console.log(`package-lock 루트 버전 동기화 완료: ${packageJson.version}`)
