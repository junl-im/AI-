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

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })

    const data = (await response.json()) as T & { detail?: string; code?: string }
    if (!response.ok) {
      throw new ApiError(data.detail ?? '요청을 처리하지 못했습니다.', response.status, data.code)
    }
    return data
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('서버 응답 시간이 초과되었습니다.', 408, 'SOA-2002')
    }
    throw new ApiError('AI 서버에 연결할 수 없습니다.', 0, 'SOA-2001')
  } finally {
    window.clearTimeout(timer)
  }
}
