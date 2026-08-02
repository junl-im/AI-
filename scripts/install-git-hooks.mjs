import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
if (!existsSync(`${root}/.git`)) {
  console.log('Git 저장소가 아니므로 로컬 hook 설치를 건너뜁니다.')
  process.exit(0)
}

const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
  cwd: root,
  encoding: 'utf8',
})
if (result.status !== 0) {
  console.error(result.stderr || 'Git hook 경로를 설정하지 못했습니다.')
  process.exit(result.status ?? 1)
}
console.log('Git hook 설치 완료: core.hooksPath=.githooks')
