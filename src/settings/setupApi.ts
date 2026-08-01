import { apiRequest } from '../api/httpClient'
import type { SetupStatus } from './setupTypes'

interface ApiSetupStep {
  id: string
  label: string
  status: SetupStatus['steps'][number]['status']
  required: boolean
  detail: string
  action: string | null
}

interface ApiSetupStatus {
  version: string
  ready: boolean
  real_engine_count: number
  steps: ApiSetupStep[]
}

export async function getSetupStatus(baseUrl?: string, signal?: AbortSignal): Promise<SetupStatus> {
  const result = await apiRequest<ApiSetupStatus>('/setup', undefined, {
    baseUrl,
    signal,
    timeoutMs: 8_000,
    retries: 1,
  })
  return {
    version: result.version,
    ready: result.ready,
    realEngineCount: result.real_engine_count,
    steps: result.steps,
  }
}
