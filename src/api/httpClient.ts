import { adaptiveTimeoutMs, getMobileNetworkSnapshot } from '../network/mobileNetwork'
import { createRandomId } from '../utils/randomId'
import {
  getApiBaseUrl,
  getApiClientId,
  getApiConnectionProblem,
  getApiDiscoveryCandidates,
  loadRuntimeApiCandidates,
  normalizeApiBaseUrl,
  rememberApiUrl,
} from './apiConnection'
import { ApiError, type ApiFailureKind } from './apiTypes'

export {
  getApiBaseUrl,
  getApiBaseWarnings,
  getApiConnectionContext,
  getApiDiscoveryCandidates,
  getLocationApiCandidates,
  isKnownStaticHostingHostname,
  normalizeApiBaseUrl,
  requestAutomaticApiReconnect,
  resetApiBaseUrl,
  saveApiBaseUrl,
} from './apiConnection'
export type { ApiBaseSource, ApiConnectionContext } from './apiConnection'
export { ApiError } from './apiTypes'
export type { ApiFailureKind } from './apiTypes'

const DEFAULT_TIMEOUT_MS = 12_000
const RETRYABLE_STATUS = new Set([408, 425, 429, 502, 503, 504])

function dispatchConnectionEvent(name: string, detail: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(name, { detail }))
}

export interface ApiProbeResult {
  baseUrl: string
  version: string
  defaultEngine: string
  latencyMs: number
}

interface ApiRequestOptions {
  timeoutMs?: number
  signal?: AbortSignal
  baseUrl?: string
  retries?: number
}

interface ApiHealthPayload {
  status: 'ok'
  version: string
  default_engine: string
}

function errorDetail(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map((item) => errorDetail(item)).filter(Boolean).join(', ')
  if (value && typeof value === 'object' && 'msg' in value && typeof value.msg === 'string') {
    return value.msg
  }
  return null
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener('abort', abort)
      resolve()
    }
    const timer = globalThis.setTimeout(finish, ms)
    const abort = () => {
      globalThis.clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
      reject(new ApiError('요청을 취소했습니다.', 499, 'SOA-2003', 'cancelled'))
    }
    if (signal?.aborted) {
      abort()
      return
    }
    signal?.addEventListener('abort', abort, { once: true })
  })
}

export async function probeApiBaseUrl(value: string, timeoutMs = 3_500): Promise<ApiProbeResult> {
  const baseUrl = normalizeApiBaseUrl(value)
  if (!baseUrl) throw new ApiError('검사할 자동 연결 후보가 없습니다.', 0, 'SOA-2004', 'invalid-url')
  const blocked = getApiConnectionProblem(baseUrl)
  if (blocked) throw blocked
  const started = performance.now()
  const payload = await apiRequest<ApiHealthPayload>('/health', undefined, {
    baseUrl,
    timeoutMs,
    retries: 0,
  })
  if (payload.status !== 'ok') {
    throw new ApiError('SoriON Health 응답이 올바르지 않습니다.', 502, 'SOA-2011', 'server', true)
  }
  return {
    baseUrl,
    version: payload.version,
    defaultEngine: payload.default_engine,
    latencyMs: Math.round(performance.now() - started),
  }
}

export async function discoverApiBaseUrl(excludeBaseUrl = ''): Promise<ApiProbeResult> {
  const excluded = normalizeApiBaseUrl(excludeBaseUrl)
  const candidates = [...new Set([
    ...(await loadRuntimeApiCandidates()),
    ...getApiDiscoveryCandidates(),
  ])].filter((candidate) => candidate !== excluded)
  const attempts: string[] = []
  for (const candidate of candidates) {
    try {
      return await probeApiBaseUrl(candidate)
    } catch (error) {
      attempts.push(`${candidate}: ${error instanceof Error ? error.message : '연결 실패'}`)
    }
  }
  if (attempts.length > 0) {
    console.warn('[SoriON] automatic voice server discovery failed', attempts)
  }
  throw new ApiError(
    candidates.length === 0
      ? '배포된 음성 서버 주소가 설정되지 않았습니다. 시스템 설정을 확인하며 자동으로 다시 시도합니다.'
      : '음성 서버에 연결하지 못했습니다. 네트워크와 서버 상태를 확인하며 자동으로 다시 시도합니다.',
    0,
    'SOA-2012',
    'cors-or-network',
    true,
  )
}

export function resolveApiAssetUrl(value: string | null): string | null {
  if (!value) return null
  if (/^https?:\/\//i.test(value) || value.startsWith('blob:') || value.startsWith('data:')) return value
  const baseUrl = getApiBaseUrl()
  if (!baseUrl) return value
  try {
    const api = new URL(baseUrl, typeof window === 'undefined' ? 'http://localhost' : window.location.origin)
    return new URL(value, api.origin).toString()
  } catch {
    return value
  }
}

function responseErrorKind(status: number): ApiFailureKind {
  if (status === 429) return 'rate-limit'
  if (status >= 500) return 'server'
  return 'unknown'
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  options: ApiRequestOptions = {},
): Promise<T> {
  const baseUrl = options.baseUrl ? normalizeApiBaseUrl(options.baseUrl) : getApiBaseUrl()
  if (!baseUrl) {
    throw new ApiError(
      '배포된 음성 서버 주소가 설정되지 않았습니다. 시스템이 자동으로 다시 확인합니다.',
      0,
      'SOA-2000',
      'unconfigured',
    )
  }
  const blocked = getApiConnectionProblem(baseUrl)
  if (blocked) throw blocked

  const method = (init?.method ?? 'GET').toUpperCase()
  const retries = options.retries ?? (method === 'GET' || method === 'HEAD' ? 2 : 0)
  const requestId = createRandomId()
  let lastError: ApiError | null = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController()
    const timeoutMs = adaptiveTimeoutMs(options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
    const timer = globalThis.setTimeout(() => controller.abort('timeout'), timeoutMs)
    const abortFromCaller = () => controller.abort('caller')
    options.signal?.addEventListener('abort', abortFromCaller, { once: true })

    try {
      const headers = new Headers(init?.headers)
      headers.set('Accept', 'application/json')
      headers.set('X-Request-ID', requestId)
      headers.set('X-SoriON-Client-ID', getApiClientId())
      if (!(init?.body instanceof FormData) && init?.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers,
        cache: method === 'GET' ? 'no-store' : init?.cache,
        credentials: 'omit',
      })
      const responseRequestId = response.headers.get('X-Request-ID') ?? requestId
      const contentType = response.headers.get('content-type') ?? ''
      const data = contentType.includes('application/json')
        ? await response.json() as T & { detail?: unknown; code?: string }
        : {} as T & { detail?: unknown; code?: string }
      if (!response.ok) {
        const retryable = RETRYABLE_STATUS.has(response.status)
        throw new ApiError(
          errorDetail(data.detail) ?? '요청을 처리하지 못했습니다.',
          response.status,
          data.code ?? 'SOA-2008',
          responseErrorKind(response.status),
          retryable,
          responseRequestId,
        )
      }
      rememberApiUrl(baseUrl, true)
      dispatchConnectionEvent('sorion-api-success', { baseUrl, path, requestId: responseRequestId })
      return data
    } catch (error) {
      if (error instanceof ApiError) {
        lastError = error
      } else if (controller.signal.aborted) {
        lastError = options.signal?.aborted || controller.signal.reason === 'caller'
          ? new ApiError('음성 생성을 취소했습니다.', 499, 'SOA-2003', 'cancelled')
          : new ApiError('모바일 네트워크 응답 시간이 초과되었습니다.', 408, 'SOA-2002', 'timeout', true, requestId)
      } else {
        const network = getMobileNetworkSnapshot()
        lastError = new ApiError(
          network.online
            ? 'API에 연결할 수 없습니다. 주소·HTTPS·CORS·방화벽을 확인해 주세요.'
            : '현재 오프라인입니다. 연결되면 자동으로 다시 시도합니다.',
          0,
          network.online ? 'SOA-2001' : 'SOA-2005',
          network.online ? 'cors-or-network' : 'offline',
          true,
          requestId,
        )
      }
    } finally {
      globalThis.clearTimeout(timer)
      options.signal?.removeEventListener('abort', abortFromCaller)
    }

    if (!lastError.retryable || attempt >= retries || options.signal?.aborted) break
    await wait(350 * (attempt + 1), options.signal)
  }

  const failure = lastError ?? new ApiError('알 수 없는 API 오류가 발생했습니다.', 0)
  dispatchConnectionEvent('sorion-api-failure', {
    baseUrl,
    path,
    code: failure.code,
    kind: failure.kind,
  })
  throw failure
}
