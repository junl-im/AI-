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

interface ApiVoicePresetDiagnostic {
  voice_id: string
  filename: string
  status: SetupStatus['voicePresetDiagnostics'][number]['status']
  usable: boolean
  duration_seconds: number | null
  sample_rate: number | null
  channel_count: number | null
  sample_width_bits: number | null
  silence_ratio: number | null
  clipping_ratio: number | null
  issues: string[]
}

interface ApiSetupStatus {
  version: string
  ready: boolean
  real_engine_count: number
  voice_preset_ready_count?: number
  voice_preset_expected_count?: number
  voice_preset_diagnostics?: ApiVoicePresetDiagnostic[]
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
    voicePresetReadyCount: result.voice_preset_ready_count ?? 0,
    voicePresetExpectedCount: result.voice_preset_expected_count ?? 3,
    voicePresetDiagnostics: (result.voice_preset_diagnostics ?? []).map((item) => ({
      voiceId: item.voice_id,
      filename: item.filename,
      status: item.status,
      usable: item.usable,
      durationSeconds: item.duration_seconds,
      sampleRate: item.sample_rate,
      channelCount: item.channel_count,
      sampleWidthBits: item.sample_width_bits,
      silenceRatio: item.silence_ratio,
      clippingRatio: item.clipping_ratio,
      issues: item.issues,
    })),
    steps: result.steps,
  }
}
