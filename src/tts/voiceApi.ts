import type { HealthResult, TtsSynthesisRequest, TtsSynthesisResult } from '../ai/contracts'
import { apiRequest } from '../api/httpClient'

interface ApiTtsRequest {
  text: string
  voice_id: string
  emotion: TtsSynthesisRequest['emotion']
  speed: number
  pitch: number
  output_format: TtsSynthesisRequest['format']
  engine_id?: string
}

interface ApiTtsResult {
  job_id: string
  status: TtsSynthesisResult['status']
  engine_id: string
  audio_url: string | null
  estimated_duration_seconds: number
  message: string
}

export function checkHealth() {
  return apiRequest<HealthResult>('/health')
}

export async function synthesizeSpeech(request: TtsSynthesisRequest): Promise<TtsSynthesisResult> {
  const payload: ApiTtsRequest = {
    text: request.text,
    voice_id: request.voiceId,
    emotion: request.emotion,
    speed: request.speed,
    pitch: request.pitch,
    output_format: request.format,
    engine_id: request.engineId,
  }
  const result = await apiRequest<ApiTtsResult>('/tts/synthesize', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return {
    jobId: result.job_id,
    status: result.status,
    engineId: result.engine_id,
    audioUrl: result.audio_url,
    estimatedDurationSeconds: result.estimated_duration_seconds,
    message: result.message,
  }
}
