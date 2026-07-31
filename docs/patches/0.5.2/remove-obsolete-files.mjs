import { rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const obsolete = ['.github/workflows/deploy-pages.yml']

for (const relativePath of obsolete) {
  await rm(join(root, relativePath), { force: true })
  console.log(`삭제 완료: ${relativePath}`)
}
