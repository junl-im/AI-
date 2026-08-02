import { access, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const retiredPaths = ['public/sorion-icon.svg']
const failures = []

async function exists(path) {
  try {
    await access(`${root}/${path}`)
    return true
  } catch {
    return false
  }
}

for (const path of retiredPaths) {
  if (await exists(path)) failures.push(`${path}: 삭제된 파일이 작업 폴더에 다시 생겼습니다.`)
}

const gitCheck = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
  cwd: root,
  encoding: 'utf8',
})
if (gitCheck.status === 0) {
  const tracked = spawnSync('git', ['ls-files', '--', ...retiredPaths], {
    cwd: root,
    encoding: 'utf8',
  })
  for (const path of tracked.stdout.split(/\r?\n/).filter(Boolean)) {
    failures.push(`${path}: Git 인덱스에 계속 추적되고 있습니다. npm run cleanup:stale-brand 후 삭제 커밋이 필요합니다.`)
  }
}

const ignore = await readFile(`${root}/.gitignore`, 'utf8')
const hook = await readFile(`${root}/.githooks/pre-push`, 'utf8')
const cleanup = await readFile(`${root}/scripts/remove-stale-brand-assets.mjs`, 'utf8')
const patchScript = await readFile(`${root}/APPLY_PATCH.sh`, 'utf8')
const deleteList = await readFile(
  `${root}/docs/patches/0.9.3-beta.2/DELETE_LIST.txt`,
  'utf8',
)
if (!hook.includes('npm run quality:stale-files') || !hook.includes('npm run quality:rules')) {
  failures.push('.githooks/pre-push: 삭제 파일·프로젝트 규칙 검사가 없습니다.')
}
if (!cleanup.includes("'rm', '--cached', '--ignore-unmatch'")) {
  failures.push('cleanup:stale-brand가 Git 인덱스를 정리하지 않습니다.')
}
if (!patchScript.includes('apply-delete-list.mjs') || !deleteList.includes(retiredPaths[0])) {
  failures.push('패치 적용기가 DELETE_LIST의 폐기 SVG를 실제 삭제하지 않습니다.')
}
for (const path of retiredPaths) {
  if (!ignore.split(/\r?\n/).includes(`/${path}`)) {
    failures.push(`.gitignore: /${path} 영구 차단 규칙이 없습니다.`)
  }
}

if (failures.length) {
  console.error('삭제 파일 재유입 검사 실패')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('삭제 파일 재유입 검사 통과')
