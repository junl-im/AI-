import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const tasks = [
  ['npm lock', process.execPath, ['scripts/refresh-npm-lock.mjs'], root],
  ['API uv lock', process.execPath, ['scripts/refresh-uv-lock.mjs', 'api'], root],
  ['Worker uv lock', process.execPath, ['scripts/refresh-uv-lock.mjs', 'worker'], root],
]
for (const [label, command, args, cwd] of tasks) {
  console.log(`\n=== ${label} ===`)
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if ((result.status ?? 1) !== 0) throw new Error(`${label} 실패 · 종료 코드 ${result.status ?? 1}`)
}
const check = spawnSync(process.execPath, ['scripts/check-lockfiles.mjs'], { cwd: root, stdio: 'inherit' })
if ((check.status ?? 1) !== 0) throw new Error('lock 구조 검사 실패')
console.log('전체 lock 파일 생성 완료')
