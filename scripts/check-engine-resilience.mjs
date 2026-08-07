import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

async function source(path) {
  return readFile(join(root, path), 'utf8')
}

function requireText(text, token, label) {
  if (!text.includes(token)) {
    throw new Error(`${label}: ${token}`)
  }
}

const orchestrator = await source('services/api/app/services/engine_orchestrator.py')
const engineSchema = await source('services/api/app/schemas/engine.py')
const engineRoutes = await source('services/api/app/api/routes/engines.py')
const config = await source('services/api/app/core/config.py')
const systemTts = await source('services/api/app/engines/tts/system_tts.py')
const meloTts = await source('services/api/app/engines/tts/melo_tts.py')
const cosyTts = await source('services/api/app/engines/tts/cosyvoice_worker_tts.py')
const orchestratorTests = await source('services/api/tests/test_engine_orchestrator.py')
const engineCatalogHook = await source('src/hooks/useEngineCatalog.ts')
const voiceApi = await source('src/tts/voiceApi.ts')
const qualityCard = await source('src/components/evaluation/QualityDiagnosticsCard.tsx')

for (const [token, label] of [
  ['probe_in_flight', 'half-open probe state missing'],
  ['_claim_attempt', 'attempt slot arbitration missing'],
  ['max_cooldown_seconds', 'bounded exponential cooldown missing'],
  ['EngineRuntimeBusyError', 'probe reset guard missing'],
  ['circuit_open_count', 'circuit history metrics missing'],
  ['average_latency_ms', 'latency metrics missing'],
  ['active_requests', 'active synthesis guard missing'],
  ['maintenance_in_flight', 'runtime maintenance lock missing'],
]) requireText(orchestrator, token, label)

requireText(engineSchema, '"probing"', 'probing health contract missing')
requireText(config, 'engine_max_cooldown_seconds', 'max cooldown setting missing')
requireText(engineRoutes, '/{engine_id}/runtime/reset', 'runtime reset endpoint missing')
requireText(systemTts, 'def refresh_runtime', 'system voice redetection missing')
requireText(meloTts, 'async def refresh_runtime', 'Melo model recovery missing')
requireText(cosyTts, 'async def refresh_runtime', 'CosyVoice worker reprobe missing')
requireText(orchestratorTests, 'test_half_open_allows_only_one_probe', 'half-open concurrency regression test missing')
requireText(orchestratorTests, 'test_repeated_probe_failure_uses_bounded_exponential_backoff', 'backoff regression test missing')
requireText(orchestratorTests, 'test_runtime_reset_rejects_engine_with_active_synthesis', 'active synthesis reset guard test missing')
requireText(orchestratorTests, 'test_runtime_refresh_blocks_new_synthesis', 'maintenance isolation regression test missing')
requireText(engineCatalogHook, "engine.health === 'cooldown'", 'cooldown-aware Web catalog missing')
requireText(engineCatalogHook, 'invalidateEngineCatalogCache()', 'automatic post-cooldown refresh missing')
requireText(voiceApi, 'resetEngineRuntime', 'Web runtime reset API missing')
requireText(qualityCard, '격리 상태 수동 초기화', 'operator recovery action missing')

console.log('Engine resilience 계약 검사 통과')
