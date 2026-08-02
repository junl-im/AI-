import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

const inputIndex = process.argv.indexOf('--input')
let raw = ''
let commandStatus = 0

if (inputIndex >= 0) {
  const path = process.argv[inputIndex + 1]
  if (!path) throw new Error('--input 다음에 npm ls JSON 경로가 필요합니다.')
  raw = await readFile(path, 'utf8')
} else {
  const result = spawnSync('npm', ['ls', '--all', '--json', '--long'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  raw = result.stdout
  commandStatus = result.status ?? 1
  if (!raw.trim()) {
    console.error(result.stderr || 'npm ls가 JSON을 반환하지 않았습니다.')
    process.exit(commandStatus || 1)
  }
}

let tree
try {
  tree = JSON.parse(raw)
} catch (error) {
  console.error(`npm ls JSON 해석 실패: ${error.message}`)
  process.exit(1)
}

const failures = new Set(tree.problems ?? [])
const versions = new Map()
let packageCount = 0

function record(name, node, trail) {
  if (!node || typeof node !== 'object') return
  packageCount += 1
  const label = `${trail}${name}`
  for (const problem of node.problems ?? []) failures.add(`${label}: ${problem}`)
  for (const flag of ['invalid', 'missing', 'extraneous', 'peerMissing']) {
    if (node[flag]) failures.add(`${label}: ${flag}`)
  }
  if (typeof node.version === 'string') {
    if (!versions.has(name)) versions.set(name, new Set())
    versions.get(name).add(node.version)
  }
  for (const [childName, child] of Object.entries(node.dependencies ?? {})) {
    record(childName, child, `${label} > `)
  }
}

for (const [name, node] of Object.entries(tree.dependencies ?? {})) record(name, node, '')

const viteVersions = [...(versions.get('vite') ?? [])]
if (viteVersions.length !== 1 || viteVersions[0] !== '8.2.0') {
  failures.add(`Vite 설치 버전은 8.2.0 하나여야 합니다: ${viteVersions.join(', ') || '없음'}`)
}
const vitestVersions = [...(versions.get('vitest') ?? [])]
if (vitestVersions.length !== 1 || vitestVersions[0] !== '4.1.10') {
  failures.add(`Vitest 설치 버전은 4.1.10 하나여야 합니다: ${vitestVersions.join(', ') || '없음'}`)
}

if (commandStatus !== 0 && failures.size === 0) {
  failures.add(`npm ls가 종료 코드 ${commandStatus}을 반환했습니다.`)
}
if (failures.size > 0) {
  console.error('npm 전체 의존성 트리 검사 실패')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log(`npm 전체 의존성 트리 검사 통과 · ${packageCount}개 노드 · Vite ${viteVersions[0]}`)
