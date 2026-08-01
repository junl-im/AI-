import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

function normalize(value) {
  const trimmed = value.trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(trimmed)) return ''
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`
}

const raw = [
  process.env.SORION_PUBLIC_API_BASE_URLS ?? '',
  process.env.SORION_PUBLIC_API_BASE_URL ?? '',
].join(',')
const apiBaseUrls = [...new Set(
  raw.split(/[\n,;]/).map(normalize).filter(Boolean),
)]
const output = resolve('dist/sorion-runtime-config.json')
await mkdir(resolve('dist'), { recursive: true })
await writeFile(output, `${JSON.stringify({ apiBaseUrls }, null, 2)}\n`, 'utf8')
console.log(`[SoriON] runtime API candidates: ${apiBaseUrls.length}`)
