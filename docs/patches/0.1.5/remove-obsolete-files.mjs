import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url))
const obsoleteFiles = ['src/components/ui/BrandMark.tsx']

for (const relativePath of obsoleteFiles) {
  await rm(resolve(repositoryRoot, relativePath), { force: true })
  console.log(`삭제 확인: ${relativePath}`)
}
