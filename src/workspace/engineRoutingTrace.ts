import type { GeneratedAudio } from '../tts/generationTypes'

export interface EngineRoutingUsage {
  engineId: string
  count: number
}

export interface EngineRoutingTrace {
  completed: number
  engineUsage: EngineRoutingUsage[]
  engineSwitchCount: number
  fallbackCount: number
  attemptedEngineCount: number
}

export function buildEngineRoutingTrace(results: Array<{ audio: GeneratedAudio }>): EngineRoutingTrace {
  const engineIds = results.map((item) => item.audio.result.engineId).filter(Boolean)
  const usage = new Map<string, number>()
  let engineSwitchCount = 0
  let fallbackCount = 0
  const attempted = new Set<string>()

  results.forEach((item, index) => {
    const result = item.audio.result
    usage.set(result.engineId, (usage.get(result.engineId) ?? 0) + 1)
    if (result.fallbackUsed) fallbackCount += 1
    for (const engineId of result.attemptedEngineIds ?? []) attempted.add(engineId)
    if (index > 0 && engineIds[index - 1] !== engineIds[index]) engineSwitchCount += 1
  })

  return {
    completed: results.length,
    engineUsage: [...usage.entries()]
      .map(([engineId, count]) => ({ engineId, count }))
      .sort((left, right) => right.count - left.count || left.engineId.localeCompare(right.engineId)),
    engineSwitchCount,
    fallbackCount,
    attemptedEngineCount: attempted.size || usage.size,
  }
}

export function formatEngineRoutingTrace(trace: EngineRoutingTrace): string {
  if (!trace.completed) return '완료된 엔진 실행 없음'
  const usage = trace.engineUsage.map((item) => `${item.engineId} ${item.count}회`).join(' · ')
  const parts = [usage]
  if (trace.engineUsage.length > 1) parts.push(`자동 분산 ${trace.engineUsage.length}개 엔진`)
  if (trace.engineSwitchCount > 0) parts.push(`전환 ${trace.engineSwitchCount}회`)
  if (trace.fallbackCount > 0) parts.push(`fallback ${trace.fallbackCount}회`)
  return parts.join(' · ')
}
