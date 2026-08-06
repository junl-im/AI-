import type { EngineInfo, HealthResult, TtsSynthesisRequest, TtsSynthesisResult } from '../ai/contracts'
import {
  ApiError,
  apiRequest,
  getApiConnectionContext,
  resolveApiAssetUrl,
} from '../api/httpClient'
import {
  BROWSER_SPEECH_ENGINE_ID,
  createBrowserSpeechResult,
  isBrowserSpeechSupported,
} from './browserSpeech'

export type JobProgressPhase = 'queued' | 'normalizing' | 'generating' | 'merging' | 'completed' | 'cancelled' | 'failed'

export interface SpeechReadySegment {
  index: number
  totalSegments: number
  filename: string
  audioUrl: string
  engineId: string
  engineMode: TtsSynthesisResult['engineMode']
  estimatedDurationSeconds: number
  fileSizeBytes: number
  readyAfterMs: number
  readyAt: string
}

export interface SpeechJobProgress {
  jobId: string
  status: TtsSynthesisResult['status']
  phase: JobProgressPhase
  progress: number
  currentSegment: number
  totalSegments: number
  message: string
  error: string | null
  readySegments?: SpeechReadySegment[]
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
  first_audio_ms?: number | null
  processing_ms: number | null
  file_size_bytes: number | null
  realtime_factor: number | null
  requested_engine_id?: string | null
  attempted_engine_ids?: string[]
  fallback_used?: boolean
}

interface ApiReadySegment {
  index: number
  total_segments: number
  filename: string
  audio_url: string
  engine_id: string
  engine_mode: TtsSynthesisResult['engineMode']
  estimated_duration_seconds: number
  file_size_bytes: number
  ready_after_ms: number
  ready_at: string
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
  ready_segments?: ApiReadySegment[]
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
  quality_tier?: 'basic' | 'standard' | 'premium' | 'reference'
  auto_eligible?: boolean
  korean_specialization?: number
  long_form?: boolean
  streaming?: boolean
  recommended?: boolean
  health?: 'ready' | 'cooldown' | 'unavailable'
  success_count?: number
  failure_count?: number
  consecutive_failures?: number
  cooldown_remaining_seconds?: number
  last_error?: string | null
}

interface ApiHealthResult {
  status: 'ok'
  service: string
  version: string
  default_engine: string
}

const ENGINE_CATALOG_CACHE_MS = 15_000
let engineCatalogCache: { baseUrl: string; cachedAt: number; engines: EngineInfo[] } | null = null
let engineCatalogRequest: { baseUrl: string; promise: Promise<EngineInfo[]> } | null = null

function mapEngine(engine: ApiEngineInfo): EngineInfo {
  return {
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
    qualityTier: engine.quality_tier ?? 'basic',
    autoEligible: engine.auto_eligible ?? true,
    koreanSpecialization: engine.korean_specialization ?? 0,
    longForm: engine.long_form ?? false,
    streaming: engine.streaming ?? false,
    recommended: engine.recommended ?? false,
    health: engine.health ?? (engine.ready ? 'ready' : 'unavailable'),
    successCount: engine.success_count ?? 0,
    failureCount: engine.failure_count ?? 0,
    consecutiveFailures: engine.consecutive_failures ?? 0,
    cooldownRemainingSeconds: engine.cooldown_remaining_seconds ?? 0,
    lastError: engine.last_error ?? null,
  }
}

export function primeEngineCatalog(
  engines: EngineInfo[],
  baseUrl = getApiConnectionContext().baseUrl,
): void {
  if (!baseUrl) return
  engineCatalogCache = {
    baseUrl,
    cachedAt: Date.now(),
    engines: engines.map((engine) => ({ ...engine })),
  }
}

function readPrimedEngineCatalog(baseUrl: string): EngineInfo[] | null {
  if (
    !engineCatalogCache
    || engineCatalogCache.baseUrl !== baseUrl
    || Date.now() - engineCatalogCache.cachedAt > ENGINE_CATALOG_CACHE_MS
  ) return null
  return engineCatalogCache.engines.map((engine) => ({ ...engine }))
}

export function mapReadySegment(value: ApiReadySegment): SpeechReadySegment {
  return {
    index: value.index,
    totalSegments: value.total_segments,
    filename: value.filename,
    audioUrl: resolveApiAssetUrl(value.audio_url) ?? value.audio_url,
    engineId: value.engine_id,
    engineMode: value.engine_mode,
    estimatedDurationSeconds: value.estimated_duration_seconds,
    fileSizeBytes: value.file_size_bytes,
    readyAfterMs: value.ready_after_ms,
    readyAt: value.ready_at,
  }
}

function mapTtsResult(result: ApiTtsResult): TtsSynthesisResult {
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
    firstAudioMs: result.first_audio_ms ?? result.processing_ms,
    processingMs: result.processing_ms,
    fileSizeBytes: result.file_size_bytes,
    realtimeFactor: result.realtime_factor,
    requestedEngineId: result.requested_engine_id ?? null,
    attemptedEngineIds: result.attempted_engine_ids ?? [],
    fallbackUsed: result.fallback_used ?? false,
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener('abort', abort)
      resolve()
    }
    const timer = window.setTimeout(finish, ms)
    const abort = () => {
      window.clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
      reject(new ApiError('음성 생성을 취소했습니다.', 499, 'SOA-2003', 'cancelled'))
    }
    if (signal?.aborted) {
      abort()
      return
    }
    signal?.addEventListener('abort', abort, { once: true })
  })
}

export async function checkHealth(baseUrl?: string, signal?: AbortSignal): Promise<HealthResult> {
  const result = await apiRequest<ApiHealthResult>('/health', undefined, { baseUrl, signal, retries: 1 })
  return {
    status: result.status,
    service: result.service,
    version: result.version,
    defaultEngine: result.default_engine,
  }
}

export async function listEngines(baseUrl?: string, signal?: AbortSignal): Promise<EngineInfo[]> {
  const resolvedBaseUrl = baseUrl ?? getApiConnectionContext().baseUrl
  const cached = !signal ? readPrimedEngineCatalog(resolvedBaseUrl) : null
  if (cached) return cached
  if (!signal && engineCatalogRequest?.baseUrl === resolvedBaseUrl) {
    return engineCatalogRequest.promise
  }

  const request = apiRequest<ApiEngineInfo[]>('/engines', undefined, {
    baseUrl,
    signal,
    retries: 0,
    timeoutMs: 3_500,
  }).then((engines) => {
    const mapped = engines.map(mapEngine)
    primeEngineCatalog(mapped, resolvedBaseUrl)
    return mapped
  })

  if (!signal) {
    engineCatalogRequest = { baseUrl: resolvedBaseUrl, promise: request }
    const clearRequest = () => {
      if (engineCatalogRequest?.promise === request) engineCatalogRequest = null
    }
    void request.then(clearRequest, clearRequest)
  }
  return request
}

export async function synthesizeSpeech(
  request: TtsSynthesisRequest,
  jobId: string,
  signal?: AbortSignal,
): Promise<TtsSynthesisResult> {
  const browserFallbackAvailable = isBrowserSpeechSupported()
  if (request.engineId === BROWSER_SPEECH_ENGINE_ID && browserFallbackAvailable) {
    return createBrowserSpeechResult(request, jobId, false)
  }
  if (!getApiConnectionContext().configured && browserFallbackAvailable) {
    return createBrowserSpeechResult(request, jobId)
  }

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
  try {
    const result = await apiRequest<ApiTtsResult>('/tts/synthesize', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, { signal, timeoutMs: 90_000, retries: 0 })
    return mapTtsResult(result)
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'cancelled') throw error
    if (
      error instanceof ApiError
      && (
        ['unconfigured', 'timeout', 'cors-or-network', 'offline', 'mixed-content', 'mobile-localhost']
          .includes(error.kind)
        || [502, 503, 504].includes(error.status)
      )
      && browserFallbackAvailable
    ) {
      return createBrowserSpeechResult(request, jobId)
    }
    throw error
  }
}

export async function getSpeechResult(
  jobId: string,
  signal?: AbortSignal,
): Promise<TtsSynthesisResult> {
  const result = await apiRequest<ApiTtsResult>(
    `/tts/jobs/${encodeURIComponent(jobId)}/result`,
    undefined,
    { signal, timeoutMs: 6_000, retries: 1 },
  )
  return mapTtsResult(result)
}

export async function refreshSpeechFinalAudio(
  jobId: string,
  signal?: AbortSignal,
): Promise<TtsSynthesisResult> {
  const result = await getSpeechResult(jobId, signal)
  if (!result.audioUrl) {
    throw new ApiError(
      '복원할 최종 음원 주소가 없습니다.',
      410,
      'SOA-4021',
      'server',
    )
  }
  return result
}

export async function recoverSpeechResult(
  jobId: string,
  signal?: AbortSignal,
  maxWaitMs = 45_000,
): Promise<TtsSynthesisResult> {
  const deadline = Date.now() + maxWaitMs
  let lastError: ApiError | null = null
  while (Date.now() < deadline) {
    if (signal?.aborted) {
      throw new ApiError('음성 생성을 취소했습니다.', 499, 'SOA-2003', 'cancelled')
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await sleep(1_000, signal)
      continue
    }
    try {
      const progress = await getSpeechProgress(jobId, signal)
      if (progress.phase === 'completed') return getSpeechResult(jobId, signal)
      if (progress.phase === 'failed' || progress.phase === 'cancelled') {
        throw new ApiError(
          progress.error ?? progress.message,
          409,
          progress.phase === 'failed' ? 'SOA-4013' : 'SOA-2003',
          progress.phase === 'failed' ? 'server' : 'cancelled',
        )
      }
    } catch (error) {
      if (error instanceof ApiError) {
        lastError = error
        if (error.kind === 'cancelled' || error.code === 'SOA-4013') throw error
        if (![0, 404, 408, 409, 502, 503, 504].includes(error.status)) throw error
      }
    }
    await sleep(900, signal)
  }
  throw lastError ?? new ApiError(
    '모바일 연결 복구 시간이 초과되었습니다. 같은 타임라인 블록에서 다시 시도해 주세요.',
    408,
    'SOA-2013',
    'timeout',
    true,
  )
}

export async function getSpeechProgress(
  jobId: string,
  signal?: AbortSignal,
): Promise<SpeechJobProgress> {
  const result = await apiRequest<ApiJobProgress>(`/tts/jobs/${encodeURIComponent(jobId)}`, undefined, { signal, timeoutMs: 4_000, retries: 1 })
  return {
    jobId: result.job_id,
    status: result.status,
    phase: result.phase,
    progress: result.progress,
    currentSegment: result.current_segment,
    totalSegments: result.total_segments,
    message: result.message,
    error: result.error,
    readySegments: (result.ready_segments ?? []).map(mapReadySegment),
    updatedAt: result.updated_at,
  }
}

export async function refreshSpeechReadySegment(
  jobId: string,
  index: number,
  signal?: AbortSignal,
): Promise<SpeechReadySegment | null> {
  const progress = await getSpeechProgress(jobId, signal)
  return progress.readySegments?.find((segment) => segment.index === index) ?? null
}

export async function cancelSpeech(jobId: string): Promise<void> {
  await apiRequest(`/tts/jobs/${encodeURIComponent(jobId)}`, { method: 'DELETE' }, { timeoutMs: 4_000 })
}
