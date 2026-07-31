import type { EngineInfo, HealthResult, TtsSynthesisRequest, TtsSynthesisResult } from '../ai/contracts'
import { apiRequest, resolveApiAssetUrl } from '../api/httpClient'

export type JobProgressPhase = 'queued' | 'normalizing' | 'generating' | 'merging' | 'completed' | 'cancelled' | 'failed'

export interface SpeechJobProgress {
  jobId: string
  status: TtsSynthesisResult['status']
  phase: JobProgressPhase
  progress: number
  currentSegment: number
  totalSegments: number
  message: string
  error: string | null
  updatedAt: string
}

interface ApiTtsRequest {
  text: string
  voice_id: string
  emotion: TtsSynthesisRequest['emotion']
  speed: number
  pitch: number
  output_format: TtsSynthesisRequest['format']
  engine_id?: string
  normalize_text: boolean
  job_id: string
}

interface ApiTtsResult {
  job_id: string
  status: TtsSynthesisResult['status']
  engine_id: string
  engine_mode: TtsSynthesisResult['engineMode']
  audio_url: string | null
  estimated_duration_seconds: number
  message: string
  normalized_text: string | null
  segment_count: number
  processing_ms: number | null
  file_size_bytes: number | null
  realtime_factor: number | null
}

interface ApiJobProgress {
  job_id: string
  status: TtsSynthesisResult['status']
  phase: JobProgressPhase
  progress: number
  current_segment: number
  total_segments: number
  message: string
  error: string | null
  updated_at: string
}

interface ApiEngineInfo {
  id: string
  name: string
  kind: string
  mode: EngineInfo['mode']
  provider: string
  languages: string[]
  output_formats: string[]
  supports_emotion: boolean
  supports_speed: boolean
  supports_pitch: boolean
  supports_voice_clone: boolean
  ready: boolean
  reason: string | null
}

interface ApiHealthResult {
  status: 'ok'
  service: string
  version: string
  default_engine: string
}

export async function checkHealth(baseUrl?: string): Promise<HealthResult> {
  const result = await apiRequest<ApiHealthResult>('/health', undefined, { baseUrl })
  return {
    status: result.status,
    service: result.service,
    version: result.version,
    defaultEngine: result.default_engine,
  }
}

export async function listEngines(baseUrl?: string): Promise<EngineInfo[]> {
  const engines = await apiRequest<ApiEngineInfo[]>('/engines', undefined, { baseUrl })
  return engines.map((engine) => ({
    id: engine.id,
    name: engine.name,
    kind: engine.kind,
    mode: engine.mode,
    provider: engine.provider,
    languages: engine.languages,
    outputFormats: engine.output_formats,
    supportsEmotion: engine.supports_emotion,
    supportsSpeed: engine.supports_speed,
    supportsPitch: engine.supports_pitch,
    supportsVoiceClone: engine.supports_voice_clone,
    ready: engine.ready,
    reason: engine.reason,
  }))
}

export async function synthesizeSpeech(
  request: TtsSynthesisRequest,
  jobId: string,
  signal?: AbortSignal,
): Promise<TtsSynthesisResult> {
  const payload: ApiTtsRequest = {
    text: request.text,
    voice_id: request.voiceId,
    emotion: request.emotion,
    speed: request.speed,
    pitch: request.pitch,
    output_format: request.format,
    engine_id: request.engineId,
    normalize_text: request.normalizeText,
    job_id: jobId,
  }
  const result = await apiRequest<ApiTtsResult>('/tts/synthesize', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, { signal, timeoutMs: 90_000 })
  return {
    jobId: result.job_id,
    status: result.status,
    engineId: result.engine_id,
    engineMode: result.engine_mode,
    audioUrl: resolveApiAssetUrl(result.audio_url),
    estimatedDurationSeconds: result.estimated_duration_seconds,
    message: result.message,
    normalizedText: result.normalized_text,
    segmentCount: result.segment_count,
    processingMs: result.processing_ms,
    fileSizeBytes: result.file_size_bytes,
    realtimeFactor: result.realtime_factor,
  }
}

export async function getSpeechProgress(jobId: string): Promise<SpeechJobProgress> {
  const result = await apiRequest<ApiJobProgress>(`/tts/jobs/${encodeURIComponent(jobId)}`, undefined, { timeoutMs: 4_000 })
  return {
    jobId: result.job_id,
    status: result.status,
    phase: result.phase,
    progress: result.progress,
    currentSegment: result.current_segment,
    totalSegments: result.total_segments,
    message: result.message,
    error: result.error,
    updatedAt: result.updated_at,
  }
}

export async function cancelSpeech(jobId: string): Promise<void> {
  await apiRequest(`/tts/jobs/${encodeURIComponent(jobId)}`, { method: 'DELETE' }, { timeoutMs: 4_000 })
}
