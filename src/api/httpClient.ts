const DEFAULT_TIMEOUT_MS = 12_000
const API_PATH = '/api/v1'
const API_BASE_STORAGE_KEY = 'sorion-api-base-url'
const ENV_API_BASE = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''

export type ApiBaseSource = 'saved' | 'environment' | 'development-proxy' | 'unconfigured'

export interface ApiConnectionContext {
  baseUrl: string
  source: ApiBaseSource
  configured: boolean
  warnings: string[]
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
  ) {
    super(message)
  }
}

interface ApiRequestOptions {
  timeoutMs?: number
  signal?: AbortSignal
  baseUrl?: string
}

interface ApiHealthPayload {
  status: 'ok'
  version: string
  default_engine: string
}

function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
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

export function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('/')) {
    return normalizePath(trimmed)
  }

  try {
    const url = new URL(trimmed)
    url.pathname = normalizePath(url.pathname)
    url.search = ''
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    const cleaned = trimmed.replace(/\/+$/, '')
    const apiIndex = cleaned.indexOf(API_PATH)
    return apiIndex >= 0
      ? cleaned.slice(0, apiIndex + API_PATH.length)
      : `${cleaned}${API_PATH}`
  }
}

export function getApiBaseWarnings(value: string): string[] {
  if (typeof window === 'undefined') return []
  const baseUrl = normalizeApiBaseUrl(value)
  const warnings: string[] = []
  if (!baseUrl) {
    warnings.push('현재 웹 배포에는 Python Voice API가 포함되어 있지 않습니다.')
    return warnings
  }

  try {
    const apiUrl = new URL(baseUrl, window.location.origin)
    const browserIsRemote = !isLoopbackHostname(window.location.hostname)
    if (browserIsRemote && isLoopbackHostname(apiUrl.hostname)) {
      warnings.push('휴대폰의 localhost는 휴대폰 자신입니다. PC의 LAN 주소 또는 HTTPS API가 필요합니다.')
    }
    if (
      window.location.protocol === 'https:'
      && apiUrl.protocol === 'http:'
      && !isLoopbackHostname(apiUrl.hostname)
    ) {
      warnings.push('HTTPS 웹앱에서 HTTP API 연결은 브라우저 보안 정책으로 차단될 수 있습니다.')
    }
  } catch {
    warnings.push('Voice API 주소 형식이 올바르지 않습니다.')
  }
  return warnings
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
    }
  }

  const saved = window.localStorage.getItem(API_BASE_STORAGE_KEY)?.trim() ?? ''
  const baseUrl = saved || developmentDefault()
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
  }
}

export function getApiBaseUrl(): string {
  return getApiConnectionContext().baseUrl
}

export function saveApiBaseUrl(value: string): string {
  const normalized = normalizeApiBaseUrl(value)
  if (!normalized) throw new ApiError('저장할 Voice API 주소를 입력해 주세요.', 0, 'SOA-2000')
  window.localStorage.setItem(API_BASE_STORAGE_KEY, normalized)
  window.dispatchEvent(new Event('sorion-api-change'))
  return normalized
}

export function resetApiBaseUrl(): void {
  window.localStorage.removeItem(API_BASE_STORAGE_KEY)
  window.dispatchEvent(new Event('sorion-api-change'))
}

export function getApiDiscoveryCandidates(): string[] {
  const candidates = new Set<string>()
  const context = getApiConnectionContext()
  if (context.baseUrl) candidates.add(normalizeApiBaseUrl(context.baseUrl))

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location
    if (isLoopbackHostname(hostname)) candidates.add(API_PATH)
    candidates.add('http://127.0.0.1:8000/api/v1')
    candidates.add('http://localhost:8000/api/v1')
    if (protocol === 'http:' && !isLoopbackHostname(hostname)) {
      candidates.add(`http://${hostname}:8000/api/v1`)
    }
  }

  return [...candidates].filter(Boolean)
}

export async function probeApiBaseUrl(
  value: string,
  timeoutMs = 2_500,
): Promise<ApiProbeResult> {
  const baseUrl = normalizeApiBaseUrl(value)
  if (!baseUrl) throw new ApiError('검사할 Voice API 주소가 없습니다.', 0, 'SOA-2000')

  const controller = new AbortController()
  const started = performance.now()
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${baseUrl}/health`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) {
      throw new ApiError(`Health 응답이 ${response.status}입니다.`, response.status, 'SOA-2010')
    }
    const payload = await response.json() as ApiHealthPayload
    if (payload.status !== 'ok') {
      throw new ApiError('SoriON Health 응답이 올바르지 않습니다.', 502, 'SOA-2011')
    }
    return {
      baseUrl,
      version: payload.version,
      defaultEngine: payload.default_engine,
      latencyMs: Math.round(performance.now() - started),
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (controller.signal.aborted) {
      throw new ApiError('Voice API 자동 검색 시간이 초과되었습니다.', 408, 'SOA-2002')
    }
    throw new ApiError('이 주소에서 SoriON Voice API를 찾지 못했습니다.', 0, 'SOA-2001')
  } finally {
    globalThis.clearTimeout(timer)
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

export async function apiRequest<T>(path: string, init?: RequestInit, options: ApiRequestOptions = {}): Promise<T> {
  const baseUrl = options.baseUrl ? normalizeApiBaseUrl(options.baseUrl) : getApiBaseUrl()
  if (!baseUrl) {
    throw new ApiError('Voice API 주소가 설정되지 않았습니다. 채팅의 엔진 연결 메시지에서 API를 연결해 주세요.', 0, 'SOA-2000')
  }

  const controller = new AbortController()
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const timer = globalThis.setTimeout(() => controller.abort('timeout'), timeoutMs)
  const abortFromCaller = () => controller.abort('caller')
  options.signal?.addEventListener('abort', abortFromCaller, { once: true })

  try {
    const headers = new Headers(init?.headers)
    if (!(init?.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers,
    })

    const contentType = response.headers.get('content-type') ?? ''
    const data = contentType.includes('application/json')
      ? await response.json() as T & { detail?: unknown; code?: string }
      : {} as T & { detail?: unknown; code?: string }
    if (!response.ok) {
      throw new ApiError(errorDetail(data.detail) ?? '요청을 처리하지 못했습니다.', response.status, data.code)
    }
    return data
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (controller.signal.aborted) {
      if (options.signal?.aborted || controller.signal.reason === 'caller') {
        throw new ApiError('음성 생성을 취소했습니다.', 499, 'SOA-2003')
      }
      throw new ApiError('서버 응답 시간이 초과되었습니다.', 408, 'SOA-2002')
    }
    throw new ApiError('AI 서버에 연결할 수 없습니다. API 실행 주소와 CORS 설정을 확인해 주세요.', 0, 'SOA-2001')
  } finally {
    globalThis.clearTimeout(timer)
    options.signal?.removeEventListener('abort', abortFromCaller)
  }
}
