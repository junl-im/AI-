import type { EngineInfo, HealthResult, TtsSynthesisRequest, TtsSynthesisResult } from '../ai/contracts'
import { apiRequest } from '../api/httpClient'

interface ApiTtsRequest {
  text: string
  voice_id: string
  emotion: TtsSynthesisRequest['emotion']
  speed: number
  pitch: number
  output_format: TtsSynthesisRequest['format']
  engine_id?: string
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

export function checkHealth() {
  return apiRequest<HealthResult>('/health')
}

export async function listEngines(): Promise<EngineInfo[]> {
  const engines = await apiRequest<ApiEngineInfo[]>('/engines')
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
    audioUrl: result.audio_url,
    estimatedDurationSeconds: result.estimated_duration_seconds,
    message: result.message,
    normalizedText: result.normalized_text,
    segmentCount: result.segment_count,
    processingMs: result.processing_ms,
    fileSizeBytes: result.file_size_bytes,
    realtimeFactor: result.realtime_factor,
  }
}

export async function cancelSpeech(jobId: string): Promise<void> {
  await apiRequest(`/tts/jobs/${encodeURIComponent(jobId)}`, { method: 'DELETE' }, { timeoutMs: 4_000 })
}
