import { createRandomId } from '../utils/randomId'
import { ApiError } from './apiTypes'

const API_PATH = '/api/v1'
const API_BASE_STORAGE_KEY = 'sorion-api-base-url'
const API_LAST_GOOD_KEY = 'sorion-api-last-good-url'
const API_HISTORY_KEY = 'sorion-api-url-history'
const CLIENT_ID_KEY = 'sorion-client-id'
const ENV_API_BASE = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
const ENV_API_BASES = import.meta.env.VITE_API_BASE_URLS?.trim() ?? ''
const RUNTIME_CONFIG_PATH = `${import.meta.env.BASE_URL}sorion-runtime-config.json`
const volatileStorage = new Map<string, string>()

export type ApiBaseSource = 'saved' | 'environment' | 'development-proxy' | 'unconfigured'

export interface ApiConnectionContext {
  baseUrl: string
  source: ApiBaseSource
  configured: boolean
  warnings: string[]
  lastGoodUrl: string
  history: string[]
}

interface RuntimeApiConfig {
  apiBaseUrls?: unknown
}

function splitApiCandidates(value: string): string[] {
  return value
    .split(/[\n,;]/)
    .map((item) => normalizeApiBaseUrl(item))
    .filter((item): item is string => Boolean(item) && !isStaticHostingApiCandidate(item))
}

function environmentApiCandidates(): string[] {
  return [...new Set([
    ...splitApiCandidates(ENV_API_BASES),
    ...splitApiCandidates(ENV_API_BASE),
  ])]
}

export async function loadRuntimeApiCandidates(): Promise<string[]> {
  if (typeof window === 'undefined') return []
  try {
    const response = await fetch(RUNTIME_CONFIG_PATH, {
      cache: 'no-store',
      credentials: 'omit',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return []
    const payload = await response.json() as RuntimeApiConfig
    const values = Array.isArray(payload.apiBaseUrls)
      ? payload.apiBaseUrls.filter((item): item is string => typeof item === 'string')
      : []
    return [...new Set(
      values
        .filter((item) => /^https?:\/\//i.test(item.trim()))
        .flatMap(splitApiCandidates),
    )]
  } catch {
    return []
  }
}

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

function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

export function isKnownStaticHostingHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  return normalized.endsWith('.github.io')
    || normalized.endsWith('.web.app')
    || normalized.endsWith('.firebaseapp.com')
}


function isStaticHostingApiCandidate(value: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const candidate = new URL(normalizeApiBaseUrl(value), window.location.origin)
    return isKnownStaticHostingHostname(window.location.hostname)
      && candidate.origin === window.location.origin
  } catch {
    return false
  }
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

function developmentDefault(): string {
  const configured = environmentApiCandidates()[0]
  if (configured) return configured
  if (typeof window !== 'undefined' && isLoopbackHostname(window.location.hostname)) return API_PATH
  return ''
}

export function getApiConnectionProblem(value: string): ApiError | null {
  if (typeof window === 'undefined') return null
  const baseUrl = normalizeApiBaseUrl(value)
  if (!baseUrl) {
    return new ApiError('음성 시스템 연결 주소 형식이 올바르지 않습니다.', 0, 'SOA-2004', 'invalid-url')
  }
  if (!navigator.onLine) {
    return new ApiError(
      '휴대폰이 오프라인입니다. 네트워크 연결 후 자동으로 다시 확인합니다.',
      0,
      'SOA-2005',
      'offline',
      true,
    )
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
  const problem = getApiConnectionProblem(value)
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

export function rememberApiUrl(value: string, lastGood: boolean): void {
  if (typeof window === 'undefined') return
  const normalized = normalizeApiBaseUrl(value)
  if (!normalized) return
  const history = [normalized, ...readHistory().filter((item) => item !== normalized)].slice(0, 5)
  storageSet(API_HISTORY_KEY, JSON.stringify(history))
  if (lastGood) storageSet(API_LAST_GOOD_KEY, normalized)
}

export function getApiConnectionContext(): ApiConnectionContext {
  if (typeof window === 'undefined') {
    const baseUrl = developmentDefault()
    return {
      baseUrl,
      source: environmentApiCandidates().length > 0 ? 'environment' : 'development-proxy',
      configured: Boolean(baseUrl),
      warnings: [],
      lastGoodUrl: '',
      history: [],
    }
  }
  const saved = storageGet(API_BASE_STORAGE_KEY)?.trim() ?? ''
  const normalizedSaved = normalizeApiBaseUrl(saved)
  const safeSaved = normalizedSaved && !isStaticHostingApiCandidate(normalizedSaved)
    ? normalizedSaved
    : ''
  if (saved && !safeSaved) storageRemove(API_BASE_STORAGE_KEY)
  const baseUrl = safeSaved || developmentDefault()
  const source: ApiBaseSource = safeSaved
    ? 'saved'
    : environmentApiCandidates().length > 0
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
  if (!normalized || isStaticHostingApiCandidate(normalized)) {
    throw new ApiError('배포된 음성 서버 주소를 확인할 수 없습니다.', 0, 'SOA-2004', 'invalid-url')
  }
  storageSet(API_BASE_STORAGE_KEY, normalized)
  rememberApiUrl(normalized, false)
  window.dispatchEvent(new Event('sorion-api-change'))
  return normalized
}

export function resetApiBaseUrl(): void {
  storageRemove(API_BASE_STORAGE_KEY)
  window.dispatchEvent(new Event('sorion-api-change'))
}

interface BrowserLocationCandidate {
  hostname: string
  protocol: string
  origin: string
}

export function getLocationApiCandidates(location: BrowserLocationCandidate): string[] {
  const { hostname, protocol, origin } = location
  if (isKnownStaticHostingHostname(hostname)) {
    if (typeof window !== 'undefined' && !isLikelyMobileDevice()) {
      return [
        normalizeApiBaseUrl('http://127.0.0.1:8000'),
        normalizeApiBaseUrl('http://localhost:8000'),
      ].filter(Boolean)
    }
    return []
  }
  const candidates = [normalizeApiBaseUrl(`${origin}${API_PATH}`)]
  if (isLoopbackHostname(hostname)) {
    candidates.push(normalizeApiBaseUrl('http://127.0.0.1:8000'))
    candidates.push(normalizeApiBaseUrl('http://localhost:8000'))
  } else if (protocol === 'http:') {
    candidates.push(normalizeApiBaseUrl(`http://${hostname}:8000`))
  } else if (protocol === 'https:') {
    candidates.push(normalizeApiBaseUrl(`https://${hostname}:8443`))
  }
  return candidates.filter(Boolean)
}

export function getApiDiscoveryCandidates(): string[] {
  const candidates = new Set<string>()
  const context = getApiConnectionContext()
  environmentApiCandidates().forEach((item) => candidates.add(item))
  if (typeof window !== 'undefined') {
    getLocationApiCandidates(window.location).forEach((item) => candidates.add(item))
    ;[context.lastGoodUrl, context.baseUrl, ...context.history]
      .map(normalizeApiBaseUrl)
      .filter((item) => Boolean(item) && !isStaticHostingApiCandidate(item))
      .forEach((item) => candidates.add(item))
  } else {
    ;[context.lastGoodUrl, context.baseUrl, ...context.history]
      .map(normalizeApiBaseUrl)
      .filter(Boolean)
      .forEach((item) => candidates.add(item))
  }
  return [...candidates].filter(Boolean)
}

export function requestAutomaticApiReconnect(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('sorion-api-reconnect'))
}

export function getApiClientId(): string {
  if (typeof window === 'undefined') return 'sorion-server-render'
  const saved = storageGet(CLIENT_ID_KEY)
  if (saved) return saved
  const value = createRandomId()
  storageSet(CLIENT_ID_KEY, value)
  return value
}
