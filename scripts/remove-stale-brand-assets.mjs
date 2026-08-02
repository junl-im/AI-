import { readdir, unlink } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const staleBrandAssets = ['public/sorion-icon.svg']
const ignoredDirectories = new Set([
  '.git',
  '.venv',
  'node_modules',
  'dist',
  'coverage',
  '__pycache__',
  '.pytest_cache',
  '.ruff_cache',
  '.sorion',
])

let removedCount = 0

for (const relativePath of staleBrandAssets) {
  const fullPath = join(root, relativePath)
  try {
    await unlink(fullPath)
    removedCount += 1
    console.log(`삭제 완료: ${relativePath}`)
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    console.log(`이미 없음: ${relativePath}`)
  }
}

const remainingSvgFiles = []

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue
    const fullPath = join(directory, entry.name)
    if (entry.isDirectory()) {
      await scan(fullPath)
      continue
    }
    if (extname(entry.name).toLowerCase() === '.svg') {
      remainingSvgFiles.push(relative(root, fullPath))
    }
  }
}

await scan(root)

if (remainingSvgFiles.length > 0) {
  console.error('허용되지 않은 SVG 파일이 남아 있습니다:')
  for (const path of remainingSvgFiles) console.error(`- ${path}`)
  process.exitCode = 1
} else {
  console.log(`브랜드 잔존 파일 정리 완료 (${removedCount}개 삭제)`)
}
