import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

async function source(path) {
  return readFile(join(root, path), 'utf8')
}

function requireText(text, token, label) {
  if (!text.includes(token)) throw new Error(`${label}: ${token}`)
}

const timeline = await source('src/components/workspace/TimelineEditor.tsx')
const timelineHook = await source('src/hooks/useTimelineGeneration.ts')
const timelineTests = await source('src/components/workspace/TimelineEditor.test.tsx')
const orchestrator = await source('services/api/app/services/engine_orchestrator.py')
const engineSchema = await source('services/api/app/schemas/engine.py')
const orchestratorTests = await source('services/api/tests/test_engine_orchestrator.py')
const engineDoctor = await source('src/components/evaluation/EngineDoctorCard.tsx')

for (const [token, label] of [
  ['TimelineBatchGenerationSummary', 'batch result contract missing'],
  ['failedIds', 'failed clip result missing'],
  ['skippedIds', 'skipped clip result missing'],
  ['TimelineBatchFailureKind', 'batch failure classification missing'],
  ['classifyBatchFailure', 'batch failure classifier missing'],
]) requireText(timelineHook, token, label)

for (const [token, label] of [
  ['최근 일괄 음성 작업 결과', 'batch result UI missing'],
  ['실패한 클립만 선택했습니다.', 'failed-only selection UX missing'],
  ['>대사 전체</button>', 'select-all voice shortcut missing'],
  ['>실패만</button>', 'failed-only selection shortcut missing'],
  ['실패 원인별 재시도', 'failure-group retry UX missing'],
  ['BATCH_RETRY_LIMIT = 3', 'bounded quick retry missing'],
  ['BATCH_HISTORY_LIMIT = 6', 'session retry history limit missing'],
  ['세션 재시도 이력', 'session retry history UX missing'],
]) requireText(timeline, token, label)

requireText(
  timelineTests,
  '일괄 재생성 실패 뒤 실패 클립만 자동 선택',
  'batch failure recovery regression test missing',
)
requireText(
  timelineTests,
  '일괄 실패 원인을 그룹으로 나눠 필요한 항목만 다시 시도한다',
  'batch failure grouping regression test missing',
)
requireText(
  timelineTests,
  '일괄 작업 재시도 이력을 세션 안에서 최근 순서로 보존한다',
  'batch retry history regression test missing',
)

for (const [token, label] of [
  ['soft_degrade_seconds', 'soft degradation window missing'],
  ['degraded_until', 'soft degradation runtime state missing'],
  ['_selection_penalty', 'adaptive routing penalty missing'],
  ['_performance_penalty', 'runtime performance penalty missing'],
  ['reliability_ewma', 'runtime reliability EWMA missing'],
  ['latency_ewma_ms', 'runtime latency EWMA missing'],
  ['performance_sample_count', 'performance observation sample window missing'],
]) requireText(orchestrator, token, label)

for (const [token, label] of [
  ['selection_penalty', 'engine selection penalty schema missing'],
  ['degraded_remaining_seconds', 'engine degradation timer schema missing'],
  ['selection_reason', 'engine routing reason schema missing'],
]) requireText(engineSchema, token, label)

requireText(
  orchestratorTests,
  'test_recent_failure_temporarily_deprioritizes_engine_before_circuit_opens',
  'adaptive routing regression test missing',
)
requireText(
  orchestratorTests,
  'test_recent_slow_samples_temporarily_deprioritize_auto_engine',
  'latency-aware routing regression test missing',
)
requireText(
  orchestratorTests,
  'test_performance_window_expiry_resets_old_ewma_samples_before_new_observation',
  'performance window reset regression test missing',
)
requireText(engineDoctor, '자동 우회', 'operator adaptive routing status missing')

console.log('Batch recovery / adaptive engine routing 계약 검사 통과')
