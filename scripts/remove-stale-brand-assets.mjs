import { readdir, unlink } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const staleBrandAssets = ['public/sorion-icon.svg']
const ignoredDirectories = new Set([
  '.git', '.venv', 'node_modules', 'dist', 'coverage', '__pycache__',
  '.pytest_cache', '.ruff_cache', '.sorion',
])
let removedCount = 0

for (const relativePath of staleBrandAssets) {
  const fullPath = join(root, relativePath)
  try {
    await unlink(fullPath)
    removedCount += 1
    console.log(`파일 삭제 완료: ${relativePath}`)
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    console.log(`파일은 이미 없음: ${relativePath}`)
  }
}

const gitCheck = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
  cwd: root,
  encoding: 'utf8',
})
if (gitCheck.status === 0) {
  const result = spawnSync(
    'git',
    ['rm', '--cached', '--ignore-unmatch', '--', ...staleBrandAssets],
    { cwd: root, encoding: 'utf8' },
  )
  if (result.status !== 0) {
    console.error(result.stderr || 'Git 인덱스에서 삭제 파일을 제거하지 못했습니다.')
    process.exit(result.status ?? 1)
  }
  if (result.stdout.trim()) console.log(result.stdout.trim())
}

const remainingSvgFiles = []
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue
    const fullPath = join(directory, entry.name)
    if (entry.isDirectory()) {
      await scan(fullPath)
    } else if (extname(entry.name).toLowerCase() === '.svg') {
      remainingSvgFiles.push(relative(root, fullPath))
    }
  }
}
await scan(root)

if (remainingSvgFiles.length) {
  console.error('허용되지 않은 SVG 파일이 남아 있습니다:')
  for (const path of remainingSvgFiles) console.error(`- ${path}`)
  process.exit(1)
}
console.log(`브랜드 잔존 파일 정리 완료 (${removedCount}개 파일 삭제, Git 인덱스 정리)`) 
