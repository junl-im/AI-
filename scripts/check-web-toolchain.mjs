import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const manifestOnly = process.argv.includes('--manifest-only')
const failures = []
const warnings = []

const expected = {
  '@eslint/js': '9.22.0',
  '@tailwindcss/vite': '4.3.3',
  '@testing-library/dom': '10.4.1',
  '@testing-library/react': '16.3.2',
  '@vitejs/plugin-react': '6.0.5',
  eslint: '9.22.0',
  tailwindcss: '4.3.3',
  typescript: '5.9.3',
  'typescript-eslint': '8.65.0',
  vite: '8.2.0',
  'vite-plugin-pwa': '1.3.0',
  vitest: '4.1.10',
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version)
  return match ? match.slice(1).map(Number) : null
}

function compareVersion(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index]
  }
  return 0
}

function checkRuntime() {
  const runtime = parseVersion(process.versions.node)
  if (!runtime) {
    failures.push(`Node.js 버전을 해석할 수 없습니다: ${process.versions.node}`)
    return
  }
  if (compareVersion(runtime, [22, 12, 0]) < 0 || runtime[0] >= 25) {
    failures.push(
      `지원 Node.js 범위는 >=22.12.0 <25입니다. 현재 버전: ${process.versions.node}`,
    )
  }
}

function isExactVersion(value) {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value)
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

const packageJson = await readJson(join(root, 'package.json'))
const productVersion = (await readFile(join(root, 'VERSION'), 'utf8')).trim()
checkRuntime()

if (packageJson.version !== productVersion) {
  failures.push(`package.json 버전이 VERSION과 다릅니다: ${packageJson.version} != ${productVersion}`)
}
if (packageJson.packageManager !== 'npm@10.9.3') {
  failures.push('packageManager는 npm@10.9.3이어야 합니다.')
}
if (packageJson.volta?.node !== '22.18.0' || packageJson.volta?.npm !== '10.9.3') {
  failures.push('Volta Node/npm 버전은 22.18.0/10.9.3이어야 합니다.')
}
for (const versionFile of ['.nvmrc', '.node-version']) {
  const pinned = (await readFile(join(root, versionFile), 'utf8')).trim()
  if (pinned !== '22.18.0') failures.push(`${versionFile}는 22.18.0이어야 합니다.`)
}
if (packageJson.engines?.node !== '>=22.12.0 <25') {
  failures.push('package.json engines.node는 ">=22.12.0 <25"여야 합니다.')
}
if (packageJson.overrides?.vite !== expected.vite) {
  failures.push(`overrides.vite는 ${expected.vite}로 고정해야 합니다.`)
}

for (const section of ['dependencies', 'devDependencies']) {
  for (const [name, version] of Object.entries(packageJson[section] ?? {})) {
    if (!isExactVersion(version)) {
      failures.push(`${section}.${name}는 정확한 버전이어야 합니다: ${version}`)
    }
  }
}

for (const [name, version] of Object.entries(expected)) {
  const declared = packageJson.dependencies?.[name] ?? packageJson.devDependencies?.[name]
  if (declared !== version) {
    failures.push(`${name} 선언 버전은 ${version}여야 합니다: ${declared ?? '누락'}`)
  }
}

if (packageJson.devDependencies?.['@tailwindcss/vite'] !== packageJson.devDependencies?.tailwindcss) {
  failures.push('@tailwindcss/vite와 tailwindcss 버전은 같아야 합니다.')
}
if (packageJson.devDependencies?.vitest?.startsWith('3.')) {
  failures.push('Vite 8과 호환되지 않는 Vitest 3 계열을 사용할 수 없습니다.')
}

if (!manifestOnly) {
  const nodeModules = join(root, 'node_modules')
  if (!(await exists(nodeModules))) {
    failures.push('node_modules가 없습니다. 먼저 npm install을 실행하세요.')
  } else {
    for (const [name, version] of Object.entries(expected)) {
      const installedPath = join(nodeModules, ...name.split('/'), 'package.json')
      if (!(await exists(installedPath))) {
        failures.push(`설치된 ${name} 패키지를 찾을 수 없습니다.`)
        continue
      }
      const installed = await readJson(installedPath)
      if (installed.version !== version) {
        failures.push(`${name} 설치 버전은 ${version}여야 합니다: ${installed.version}`)
      }
    }
    const pwaPackage = await readJson(join(nodeModules, 'vite-plugin-pwa', 'package.json'))
    const pwaVitePeer = pwaPackage.peerDependencies?.vite ?? ''
    if (!/(?:^|\|\s*)\^8(?:\.0\.0)?(?:\s|$|\|)/.test(pwaVitePeer)) {
      failures.push(`vite-plugin-pwa의 Vite 8 peer 범위를 확인할 수 없습니다: ${pwaVitePeer || '누락'}`)
    }
    const nestedVite = join(nodeModules, 'vitest', 'node_modules', 'vite', 'package.json')
    if (await exists(nestedVite)) {
      const nested = await readJson(nestedVite)
      failures.push(`Vitest 아래 별도 Vite ${nested.version}가 설치됐습니다. 단일 Vite 8 그래프가 필요합니다.`)
    }
    if (!(await exists(join(root, 'package-lock.json')))) {
      warnings.push('package-lock.json이 없습니다. CI가 검증된 bootstrap을 시도하며, 성공한 lock은 main에 자동 반영합니다.')
    }
  }
}

if (warnings.length > 0) {
  console.warn('Web 도구체인 경고')
  warnings.forEach((warning) => console.warn(`- ${warning}`))
}
if (failures.length > 0) {
  console.error('Web 도구체인 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(
  manifestOnly
    ? 'Web 도구체인 manifest 검사 통과'
    : 'Web 도구체인 설치 호환성 검사 통과',
)
