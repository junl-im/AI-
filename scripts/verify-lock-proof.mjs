import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const defaultRoot = fileURLToPath(new URL('..', import.meta.url))
const root = process.env.SORION_LOCK_ROOT || defaultRoot
const requested = process.argv[2] || 'all'
const components = requested === 'all' ? ['npm', 'api', 'worker'] : [requested]
if (components.some((item) => !['npm', 'api', 'worker'].includes(item))) {
  throw new Error('사용법: node scripts/verify-lock-proof.mjs npm|api|worker|all')
}
async function sha(path) {
  return createHash('sha256').update(await readFile(join(root, path))).digest('hex')
}
for (const component of components) {
  const proof = JSON.parse(await readFile(join(root, '.sorion', 'lock-proof', `${component}.json`), 'utf8'))
  if (proof.schema !== 1 || proof.component !== component) throw new Error(`${component} lock 증명 형식 오류`)
  if (await sha(proof.lockfile) !== proof.lockSha256) throw new Error(`${component} lock SHA-256 불일치`)
  if (await sha(proof.manifest) !== proof.manifestSha256) throw new Error(`${component} manifest SHA-256 불일치`)
  console.log(`${component} lock 증명 검증 통과`)
}
