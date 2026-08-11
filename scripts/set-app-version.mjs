import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const nextVersion = process.argv[2]?.trim()
if (!nextVersion || !/^\d+\.\d+\.\d+$/.test(nextVersion)) {
  console.error('사용법: npm run version:set -- 0.9.9')
  process.exit(1)
}
const previousVersion = (await readFile(join(root, 'VERSION'), 'utf8')).trim()

async function updateJson(relativePath, mutate) {
  const path = join(root, relativePath)
  const value = JSON.parse(await readFile(path, 'utf8'))
  mutate(value)
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function replace(relativePath, from, to) {
  const path = join(root, relativePath)
  const text = await readFile(path, 'utf8')
  if (!text.includes(from)) throw new Error(`${relativePath}: ${from}을 찾지 못했습니다.`)
  await writeFile(path, text.replaceAll(from, to), 'utf8')
}

await writeFile(join(root, 'VERSION'), `${nextVersion}\n`, 'utf8')
await updateJson('package.json', (value) => { value.version = nextVersion })
await updateJson('package-lock.json', (value) => {
  value.version = nextVersion
  value.packages[''].version = nextVersion
})
for (const relativePath of ['services/api/pyproject.toml', 'services/worker/pyproject.toml']) {
  await replace(relativePath, `version = "${previousVersion}"`, `version = "${nextVersion}"`)
}
for (const relativePath of ['services/api/uv.lock', 'services/worker/uv.lock']) {
  const path = join(root, relativePath)
  let text = await readFile(path, 'utf8')
  const projectName = relativePath.includes('/api/') ? 'sorion-api' : 'sorion-cosyvoice-worker'
  const pattern = new RegExp(`(name = "${projectName}"\\nversion = ")([^"]+)(")`)
  if (!pattern.test(text)) throw new Error(`${relativePath}: 프로젝트 버전을 찾지 못했습니다.`)
  text = text.replace(pattern, `$1${nextVersion}$3`)
  await writeFile(path, text, 'utf8')
}
await replace('src/update/buildInfo.ts', `appVersion: '${previousVersion}'`, `appVersion: '${nextVersion}'`)
await replace('src/update/buildInfo.ts', `buildId: '${previousVersion}-`, `buildId: '${nextVersion}-`)

const versionFixtureFiles = [
  'services/api/tests/test_ai_director.py',
  'services/api/tests/test_connectivity.py',
  'services/api/tests/test_engine_catalog.py',
  'services/api/tests/test_engine_strategy.py',
  'services/api/tests/test_evidence.py',
  'services/api/tests/test_health.py',
  'services/api/tests/test_quality.py',
  'services/api/tests/test_setup.py',
]
for (const relativePath of versionFixtureFiles) {
  await replace(relativePath, previousVersion, nextVersion)
}

console.log(`SoriON AI 제품 버전 갱신 완료 · v${previousVersion} -> v${nextVersion}`)
console.log('다음 명령: npm run quality:version-sync')
