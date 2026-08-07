import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))

async function requireTokens(relative, tokens) {
  const source = await readFile(join(root, relative), 'utf8')
  const missing = tokens.filter((token) => !source.includes(token))
  if (missing.length) throw new Error(`${relative}: 계약 누락 · ${missing.join(', ')}`)
}

await requireTokens('services/api/app/schemas/verification.py', ['class WorkerTelemetryAggregate', 'group_key: str'])
await requireTokens('services/api/app/api/routes/verification.py', ['"group_key": group_key'])
await requireTokens('src/quality/qualityTypes.ts', ['export interface WorkerTelemetryAggregate', 'groupKey: string'])
await requireTokens('src/quality/qualityApi.ts', ['group_key: string', 'groupKey: item.group_key'])
await requireTokens('src/components/evaluation/RuntimeSoakComparisonCard.tsx', ['RUNTIME SOAK COMPARE', 'compareRuntimeSoakReports'])
await requireTokens('src/quality/recoveryInjection.ts', ['online-resume', 'page-resume', 'network-change', 'sorion-engine-refresh'])
await requireTokens('src/tts/browserVoiceInventory.ts', ['sorion.browser-voice-inventory.v1', 'observeBrowserVoiceInventory', 'previousFingerprint'])
await requireTokens('src/hooks/useEngineCatalog.ts', ['voiceschanged', 'invalidateEngineCatalogCache'])

console.log('Recovery evidence / voice inventory 계약 검사 통과')
