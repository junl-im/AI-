import { readFile } from 'node:fs/promises'
import process from 'node:process'

const catalog = await readFile(
  new URL('../services/api/app/services/engine_catalog.py', import.meta.url),
  'utf8',
)
const strategy = await readFile(
  new URL('../services/api/app/services/engine_strategy.py', import.meta.url),
  'utf8',
)
const routes = await readFile(
  new URL('../services/api/app/api/routes/engines.py', import.meta.url),
  'utf8',
)

const requiredCatalogSnippets = [
  'id="cosyvoice3"',
  'id="melo"',
  'id="f5-tts"',
  'decision="research-only"',
  'id="kokoro"',
  'decision="excluded"',
  'id="openvoice-v2"',
  'id="seed-vc"',
  'decision="external-plugin"',
  'id="faster-whisper"',
  'id="deepfilternet3"',
  'id="rule-director"',
]
const failures = []
for (const snippet of requiredCatalogSnippets) {
  if (!catalog.includes(snippet)) failures.push(`engine_catalog.py: ${snippet}`)
}
if (!strategy.includes('_FREE_ORDER = ["cosyvoice3", "melo", "system", "mock"]')) {
  failures.push('engine_strategy.py: 무료 자동 순서가 변경되었습니다.')
}
for (const forbidden of ['f5-tts', 'kokoro', 'seed-vc', 'gpt-sovits']) {
  const orderLine = strategy.match(/_FREE_ORDER\s*=\s*\[[^\]]+\]/)?.[0] ?? ''
  if (orderLine.includes(forbidden)) {
    failures.push(`engine_strategy.py: ${forbidden}은 자동 순서에 들어갈 수 없습니다.`)
  }
}
if (!routes.includes('@router.get("/catalog"')) {
  failures.push('engines.py: /engines/catalog API가 없습니다.')
}

if (failures.length) {
  console.error('Engine blueprint check failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Engine blueprint check passed.')
