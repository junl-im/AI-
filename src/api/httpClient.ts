import { adaptiveTimeoutMs, getMobileNetworkSnapshot } from '../network/mobileNetwork'
import { createRandomId } from '../utils/randomId'

const DEFAULT_TIMEOUT_MS = 12_000
const API_PATH = '/api/v1'
const API_BASE_STORAGE_KEY = 'sorion-api-base-url'
const API_LAST_GOOD_KEY = 'sorion-api-last-good-url'
const API_HISTORY_KEY = 'sorion-api-url-history'
const CLIENT_ID_KEY = 'sorion-client-id'
const ENV_API_BASE = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
const RETRYABLE_STATUS = new Set([408, 425, 429, 502, 503, 504])
const volatileStorage = new Map<string, string>()

export type ApiBaseSource = 'saved' | 'environment' | 'development-proxy' | 'unconfigured'
export type ApiFailureKind =
  | 'unconfigured'
  | 'offline'
  | 'mixed-content'
  | 'mobile-localhost'
  | 'timeout'
  | 'cors-or-network'
  | 'rate-limit'
  | 'server'
  | 'cancelled'
  | 'invalid-url'
  | 'unknown'

function storageGet(key: string): string | null {
  if (typeof window === 'undefined') return volatileStorage.get(key) ?? null
  try {
    return window.localStorage.getItem(key) ?? volatileStorage.get(key) ?? null
  } catch {
    return volatileStorage.get(key) ?? null
  }
}

function storageSet(key: string, value: string): void {
  volatileStorage.set(key, value)
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
    volatileStorage.delete(key)
  } catch {
    // iOS Safari private mode and quota errors fall back to in-memory state.
  }
}

function storageRemove(key: string): void {
  volatileStorage.delete(key)
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Storage may be unavailable; the volatile copy is already removed.
  }
}

export interface ApiConnectionContext {
  baseUrl: string
  source: ApiBaseSource
  configured: boolean
  warnings: string[]
  lastGoodUrl: string
  history: string[]
}

export interface ApiProbeResult {
  baseUrl: string
  version: string
  defaultEngine: string
  latencyMs: number
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code = 'SOA-2000',
    readonly kind: ApiFailureKind = 'unknown',
    readonly retryable = false,
    readonly requestId: string | null = null,
  ) {
    super(message)
  }
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

function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function isLikelyMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  return navigator.maxTouchPoints > 1
    && (window.innerWidth <= 1024 || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent))
}

function looksLikeIpOrLocalHost(value: string): boolean {
  const host = value.split('/')[0]?.split(':')[0] ?? ''
  return isLoopbackHostname(host)
    || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
    || host.endsWith('.local')
}

function developmentDefault(): string {
  if (ENV_API_BASE) return normalizeApiBaseUrl(ENV_API_BASE)
  if (typeof window !== 'undefined' && isLoopbackHostname(window.location.hostname)) {
    return API_PATH
  }
  return ''
}

function normalizePath(pathname: string): string {
  const cleaned = pathname.replace(/\/+$/, '')
  const apiIndex = cleaned.indexOf(API_PATH)
  if (apiIndex >= 0) return cleaned.slice(0, apiIndex + API_PATH.length)
  if (!cleaned || cleaned === '/') return API_PATH
  return `${cleaned}${API_PATH}`
}

function withInferredScheme(value: string): string {
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(value)) return value
  if (value.startsWith('/')) return value
  const scheme = looksLikeIpOrLocalHost(value)
    ? 'http:'
    : typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? 'https:'
      : 'http:'
  return `${scheme}//${value}`
}

export function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('/')) return normalizePath(trimmed)

  try {
    const url = new URL(withInferredScheme(trimmed))
    url.pathname = normalizePath(url.pathname)
    url.search = ''
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return ''
  }
}

function connectionProblem(value: string): ApiError | null {
  if (typeof window === 'undefined') return null
  const baseUrl = normalizeApiBaseUrl(value)
  if (!baseUrl) {
    return new ApiError('음성 시스템 연결 주소 형식이 올바르지 않습니다.', 0, 'SOA-2004', 'invalid-url')
  }
  if (!navigator.onLine) {
    return new ApiError('휴대폰이 오프라인입니다. 네트워크 연결 후 자동으로 다시 확인합니다.', 0, 'SOA-2005', 'offline', true)
  }
  const apiUrl = new URL(baseUrl, window.location.origin)
  const browserIsRemote = !isLoopbackHostname(window.location.hostname)
  if (browserIsRemote && isLoopbackHostname(apiUrl.hostname) && isLikelyMobileDevice()) {
    return new ApiError(
      '휴대폰에서는 localhost 후보를 사용할 수 없습니다. 배포된 HTTPS 음성 시스템이 필요합니다.',
      0,
      'SOA-2006',
      'mobile-localhost',
    )
  }
  if (
    window.location.protocol === 'https:'
    && apiUrl.protocol === 'http:'
    && !isLoopbackHostname(apiUrl.hostname)
  ) {
    return new ApiError(
      'HTTPS 웹앱에서는 HTTP 음성 시스템이 차단됩니다. 배포 설정에 HTTPS API가 필요합니다.',
      0,
      'SOA-2007',
      'mixed-content',
    )
  }
  return null
}

export function getApiBaseWarnings(value: string): string[] {
  if (!value.trim()) return ['현재 웹 배포에는 Python Voice API가 포함되어 있지 않습니다.']
  const problem = connectionProblem(value)
  return problem ? [problem.message] : []
}

function readHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(storageGet(API_HISTORY_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function rememberApiUrl(value: string, lastGood: boolean): void {
  if (typeof window === 'undefined') return
  const normalized = normalizeApiBaseUrl(value)
  if (!normalized) return
  const history = [normalized, ...readHistory().filter((item) => item !== normalized)].slice(0, 5)
  storageSet(API_HISTORY_KEY, JSON.stringify(history))
  if (lastGood) storageSet(API_LAST_GOOD_KEY, normalized)
}

function errorDetail(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map((item) => errorDetail(item)).filter(Boolean).join(', ')
  if (value && typeof value === 'object' && 'msg' in value && typeof value.msg === 'string') {
    return value.msg
  }
  return null
}

export function getApiConnectionContext(): ApiConnectionContext {
  if (typeof window === 'undefined') {
    const baseUrl = developmentDefault()
    return {
      baseUrl,
      source: ENV_API_BASE ? 'environment' : 'development-proxy',
      configured: Boolean(baseUrl),
      warnings: [],
      lastGoodUrl: '',
      history: [],
    }
  }

  const saved = storageGet(API_BASE_STORAGE_KEY)?.trim() ?? ''
  const baseUrl = normalizeApiBaseUrl(saved || developmentDefault())
  const source: ApiBaseSource = saved
    ? 'saved'
    : ENV_API_BASE
      ? 'environment'
      : baseUrl
        ? 'development-proxy'
        : 'unconfigured'
  return {
    baseUrl,
    source,
    configured: Boolean(baseUrl),
    warnings: getApiBaseWarnings(baseUrl),
    lastGoodUrl: storageGet(API_LAST_GOOD_KEY) ?? '',
    history: readHistory(),
  }
}

export function getApiBaseUrl(): string {
  return getApiConnectionContext().baseUrl
}

export function saveApiBaseUrl(value: string): string {
  const normalized = normalizeApiBaseUrl(value)
  if (!normalized) throw new ApiError('자동 연결 주소를 확인할 수 없습니다.', 0, 'SOA-2004', 'invalid-url')
  storageSet(API_BASE_STORAGE_KEY, normalized)
  rememberApiUrl(normalized, false)
  window.dispatchEvent(new Event('sorion-api-change'))
  return normalized
}

export function resetApiBaseUrl(): void {
  storageRemove(API_BASE_STORAGE_KEY)
  window.dispatchEvent(new Event('sorion-api-change'))
}

export function getApiDiscoveryCandidates(): string[] {
  const candidates = new Set<string>()
  const context = getApiConnectionContext()
  if (typeof window !== 'undefined') {
    candidates.add(normalizeApiBaseUrl(`${window.location.origin}${API_PATH}`))
  }
  ;[ENV_API_BASE, context.lastGoodUrl, context.baseUrl, ...context.history]
    .map(normalizeApiBaseUrl)
    .filter(Boolean)
    .forEach((item) => candidates.add(item))
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location
    if (isLoopbackHostname(hostname)) {
      candidates.add(normalizeApiBaseUrl('http://127.0.0.1:8000'))
      candidates.add(normalizeApiBaseUrl('http://localhost:8000'))
    }
    if (protocol === 'http:' && !isLoopbackHostname(hostname)) {
      candidates.add(normalizeApiBaseUrl(`http://${hostname}:8000`))
    }
    if (protocol === 'https:') {
      candidates.add(normalizeApiBaseUrl(`https://${hostname}:8443`))
    }
  }
  return [...candidates].filter(Boolean)
}
export function requestAutomaticApiReconnect(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('sorion-api-reconnect'))
}

function clientId(): string {
  if (typeof window === 'undefined') return 'sorion-server-render'
  const saved = storageGet(CLIENT_ID_KEY)
  if (saved) return saved
  const value = createRandomId()
  storageSet(CLIENT_ID_KEY, value)
  return value
}

function dispatchConnectionEvent(name: 'sorion-api-success' | 'sorion-api-failure', detail: object): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name, { detail }))
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
  const blocked = connectionProblem(baseUrl)
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

export async function discoverApiBaseUrl(): Promise<ApiProbeResult> {
  const attempts: string[] = []
  for (const candidate of getApiDiscoveryCandidates()) {
    try {
      return await probeApiBaseUrl(candidate)
    } catch (error) {
      attempts.push(`${candidate}: ${error instanceof Error ? error.message : '연결 실패'}`)
    }
  }
  throw new ApiError(
    `Voice API를 자동으로 찾지 못했습니다. ${attempts.join(' / ')}`,
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
      '음성 시스템을 자동으로 연결하지 못했습니다. 서버 배포 설정을 확인해 주세요.',
      0,
      'SOA-2000',
      'unconfigured',
    )
  }
  const blocked = connectionProblem(baseUrl)
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
      headers.set('X-SoriON-Client-ID', clientId())
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
