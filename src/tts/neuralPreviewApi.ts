import type { TtsSynthesisRequest, TtsSynthesisResult } from '../ai/contracts'
import { apiRequest, resolveApiAssetUrl } from '../api/httpClient'

interface ApiNeuralPreviewResponse {
  voice_id: string
  cache_id: string
  cache_hit: boolean
  preview_cache_key: string
  text_sha256: string
  style_sha256: string
  audio_sha256: string
  audio_url: string
  engine_id: string
  model_fingerprint: string
  reference_fingerprint: string
  first_audio_ms: number | null
  processing_ms: number | null
  estimated_duration_seconds: number
  file_size_bytes: number
  generated_at: string
  runtime_certified: boolean
  message: string
}

export async function synthesizeNeuralPreview(
  request: TtsSynthesisRequest,
  expectedPreviewCacheKey: string,
  signal?: AbortSignal,
): Promise<TtsSynthesisResult> {
  const result = await apiRequest<ApiNeuralPreviewResponse>('/tts/neural-preview', {
    method: 'POST',
    body: JSON.stringify({
      text: request.text,
      voice_id: request.voiceId,
      emotion: request.emotion,
      speed: request.speed,
      pitch: request.pitch,
      output_format: 'wav',
      engine_id: 'cosyvoice3',
      normalize_text: request.normalizeText,
      expected_preview_cache_key: expectedPreviewCacheKey,
    }),
  }, { signal, timeoutMs: 90_000, retries: 0 })

  return {
    jobId: `neural-preview-${result.cache_id.slice(0, 24)}`,
    status: 'completed',
    engineId: result.engine_id,
    engineMode: 'ai',
    audioUrl: resolveApiAssetUrl(result.audio_url),
    estimatedDurationSeconds: result.estimated_duration_seconds,
    message: result.message,
    normalizedText: request.text,
    segmentCount: 1,
    firstAudioMs: result.first_audio_ms,
    processingMs: result.processing_ms,
    fileSizeBytes: result.file_size_bytes,
    realtimeFactor: null,
    requestedEngineId: 'cosyvoice3',
    attemptedEngineIds: ['cosyvoice3'],
    fallbackUsed: false,
    neuralPreview: {
      voiceId: result.voice_id,
      cacheId: result.cache_id,
      cacheHit: result.cache_hit,
      previewCacheKey: result.preview_cache_key,
      textSha256: result.text_sha256,
      styleSha256: result.style_sha256,
      audioSha256: result.audio_sha256,
      modelFingerprint: result.model_fingerprint,
      referenceFingerprint: result.reference_fingerprint,
      generatedAt: result.generated_at,
      runtimeCertified: result.runtime_certified,
    },
  }
}
