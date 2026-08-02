import type { EngineInfo, TtsSynthesisRequest, TtsSynthesisResult } from '../ai/contracts'
import { getVoicePreset } from './voicePresets'

export const BROWSER_SPEECH_ENGINE_ID = 'browser-speech'

export interface BrowserSpeechPlayback {
  text: string
  lang: string
  rate: number
  pitch: number
  voiceId: string
}

function koreanTextUnits(text: string): number {
  return Array.from(text.trim()).reduce((total, character) => (
    total + (/\s/.test(character) ? 0.2 : /[.!?。！？]/.test(character) ? 1.8 : 1)
  ), 0)
}

export function estimateBrowserSpeechDuration(text: string, rate = 1): number {
  const units = koreanTextUnits(text)
  return Math.max(0.9, units / (5.4 * Math.max(0.5, rate)))
}

export function isBrowserSpeechSupported(): boolean {
  return typeof window !== 'undefined'
    && typeof window.speechSynthesis !== 'undefined'
    && typeof globalThis.SpeechSynthesisUtterance === 'function'
}

export function getBrowserSpeechEngine(): EngineInfo | null {
  if (!isBrowserSpeechSupported()) return null
  return {
    id: BROWSER_SPEECH_ENGINE_ID,
    name: '브라우저 한국어 음성',
    kind: 'browser-speech',
    mode: 'browser',
    provider: 'Web Speech API',
    languages: ['ko-KR'],
    outputFormats: [],
    supportsEmotion: false,
    supportsSpeed: true,
    supportsPitch: true,
    supportsVoiceClone: false,
    ready: true,
    reason: '브라우저 내장 음성으로 즉시 재생합니다. 파일 다운로드와 AI 음색은 Voice API 연결 후 사용할 수 있습니다.',
    autoEligible: true,
    recommended: false,
    health: 'ready',
    successCount: 0,
    failureCount: 0,
    consecutiveFailures: 0,
    cooldownRemainingSeconds: 0,
    lastError: null,
  }
}

export function createBrowserSpeechResult(
  request: TtsSynthesisRequest,
  jobId: string,
  fallbackUsed = true,
): TtsSynthesisResult {
  return {
    jobId,
    status: 'completed',
    engineId: BROWSER_SPEECH_ENGINE_ID,
    engineMode: 'browser',
    audioUrl: null,
    estimatedDurationSeconds: estimateBrowserSpeechDuration(
      request.text,
      createBrowserSpeechPlayback(request).rate,
    ),
    message: '브라우저 내장 한국어 음성으로 재생합니다. AI 음색·WAV 다운로드는 공개 Voice API 연결 후 사용할 수 있습니다.',
    normalizedText: request.text,
    segmentCount: 1,
    processingMs: 0,
    fileSizeBytes: null,
    realtimeFactor: 0,
    requestedEngineId: request.engineId ?? 'auto',
    attemptedEngineIds: [BROWSER_SPEECH_ENGINE_ID],
    fallbackUsed,
  }
}

export function createBrowserSpeechPlayback(request: TtsSynthesisRequest): BrowserSpeechPlayback {
  const preset = getVoicePreset(request.voiceId)
  return {
    text: request.text,
    lang: 'ko-KR',
    rate: Math.min(2, Math.max(0.5, request.speed * preset.rateMultiplier)),
    pitch: Math.min(2, Math.max(0, 1 + (request.pitch + preset.pitchOffset) / 12)),
    voiceId: preset.id,
  }
}

function stableVoiceIndex(value: string, length: number): number {
  let hash = 0
  for (const character of value) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0
  return Math.abs(hash) % Math.max(1, length)
}

export function selectBrowserSpeechVoice(
  voices: SpeechSynthesisVoice[],
  voiceId: string,
): SpeechSynthesisVoice | null {
  const korean = voices.filter((voice) => voice.lang.toLowerCase().startsWith('ko'))
  const candidates = korean.length > 0 ? korean : voices
  if (candidates.length === 0) return null
  const preset = getVoicePreset(voiceId)
  const preferred = candidates.find((voice) => {
    const identity = `${voice.name} ${voice.voiceURI}`.toLowerCase()
    return preset.preferredVoiceTokens.some((token) => identity.includes(token))
  })
  return preferred ?? candidates[stableVoiceIndex(preset.id, candidates.length)] ?? candidates[0]
}

export function createBrowserSpeechUtterance(
  playback: BrowserSpeechPlayback,
): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(playback.text)
  utterance.lang = playback.lang
  utterance.rate = playback.rate
  utterance.pitch = playback.pitch
  utterance.voice = selectBrowserSpeechVoice(window.speechSynthesis.getVoices(), playback.voiceId)
  return utterance
}
