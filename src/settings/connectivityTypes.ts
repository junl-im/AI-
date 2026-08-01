import type { EngineInfo } from '../ai/contracts'

export type ConnectivityStatus = 'ready' | 'warning' | 'missing'

export interface ConnectivityCheck {
  id: string
  label: string
  status: ConnectivityStatus
  detail: string
  latencyMs: number | null
}

export interface ApiConnectivityReport {
  version: string | null
  baseUrl: string
  status: ConnectivityStatus
  environment: string | null
  apiReady: boolean
  ttsReady: boolean
  voiceCloneReady: boolean
  workerConfigured: boolean
  checks: ConnectivityCheck[]
  warnings: string[]
  ttsEngines: EngineInfo[]
  voiceCloneEngines: EngineInfo[]
}
