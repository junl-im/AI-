import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const logoPath = resolve(root, 'public', 'sorion-logo.png')
const maximumBytes = 1_572_864 // 1.5 MiB safety margin below Workbox's 2 MiB default.
const maximumDimension = 1024
const failures = []

const info = await stat(logoPath)
if (info.size > maximumBytes) {
  failures.push(`public/sorion-logo.png: ${info.size} bytes exceeds ${maximumBytes} bytes`)
}

const png = await readFile(logoPath)
const expectedSignature = '89504e470d0a1a0a'
if (png.subarray(0, 8).toString('hex') !== expectedSignature) {
  failures.push('public/sorion-logo.png: invalid PNG signature')
} else {
  const width = png.readUInt32BE(16)
  const height = png.readUInt32BE(20)
  if (width > maximumDimension || height > maximumDimension) {
    failures.push(`public/sorion-logo.png: ${width}x${height} exceeds ${maximumDimension}px`)
  }
}

const viteConfig = await readFile(resolve(root, 'vite.config.ts'), 'utf8')
if (!viteConfig.includes("includeAssets: ['sorion-logo.png', 'favicon-64.png']")) {
  failures.push('vite.config.ts: PWA logo includeAssets contract is missing')
}

if (failures.length) {
  console.error('PWA asset 검사 실패')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log(`PWA asset 검사 통과 · sorion-logo.png ${info.size} bytes`)
