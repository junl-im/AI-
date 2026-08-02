import type { EngineInfo } from '../ai/contracts'

export type ConnectivityStatus = 'ready' | 'warning' | 'missing'
export type ConnectionLayerState = 'ready' | 'warning' | 'offline' | 'checking' | 'unknown'

export interface ConnectivityCheck {
  id: string
  label: string
  status: ConnectivityStatus
  detail: string
  latencyMs: number | null
}

export interface ConnectionLayer {
  state: ConnectionLayerState
  detail: string
}

export interface ApiConnectivityReport {
  version: string | null
  baseUrl: string
  status: ConnectivityStatus
  environment: string | null
  apiReady: boolean
  publicHttpsReady: boolean
  publicApiOrigin: string | null
  ttsReady: boolean
  voiceCloneReady: boolean
  workerConfigured: boolean
  workerHealthy: boolean
  gpuReady: boolean
  gpuName: string | null
  vramTotalMb: number | null
  requestId: string | null
  lastCheckedAt: string
  latencyMs: number
  recommendedRecheckSeconds: number
  layers: {
    api: ConnectionLayer
    tts: ConnectionLayer
    worker: ConnectionLayer
    gpu: ConnectionLayer
  }
  checks: ConnectivityCheck[]
  warnings: string[]
  ttsEngines: EngineInfo[]
  voiceCloneEngines: EngineInfo[]
}
