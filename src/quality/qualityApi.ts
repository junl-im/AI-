import { apiRequest, resolveApiAssetUrl } from '../api/httpClient'
import type {
  EngineDiagnostic,
  EvaluationSentence,
  QualityCompareRequest,
  QualityComparison,
  QualityDiagnostics,
  QualityResult,
  TextPreview,
  QualityEvidenceSummary,
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
  quality_tier: 'basic' | 'standard' | 'premium' | 'reference'
  auto_eligible: boolean
  korean_specialization: number
  long_form: boolean
  streaming: boolean
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
      qualityTier: engine.quality_tier,
        autoEligible: engine.auto_eligible,
      koreanSpecialization: engine.korean_specialization,
      longForm: engine.long_form,
      streaming: engine.streaming,
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

export async function getDeviceBenchmarkSummary() {
  const result = await apiRequest<{
    total_records: number
    ready_records: number
    warning_records: number
    failed_records: number
    coverage: Array<{
      profile: 'cuda' | 'apple-silicon' | 'cpu' | 'android' | 'ios'
      sample_minutes: number
      recorded: boolean
      latest_status: 'ready' | 'warning' | 'failed' | null
      latest_realtime_factor: number | null
    }>
    missing_scenarios: string[]
  }>('/quality/device-benchmarks/summary')
  return {
    totalRecords: result.total_records,
    readyRecords: result.ready_records,
    warningRecords: result.warning_records,
    failedRecords: result.failed_records,
    coverage: result.coverage.map((item) => ({
      profile: item.profile,
      sampleMinutes: item.sample_minutes,
      recorded: item.recorded,
      latestStatus: item.latest_status,
      latestRealtimeFactor: item.latest_realtime_factor,
    })),
    missingScenarios: result.missing_scenarios,
  }
}


export async function getQualityEvidenceSummary(): Promise<QualityEvidenceSummary> {
  const result = await apiRequest<{
    stt: {
      total_records: number
      improved_records: number
      passed_after_records: number
      average_character_error_improvement: number
      average_word_error_improvement: number
    }
    export_soak: {
      total_records: number
      ready_records: number
      warning_records: number
      failed_records: number
      coverage: Array<{
        sample_minutes: number
        output_format: 'wav' | 'mp3'
        recorded: boolean
        latest_status: 'ready' | 'warning' | 'failed' | null
        latest_realtime_factor: number | null
        latest_subtitle_drift_ms: number | null
      }>
      missing_scenarios: string[]
    }
  }>('/quality/evidence-summary')
  return {
    stt: {
      totalRecords: result.stt.total_records,
      improvedRecords: result.stt.improved_records,
      passedAfterRecords: result.stt.passed_after_records,
      averageCharacterErrorImprovement: result.stt.average_character_error_improvement,
      averageWordErrorImprovement: result.stt.average_word_error_improvement,
    },
    exportSoak: {
      totalRecords: result.export_soak.total_records,
      readyRecords: result.export_soak.ready_records,
      warningRecords: result.export_soak.warning_records,
      failedRecords: result.export_soak.failed_records,
      coverage: result.export_soak.coverage.map((item) => ({
        sampleMinutes: item.sample_minutes,
        outputFormat: item.output_format,
        recorded: item.recorded,
        latestStatus: item.latest_status,
        latestRealtimeFactor: item.latest_realtime_factor,
        latestSubtitleDriftMs: item.latest_subtitle_drift_ms,
      })),
      missingScenarios: result.export_soak.missing_scenarios,
    },
  }
}

export async function downloadQualityEvidenceBundle() {
  const payload = await apiRequest<Record<string, unknown>>('/quality/evidence-bundle')
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `sorion-quality-evidence-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
