import type { EngineInfo } from '../ai/contracts'
import {
  ApiError,
  apiRequest,
  getApiBaseWarnings,
  normalizeApiBaseUrl,
} from '../api/httpClient'
import { getMobileNetworkSnapshot, mobileNetworkLabel } from '../network/mobileNetwork'
import { getSetupStatus } from './setupApi'
import type {
  ApiConnectivityReport,
  ConnectionLayer,
  ConnectivityCheck,
  ConnectivityStatus,
} from './connectivityTypes'
import { checkHealth, listEngines } from '../tts/voiceApi'
import { getVoiceCloneCapability } from '../voiceclone/voiceCloneApi'

interface ApiConnectivityCheck {
  id: string
  label: string
  status: ConnectivityStatus
  detail: string
  latency_ms: number | null
}

interface ApiConnectivityResponse {
  version: string
  status: ConnectivityStatus
  environment: string
  api_base_path: string
  api_ready: boolean
  tts_ready: boolean
  voice_clone_ready: boolean
  worker_configured: boolean
  worker_healthy?: boolean
  gpu_ready?: boolean
  gpu_name?: string | null
  vram_total_mb?: number | null
  request_id?: string | null
  server_time?: string
  recommended_recheck_seconds?: number
  cors_origins: string[]
  tts_engines: ApiEngineInfo[]
  voice_clone_engines: ApiEngineInfo[]
  checks: ApiConnectivityCheck[]
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

interface ConnectivityAuditOptions {
  mode?: 'quick' | 'deep'
  signal?: AbortSignal
}

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
  }
}

async function timedCheck(
  id: string,
  label: string,
  task: () => Promise<unknown>,
): Promise<ConnectivityCheck> {
  const started = performance.now()
  try {
    await task()
    return {
      id,
      label,
      status: 'ready',
      detail: '정상 응답을 확인했습니다.',
      latencyMs: Math.round(performance.now() - started),
    }
  } catch (error) {
    return {
      id,
      label,
      status: 'missing',
      detail: error instanceof ApiError
        ? `${error.code} · ${error.message}`
        : '연결 검사에 실패했습니다.',
      latencyMs: Math.round(performance.now() - started),
    }
  }
}

function layer(state: ConnectionLayer['state'], detail: string): ConnectionLayer {
  return { state, detail }
}

function deriveLayers(result: ApiConnectivityResponse): ApiConnectivityReport['layers'] {
  const demoReady = result.tts_engines.some((engine) => engine.ready && engine.mode === 'mock')
  const workerHealthy = result.worker_healthy ?? result.checks.some((check) => (
    check.id === 'clone-worker-health' && check.status === 'ready'
  ))
  const gpuReady = result.gpu_ready ?? result.checks.some((check) => (
    check.id === 'worker-gpu' && check.status === 'ready'
  ))
  return {
    api: result.api_ready
      ? layer('ready', `FastAPI v${result.version}`)
      : layer('offline', 'FastAPI 응답이 준비되지 않았습니다.'),
    tts: result.tts_ready
      ? layer('ready', '실제 한국어 TTS 엔진 준비됨')
      : demoReady
        ? layer('warning', 'Demo 엔진만 준비됨')
        : layer('offline', '실행 가능한 TTS 엔진 없음'),
    worker: workerHealthy
      ? layer(result.voice_clone_ready ? 'ready' : 'warning', result.voice_clone_ready
        ? 'CosyVoice Worker와 모델 준비됨'
        : 'Worker는 연결됐지만 모델 준비가 필요함')
      : layer(result.worker_configured ? 'warning' : 'offline', result.worker_configured
        ? 'Worker 주소는 있으나 응답하지 않음'
        : 'Worker 주소가 설정되지 않음'),
    gpu: gpuReady
      ? layer('ready', result.gpu_name ?? 'CUDA GPU 준비됨')
      : layer(workerHealthy ? 'warning' : 'offline', workerHealthy
        ? 'Worker는 연결됐지만 CUDA GPU가 준비되지 않음'
        : 'Worker 연결 후 GPU 상태를 확인할 수 있음'),
  }
}

async function deepRouteChecks(baseUrl: string, signal?: AbortSignal): Promise<ConnectivityCheck[]> {
  return Promise.all([
    timedCheck('setup-route', '설치 진단 API', () => getSetupStatus(baseUrl, signal)),
    timedCheck('engines-route', 'TTS 엔진 API', () => listEngines(baseUrl, signal)),
    timedCheck('clone-route', '목소리 복제 API', () => getVoiceCloneCapability(baseUrl, signal)),
  ])
}

function failedReport(
  baseUrl: string,
  health: ConnectivityCheck,
  error: unknown,
  started: number,
): ApiConnectivityReport {
  const message = error instanceof ApiError
    ? `${error.code} · ${error.message}`
    : '통합 진단에 실패했습니다.'
  const network = getMobileNetworkSnapshot()
  return {
    version: null,
    baseUrl,
    status: 'missing',
    environment: null,
    apiReady: health.status === 'ready',
    ttsReady: false,
    voiceCloneReady: false,
    workerConfigured: false,
    workerHealthy: false,
    gpuReady: false,
    gpuName: null,
    vramTotalMb: null,
    requestId: error instanceof ApiError ? error.requestId : null,
    lastCheckedAt: new Date().toISOString(),
    latencyMs: Math.round(performance.now() - started),
    recommendedRecheckSeconds: network.online ? 10 : 3,
    layers: {
      api: health.status === 'ready'
        ? layer('warning', 'Health는 응답했지만 통합 진단이 실패했습니다.')
        : layer('offline', message),
      tts: layer('unknown', 'API 연결 후 확인'),
      worker: layer('unknown', 'API 연결 후 확인'),
      gpu: layer('unknown', 'Worker 연결 후 확인'),
    },
    checks: [
      health,
      {
        id: 'connectivity-route',
        label: '통합 연결 진단 API',
        status: 'missing',
        detail: message,
        latencyMs: null,
      },
    ],
    warnings: [mobileNetworkLabel(network), ...getApiBaseWarnings(baseUrl)],
    ttsEngines: [],
    voiceCloneEngines: [],
  }
}

export async function runApiConnectivityAudit(
  value: string,
  options: ConnectivityAuditOptions = {},
): Promise<ApiConnectivityReport> {
  const baseUrl = normalizeApiBaseUrl(value)
  if (!baseUrl) throw new ApiError('자동 연결 후보가 없습니다.', 0, 'SOA-2004', 'invalid-url')
  const started = performance.now()
  const health = await timedCheck(
    'health-route',
    'API Health',
    () => checkHealth(baseUrl, options.signal),
  )
  if (health.status !== 'ready') {
    return failedReport(baseUrl, health, new ApiError(health.detail, 0), started)
  }

  let result: ApiConnectivityResponse
  try {
    result = await apiRequest<ApiConnectivityResponse>('/connectivity', undefined, {
      baseUrl,
      signal: options.signal,
      timeoutMs: 8_000,
      retries: 1,
    })
  } catch (error) {
    return failedReport(baseUrl, health, error, started)
  }

  const routeChecks = options.mode === 'deep'
    ? await deepRouteChecks(baseUrl, options.signal)
    : []
  const checks = [
    health,
    ...result.checks.map((check) => ({
      id: check.id,
      label: check.label,
      status: check.status,
      detail: check.detail,
      latencyMs: check.latency_ms,
    })),
    ...routeChecks,
  ]
  const missing = checks.some((check) => check.status === 'missing')
  const warning = checks.some((check) => check.status === 'warning')
  const workerHealthy = result.worker_healthy ?? checks.some((check) => (
    check.id === 'clone-worker-health' && check.status === 'ready'
  ))
  const gpuReady = result.gpu_ready ?? checks.some((check) => (
    check.id === 'worker-gpu' && check.status === 'ready'
  ))
  const network = getMobileNetworkSnapshot()
  return {
    version: result.version,
    baseUrl,
    status: missing ? 'missing' : warning ? 'warning' : 'ready',
    environment: result.environment,
    apiReady: result.api_ready,
    ttsReady: result.tts_ready,
    voiceCloneReady: result.voice_clone_ready,
    workerConfigured: result.worker_configured,
    workerHealthy,
    gpuReady,
    gpuName: result.gpu_name ?? null,
    vramTotalMb: result.vram_total_mb ?? null,
    requestId: result.request_id ?? null,
    lastCheckedAt: result.server_time ?? new Date().toISOString(),
    latencyMs: Math.round(performance.now() - started),
    recommendedRecheckSeconds: result.recommended_recheck_seconds ?? 15,
    layers: deriveLayers(result),
    checks,
    warnings: [
      mobileNetworkLabel(network),
      ...getApiBaseWarnings(baseUrl),
      ...(result.cors_origins.length ? [] : ['API의 CORS 허용 주소가 비어 있습니다.']),
    ],
    ttsEngines: result.tts_engines.map(mapEngine),
    voiceCloneEngines: result.voice_clone_engines.map(mapEngine),
  }
}
