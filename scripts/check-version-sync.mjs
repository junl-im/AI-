import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []
const version = (await readFile(join(root, 'VERSION'), 'utf8')).trim()
const semver = /^\d+\.\d+\.\d+$/

if (!semver.test(version)) failures.push(`VERSION 형식이 x.y.z가 아닙니다: ${version}`)

const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const packageLock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'))
if (packageJson.version !== version) failures.push(`package.json: ${packageJson.version}`)
if (packageLock.version !== version) failures.push(`package-lock.json: ${packageLock.version}`)
if (packageLock.packages?.['']?.version !== version) failures.push(`package-lock root: ${packageLock.packages?.['']?.version}`)

for (const relativePath of ['services/api/pyproject.toml', 'services/worker/pyproject.toml']) {
  const text = await readFile(join(root, relativePath), 'utf8')
  if (!text.includes(`version = "${version}"`)) failures.push(`${relativePath}: 제품 버전 불일치`)
}
for (const relativePath of ['services/api/uv.lock', 'services/worker/uv.lock']) {
  const text = await readFile(join(root, relativePath), 'utf8')
  if (!text.includes(`name = "sorion-`) || !text.includes(`version = "${version}"`)) {
    failures.push(`${relativePath}: 프로젝트 버전 불일치`)
  }
}

const requiredRuntimeTexts = new Map([
  ['src/components/layout/BrandMasthead.tsx', ['currentBuildInfo.appVersion', 'VERSION']],
  ['src/update/buildInfo.ts', [`appVersion: '${version}'`, 'formatBuildDiagnosticsLabel']],
  ['vite.config.ts', ['appVersion: packageJson.version', "fileName: 'version.json'"]],
  ['services/api/app/version.py', ['SORION_APP_VERSION', 'VERSION']],
  ['services/worker/app/version.py', ['SORION_APP_VERSION', 'VERSION']],
])
for (const [relativePath, required] of requiredRuntimeTexts) {
  const text = await readFile(join(root, relativePath), 'utf8')
  for (const fragment of required) {
    if (!text.includes(fragment)) failures.push(`${relativePath}: ${fragment} 누락`)
  }
}

if (failures.length) {
  console.error('제품 버전 동기화 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`제품 버전 동기화 통과 · v${version}`)
