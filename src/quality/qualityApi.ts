import { apiDownload, apiRequest, resolveApiAssetUrl } from '../api/httpClient'
import type {
  EngineDiagnostic,
  EvaluationSentence,
  QualityCompareRequest,
  QualityComparison,
  QualityDiagnostics,
  QualityResult,
  TextPreview,
  QualityEvidenceSummary,
  DeviceSoakRecordInput,
  DeviceSoakRecordResult,
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
  open_file_descriptors: number | null
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
    openFileDescriptors: result.open_file_descriptors,
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
    certification_coverage: Array<{
      profile: 'android' | 'ios'
      scenario: 'baseline' | 'network-switch' | 'background-resume' | 'installed-pwa'
      sample_minutes: number
      recorded: boolean
      latest_status: 'ready' | 'warning' | 'failed' | null
    }>
    missing_certifications: string[]
    metric_groups: Array<{
      device_profile: 'cuda' | 'apple-silicon' | 'cpu' | 'android' | 'ios'
      engine_id: string
      model_id: string
      model_version: string
      model_digest: string
      accelerator_name: string
      gpu_name: string
      preset_id: string
      records: number
      ready_records: number
      failure_rate: number
      average_realtime_factor: number
      p50_realtime_factor: number
      p95_realtime_factor: number
      p50_first_audio_ms: number | null
      p95_first_audio_ms: number | null
      p95_sse_reconnect_ms: number | null
      p95_audio_fetch_recovery_ms: number | null
      p95_playback_interruption_ms: number | null
      p95_seam_waited_ms: number | null
      p95_seam_decode_ms: number | null
      p50_final_handoff_error_ms: number | null
      p95_final_handoff_error_ms: number | null
    }>
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
    certificationCoverage: (result.certification_coverage ?? []).map((item) => ({
      profile: item.profile,
      scenario: item.scenario,
      sampleMinutes: item.sample_minutes,
      recorded: item.recorded,
      latestStatus: item.latest_status,
    })),
    missingCertifications: result.missing_certifications ?? [],
    metricGroups: (result.metric_groups ?? []).map((item) => ({
      deviceProfile: item.device_profile,
      engineId: item.engine_id,
      modelId: item.model_id,
      modelVersion: item.model_version,
      modelDigest: item.model_digest,
      acceleratorName: item.accelerator_name,
      gpuName: item.gpu_name,
      presetId: item.preset_id,
      records: item.records,
      readyRecords: item.ready_records,
      failureRate: item.failure_rate,
      averageRealtimeFactor: item.average_realtime_factor,
      p50RealtimeFactor: item.p50_realtime_factor,
      p95RealtimeFactor: item.p95_realtime_factor,
      p50FirstAudioMs: item.p50_first_audio_ms,
      p95FirstAudioMs: item.p95_first_audio_ms,
      p95SseReconnectMs: item.p95_sse_reconnect_ms,
      p95AudioFetchRecoveryMs: item.p95_audio_fetch_recovery_ms,
      p95PlaybackInterruptionMs: item.p95_playback_interruption_ms,
      p95SeamWaitedMs: item.p95_seam_waited_ms,
      p95SeamDecodeMs: item.p95_seam_decode_ms,
      p50FinalHandoffErrorMs: item.p50_final_handoff_error_ms,
      p95FinalHandoffErrorMs: item.p95_final_handoff_error_ms,
    })),
  }
}

export async function recordDeviceSoak(input: DeviceSoakRecordInput): Promise<DeviceSoakRecordResult> {
  const result = await apiRequest<{
    id: string
    recorded_at: string
    realtime_factor: number
    status: DeviceSoakRecordResult['status']
  }>('/quality/device-benchmarks', {
    method: 'POST',
    body: JSON.stringify({
      device_profile: input.deviceProfile,
      device_name: input.deviceName,
      engine_id: input.engineId,
      model_id: input.modelId,
      model_version: input.modelVersion,
      model_digest: input.modelDigest,
      accelerator_name: input.acceleratorName,
      gpu_name: input.gpuName,
      preset_id: input.presetId,
      sample_minutes: input.sampleMinutes,
      soak_elapsed_seconds: input.soakElapsedSeconds,
      scenario: input.scenario,
      browser_version: input.browserVersion,
      first_audio_ms: input.firstAudioMs,
      processing_seconds: input.processingSeconds,
      audio_duration_seconds: input.audioDurationSeconds,
      retry_count: input.retryCount,
      failure_count: input.failureCount,
      playback_completed: input.playbackCompleted,
      sse_reconnected: input.sseReconnected,
      audio_fetch_recovered: input.audioFetchRecovered,
      sse_reconnect_ms: input.sseReconnectMs,
      audio_fetch_recovery_ms: input.audioFetchRecoveryMs,
      playback_interruption_ms: input.playbackInterruptionMs,
      seam_p95_waited_ms: input.seamP95WaitedMs,
      seam_p95_decode_ms: input.seamP95DecodeMs,
      final_handoff_error_ms: input.finalHandoffErrorMs,
      succeeded: input.succeeded,
      notes: input.notes,
    }),
  })
  return {
    ...input,
    id: result.id,
    recordedAt: result.recorded_at,
    realtimeFactor: result.realtime_factor,
    status: result.status,
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
    manifest: {
      schema_version: string
      record_count: number
      category_counts: Record<string, number>
      records_sha256: string
      records: Array<{ category: string; id: string; sha256: string }>
      bundle_sha256: string
    } | null
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
    manifest: result.manifest ? {
      schemaVersion: result.manifest.schema_version,
      recordCount: result.manifest.record_count,
      categoryCounts: result.manifest.category_counts,
      recordsSha256: result.manifest.records_sha256,
      records: result.manifest.records,
      bundleSha256: result.manifest.bundle_sha256,
    } : null,
  }
}

export async function downloadQualityEvidenceBundle() {
  const payload = await apiRequest<Record<string, unknown>>('/quality/evidence-bundle')
  const verification = await apiRequest<{
    valid: boolean
    expected_sha256: string | null
    record_count: number
    reason: string
  }>('/quality/evidence-bundle/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!verification.valid || !verification.expected_sha256) {
    throw new Error(`증거 묶음 무결성 검사 실패: ${verification.reason}`)
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `sorion-quality-evidence-${verification.expected_sha256.slice(0, 12)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
  return {
    sha256: verification.expected_sha256,
    recordCount: verification.record_count,
  }
}


export async function downloadPrivacyAuditBundle() {
  const payload = await apiRequest<Record<string, unknown>>('/quality/privacy-audit-bundle')
  const verification = await apiRequest<{
    valid: boolean
    expected_sha256: string | null
    record_count: number
    reason: string
  }>('/quality/privacy-audit-bundle/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!verification.valid || !verification.expected_sha256) {
    throw new Error(`감사 묶음 무결성 검사 실패: ${verification.reason}`)
  }
  const download = await apiDownload(
    '/quality/privacy-audit-bundle.zip',
    `sorion-privacy-audit-${verification.expected_sha256.slice(0, 12)}.zip`,
  )
  if (download.bundleSha256 && download.bundleSha256 !== verification.expected_sha256) {
    throw new Error('감사 ZIP의 bundle SHA-256이 검증한 JSON과 다릅니다.')
  }
  const url = URL.createObjectURL(download.blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = download.filename
  anchor.click()
  URL.revokeObjectURL(url)
  return {
    sha256: verification.expected_sha256,
    recordCount: download.recordCount ?? verification.record_count,
  }
}


export async function getWorkerTelemetrySummary() {
  const result = await apiRequest<{
    total_records: number
    success_records: number
    failed_records: number
    metric_groups: Array<{
      engine_id: string
      preset_id: string
      model_id: string
      model_version: string
      model_digest: string
      device_profile: string
      accelerator_name: string
      gpu_name: string
      records: number
      success_records: number
      failure_rate: number
      p50_first_audio_ms: number | null
      p95_first_audio_ms: number | null
      p50_realtime_factor: number | null
      p95_realtime_factor: number | null
      p50_final_handoff_error_ms: number | null
      p95_final_handoff_error_ms: number | null
      regression: {
        status: 'insufficient' | 'stable' | 'warning' | 'regressed'
        minimum_records: number
        available_records: number
        baseline: {
          records: number
          failure_rate: number
          p95_first_audio_ms: number | null
          p95_realtime_factor: number | null
          p95_final_handoff_error_ms: number | null
        } | null
        current: {
          records: number
          failure_rate: number
          p95_first_audio_ms: number | null
          p95_realtime_factor: number | null
          p95_final_handoff_error_ms: number | null
        } | null
        reasons: string[]
      }
    }>
  }>('/quality/worker-telemetry/summary')
  return {
    totalRecords: result.total_records,
    successRecords: result.success_records,
    failedRecords: result.failed_records,
    metricGroups: result.metric_groups.map((item) => ({
      engineId: item.engine_id,
      presetId: item.preset_id,
      modelId: item.model_id,
      modelVersion: item.model_version,
      modelDigest: item.model_digest,
      deviceProfile: item.device_profile,
      acceleratorName: item.accelerator_name,
      gpuName: item.gpu_name,
      records: item.records,
      successRecords: item.success_records,
      failureRate: item.failure_rate,
      p50FirstAudioMs: item.p50_first_audio_ms,
      p95FirstAudioMs: item.p95_first_audio_ms,
      p50RealtimeFactor: item.p50_realtime_factor,
      p95RealtimeFactor: item.p95_realtime_factor,
      p50FinalHandoffErrorMs: item.p50_final_handoff_error_ms,
      p95FinalHandoffErrorMs: item.p95_final_handoff_error_ms,
      regression: {
        status: item.regression.status,
        minimumRecords: item.regression.minimum_records,
        availableRecords: item.regression.available_records,
        baseline: item.regression.baseline ? {
          records: item.regression.baseline.records,
          failureRate: item.regression.baseline.failure_rate,
          p95FirstAudioMs: item.regression.baseline.p95_first_audio_ms,
          p95RealtimeFactor: item.regression.baseline.p95_realtime_factor,
          p95FinalHandoffErrorMs: item.regression.baseline.p95_final_handoff_error_ms,
        } : null,
        current: item.regression.current ? {
          records: item.regression.current.records,
          failureRate: item.regression.current.failure_rate,
          p95FirstAudioMs: item.regression.current.p95_first_audio_ms,
          p95RealtimeFactor: item.regression.current.p95_realtime_factor,
          p95FinalHandoffErrorMs: item.regression.current.p95_final_handoff_error_ms,
        } : null,
        reasons: item.regression.reasons,
      },
    })),
  }
}
