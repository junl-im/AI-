import { readFile, rm } from 'node:fs/promises'
import { isAbsolute, join, normalize, relative } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const listPath = process.argv[2]
if (!listPath) {
  console.error('사용법: node scripts/apply-delete-list.mjs <DELETE_LIST.txt>')
  process.exit(2)
}

const content = await readFile(join(root, listPath), 'utf8')
const entries = content
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))

for (const entry of entries) {
  const normalized = normalize(entry).replaceAll('\\', '/')
  const target = join(root, normalized)
  const escaped = isAbsolute(entry) || relative(root, target).startsWith('..')
  if (escaped || normalized === '.' || normalized.startsWith('../')) {
    throw new Error(`안전하지 않은 삭제 경로입니다: ${entry}`)
  }
  await rm(target, { force: true, recursive: true })
  console.log(`삭제 적용: ${normalized}`)
}

const gitCheck = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
  cwd: root,
  encoding: 'utf8',
})
if (gitCheck.status === 0 && entries.length) {
  const result = spawnSync(
    'git',
    ['rm', '--cached', '--ignore-unmatch', '--', ...entries],
    { cwd: root, encoding: 'utf8' },
  )
  if (result.status !== 0) {
    console.error(result.stderr || 'Git 인덱스 삭제 적용에 실패했습니다.')
    process.exit(result.status ?? 1)
  }
  if (result.stdout.trim()) console.log(result.stdout.trim())
}
console.log(`DELETE_LIST 적용 완료 (${entries.length}개)`) 
