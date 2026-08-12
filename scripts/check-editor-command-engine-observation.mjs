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
const timelineTests = await source('src/components/workspace/TimelineEditor.test.tsx')
const orchestrator = await source('services/api/app/services/engine_orchestrator.py')
const engineSchema = await source('services/api/app/schemas/engine.py')
const orchestratorTests = await source('services/api/tests/test_engine_orchestrator.py')
const doctor = await source('src/components/evaluation/EngineDoctorCard.tsx')
const diagnostics = await source('src/components/evaluation/QualityDiagnosticsCard.tsx')

for (const [token, label] of [
  ['다중 선택 키보드 명령', 'keyboard command bar missing'],
  ['handleTimelineCommandKeyDown', 'timeline keyboard command handler missing'],
  ["stageBatchCommand('regenerate'", 'guarded regeneration command missing'],
  ["stageBatchCommand('delete'", 'guarded delete command missing'],
  ['Ctrl/Cmd+Shift+Z', 'bounded redo guidance missing'],
  ['soa-timeline-history-controls', 'timeline history controls missing'],
  ['일괄 명령 안전 미리보기', 'batch command preview missing'],
  ['Ctrl/Cmd+A', 'select-all keyboard guidance missing'],
]) requireText(timeline, token, label)

requireText(
  timelineTests,
  '다중 선택 command bar는 재생성·Undo/Redo·삭제 안전 확인을 제공한다',
  'keyboard command UX regression test missing',
)

for (const [token, label] of [
  ['active_requests * 12', 'active load routing penalty missing'],
  ['병렬 요청 분산', 'active load routing explanation missing'],
  ['_performance_observation', 'performance observation lifecycle missing'],
  ['performance_observation_started_at', 'performance observation provenance missing'],
  ['performance_last_sample_at', 'performance last sample timestamp missing'],
]) requireText(orchestrator, token, label)

for (const [token, label] of [
  ['active_request_count', 'active request schema field missing'],
  ['performance_observation_status', 'observation status schema field missing'],
  ['performance_window_remaining_seconds', 'observation remaining window missing'],
  ['performance_latency_ewma_ms', 'EWMA latency schema field missing'],
  ['performance_reliability_ewma', 'EWMA reliability schema field missing'],
]) requireText(engineSchema, token, label)

for (const [token, label] of [
  ['test_active_auto_request_temporarily_spreads_parallel_load_to_backup', 'parallel load routing regression missing'],
  ['test_performance_observation_reports_warming_active_expired_and_new_session', 'observation lifecycle regression missing'],
]) requireText(orchestratorTests, token, label)

requireText(doctor, 'EWMA 관찰창', 'Engine Doctor observation explanation missing')
requireText(doctor, 'performanceObservationStatus', 'Engine Doctor observation state missing')
requireText(diagnostics, 'performanceObservationStatus', 'Quality diagnostics observation state missing')

console.log('Editor command / engine observation 계약 검사 통과')
