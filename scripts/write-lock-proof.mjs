import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const defaultRoot = fileURLToPath(new URL('..', import.meta.url))
const root = process.env.SORION_LOCK_ROOT || defaultRoot
const component = process.argv[2]
const config = {
  npm: ['package-lock.json', 'package.json'],
  api: ['services/api/uv.lock', 'services/api/pyproject.toml'],
  worker: ['services/worker/uv.lock', 'services/worker/pyproject.toml'],
}[component]
if (!config) throw new Error('사용법: node scripts/write-lock-proof.mjs npm|api|worker')

async function sha(path) {
  return createHash('sha256').update(await readFile(join(root, path))).digest('hex')
}
const [lockfile, manifest] = config
const proof = {
  schema: 1,
  component,
  lockfile,
  manifest,
  lockSha256: await sha(lockfile),
  manifestSha256: await sha(manifest),
}
const directory = join(root, '.sorion', 'lock-proof')
await mkdir(directory, { recursive: true })
await writeFile(join(directory, `${component}.json`), `${JSON.stringify(proof, null, 2)}\n`)
console.log(`${component} lock 증명 생성 완료`)
