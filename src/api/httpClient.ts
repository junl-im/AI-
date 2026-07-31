const DEFAULT_TIMEOUT_MS = 12_000

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
}

export async function apiRequest<T>(path: string, init?: RequestInit, options: ApiRequestOptions = {}): Promise<T> {
  const controller = new AbortController()
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const timer = window.setTimeout(() => controller.abort('timeout'), timeoutMs)
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
  const abortFromCaller = () => controller.abort('caller')
  options.signal?.addEventListener('abort', abortFromCaller, { once: true })

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })

    const contentType = response.headers.get('content-type') ?? ''
    const data = contentType.includes('application/json')
      ? await response.json() as T & { detail?: string; code?: string }
      : {} as T & { detail?: string; code?: string }
    if (!response.ok) {
      throw new ApiError(data.detail ?? '요청을 처리하지 못했습니다.', response.status, data.code)
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
    throw new ApiError('AI 서버에 연결할 수 없습니다.', 0, 'SOA-2001')
  } finally {
    window.clearTimeout(timer)
    options.signal?.removeEventListener('abort', abortFromCaller)
  }
}
