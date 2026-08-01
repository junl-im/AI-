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
