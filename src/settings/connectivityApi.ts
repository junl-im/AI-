import type { EngineInfo } from '../ai/contracts'
import { ApiError, apiRequest, normalizeApiBaseUrl } from '../api/httpClient'
import { getSetupStatus } from './setupApi'
import type { ApiConnectivityReport, ConnectivityCheck, ConnectivityStatus } from './connectivityTypes'
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
      detail: error instanceof ApiError ? `${error.code} · ${error.message}` : '연결 검사에 실패했습니다.',
      latencyMs: Math.round(performance.now() - started),
    }
  }
}

export async function runApiConnectivityAudit(value: string): Promise<ApiConnectivityReport> {
  const baseUrl = normalizeApiBaseUrl(value)
  if (!baseUrl) throw new ApiError('검사할 Voice API 주소를 입력해 주세요.', 0, 'SOA-2000')

  const routeChecks = await Promise.all([
    timedCheck('health-route', 'API Health', () => checkHealth(baseUrl)),
    timedCheck('setup-route', '설치 진단 API', () => getSetupStatus(baseUrl)),
    timedCheck('engines-route', 'TTS 엔진 API', () => listEngines(baseUrl)),
    timedCheck('clone-route', '목소리 복제 API', () => getVoiceCloneCapability(baseUrl)),
  ])

  try {
    const result = await apiRequest<ApiConnectivityResponse>(
      '/connectivity',
      undefined,
      { baseUrl, timeoutMs: 10_000 },
    )
    const checks = [
      ...routeChecks,
      ...result.checks.map((check) => ({
        id: check.id,
        label: check.label,
        status: check.status,
        detail: check.detail,
        latencyMs: check.latency_ms,
      })),
    ]
    const missing = checks.some((check) => check.status === 'missing')
    const warning = checks.some((check) => check.status === 'warning')
    return {
      version: result.version,
      baseUrl,
      status: missing ? 'missing' : warning ? 'warning' : 'ready',
      environment: result.environment,
      apiReady: result.api_ready,
      ttsReady: result.tts_ready,
      voiceCloneReady: result.voice_clone_ready,
      workerConfigured: result.worker_configured,
      checks,
      warnings: result.cors_origins.length
        ? []
        : ['API의 CORS 허용 주소가 비어 있습니다.'],
      ttsEngines: result.tts_engines.map(mapEngine),
      voiceCloneEngines: result.voice_clone_engines.map(mapEngine),
    }
  } catch (error) {
    return {
      version: null,
      baseUrl,
      status: 'missing',
      environment: null,
      apiReady: routeChecks.some((check) => check.id === 'health-route' && check.status === 'ready'),
      ttsReady: false,
      voiceCloneReady: false,
      workerConfigured: false,
      checks: [
        ...routeChecks,
        {
          id: 'connectivity-route',
          label: '통합 연결 진단 API',
          status: 'missing',
          detail: error instanceof ApiError ? `${error.code} · ${error.message}` : '통합 진단에 실패했습니다.',
          latencyMs: null,
        },
      ],
      warnings: [],
      ttsEngines: [],
      voiceCloneEngines: [],
    }
  }
}
