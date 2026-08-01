import { apiRequest, resolveApiAssetUrl } from '../api/httpClient'
import type {
  EngineDiagnostic,
  EvaluationSentence,
  QualityCompareRequest,
  QualityComparison,
  QualityDiagnostics,
  QualityResult,
  TextPreview,
} from './qualityTypes'

interface ApiDiagnosticCheck {
  id: string
  label: string
  status: string
  detail: string
}

interface ApiEngineDiagnostic {
  engine_id: string
  name: string
  mode: EngineDiagnostic['mode']
  ready: boolean
  provider: string
  model_loaded: boolean | null
  recommended: boolean
  health: 'ready' | 'cooldown' | 'unavailable'
  success_count: number
  failure_count: number
  cooldown_remaining_seconds: number
  checks: ApiDiagnosticCheck[]
}

interface ApiDiagnostics {
  version: string
  python_version: string
  platform: string
  process_id: number
  memory_mb: number | null
  engines: ApiEngineDiagnostic[]
}

interface ApiTextPreview {
  original_text: string
  normalized_text: string
  changes: string[]
  segments: string[]
  segment_count: number
}

interface ApiQualityResult {
  engine_id: string
  engine_name: string
  engine_mode: QualityResult['engineMode']
  status: string
  audio_url: string | null
  message: string
  elapsed_ms: number | null
  duration_seconds: number | null
  realtime_factor: number | null
  file_size_bytes: number | null
  segment_count: number
}

function mapResult(result: ApiQualityResult): QualityResult {
  return {
    engineId: result.engine_id,
    engineName: result.engine_name,
    engineMode: result.engine_mode,
    status: result.status,
    audioUrl: resolveApiAssetUrl(result.audio_url),
    message: result.message,
    elapsedMs: result.elapsed_ms,
    durationSeconds: result.duration_seconds,
    realtimeFactor: result.realtime_factor,
    fileSizeBytes: result.file_size_bytes,
    segmentCount: result.segment_count,
  }
}

export async function getQualityDiagnostics(): Promise<QualityDiagnostics> {
  const result = await apiRequest<ApiDiagnostics>('/quality/diagnostics')
  return {
    version: result.version,
    pythonVersion: result.python_version,
    platform: result.platform,
    processId: result.process_id,
    memoryMb: result.memory_mb,
    engines: result.engines.map((engine) => ({
      engineId: engine.engine_id,
      name: engine.name,
      mode: engine.mode,
      ready: engine.ready,
      provider: engine.provider,
      modelLoaded: engine.model_loaded,
      recommended: engine.recommended,
      health: engine.health,
      successCount: engine.success_count,
      failureCount: engine.failure_count,
      cooldownRemainingSeconds: engine.cooldown_remaining_seconds,
      checks: engine.checks,
    })),
  }
}

export function getEvaluationSentences() {
  return apiRequest<EvaluationSentence[]>('/quality/sentences')
}

export async function previewQualityText(text: string, maxChars = 180): Promise<TextPreview> {
  const result = await apiRequest<ApiTextPreview>('/quality/text-preview', {
    method: 'POST',
    body: JSON.stringify({ text, max_chars: maxChars }),
  })
  return {
    originalText: result.original_text,
    normalizedText: result.normalized_text,
    changes: result.changes,
    segments: result.segments,
    segmentCount: result.segment_count,
  }
}

export async function compareQualityEngines(request: QualityCompareRequest): Promise<QualityComparison> {
  const result = await apiRequest<{
    normalized_text: string
    changes: string[]
    results: ApiQualityResult[]
  }>('/quality/compare', {
    method: 'POST',
    body: JSON.stringify({
      text: request.text,
      engine_ids: request.engineIds,
      voice_id: request.voiceId,
      emotion: request.emotion,
      speed: request.speed,
      pitch: request.pitch,
    }),
  }, { timeoutMs: 180_000 })
  return {
    normalizedText: result.normalized_text,
    changes: result.changes,
    results: result.results.map(mapResult),
  }
}
