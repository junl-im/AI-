import type { EngineInfo, TtsSynthesisRequest, TtsSynthesisResult } from '../ai/contracts'
import {
  requireVoicePreset,
  voicePresets,
  type VoiceGender,
  type VoicePreset,
} from './voicePresets'

export const BROWSER_SPEECH_ENGINE_ID = 'browser-speech'

export interface BrowserSpeechPlayback {
  text: string
  lang: string
  rate: number
  pitch: number
  voiceId: string
  expectedGender?: VoiceGender
}

export interface BrowserVoiceSelectionDiagnostic {
  voiceId: string
  presetName: string
  expectedGender: VoiceGender
  status: 'ready' | 'missing'
  selectedVoiceName: string | null
  selectedVoiceUri: string | null
  inferredGender: VoiceGender | 'unknown' | null
  selectionBasis: 'preferred-token' | 'variant-index' | 'none'
  koreanCandidateCount: number
  compatibleCandidateCount: number
  reason: string
}

const femaleVoiceTokens = [
  'female', 'woman', 'girl', '여성', '여자',
  'sunhi', 'yuna', 'heami', 'seoyeon', 'sora',
  'samantha', 'zira', 'susan', 'hazel',
]

const maleVoiceTokens = [
  'male', 'man', 'boy', '남성', '남자',
  'injoon', 'hyunsu', 'minsu', 'bongjin', 'yong', 'youngho',
  'david', 'mark', 'daniel', 'alex',
]

function voiceIdentity(voice: SpeechSynthesisVoice): string {
  return `${voice.name} ${voice.voiceURI}`.toLowerCase()
}

function identityIncludesToken(identity: string, token: string): boolean {
  if (['female', 'male', 'woman', 'man', 'girl', 'boy'].includes(token)) {
    return new RegExp(`(^|[^a-z])${token}([^a-z]|$)`).test(identity)
  }
  return identity.includes(token)
}

export function inferBrowserVoiceGender(voice: SpeechSynthesisVoice): VoiceGender | 'unknown' {
  const identity = voiceIdentity(voice)
  const female = femaleVoiceTokens.some((token) => identityIncludesToken(identity, token))
  const male = maleVoiceTokens.some((token) => identityIncludesToken(identity, token))
  if (female && !male) return 'female'
  if (male && !female) return 'male'
  return 'unknown'
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
    reason: '기기에 설치된 한국어 음성을 사용합니다. 성별이 확인되지 않거나 반대인 음성은 자동 선택하지 않습니다.',
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

function availableBrowserVoices(): SpeechSynthesisVoice[] {
  if (!isBrowserSpeechSupported()) return []
  return window.speechSynthesis.getVoices()
}

function compatibleVoices(
  voices: SpeechSynthesisVoice[],
  preset: VoicePreset,
): { korean: SpeechSynthesisVoice[]; compatible: SpeechSynthesisVoice[] } {
  const korean = voices.filter((voice) => voice.lang.toLowerCase().startsWith('ko'))
  const compatible = korean.filter((voice) => {
    const inferredGender = inferBrowserVoiceGender(voice)
    return preset.gender === 'neutral'
      ? inferredGender === 'unknown'
      : inferredGender === preset.gender
  })
  return { korean, compatible }
}

function selectBrowserSpeechVoiceWithEvidence(
  voices: SpeechSynthesisVoice[],
  preset: VoicePreset,
): { voice: SpeechSynthesisVoice | null; diagnostic: BrowserVoiceSelectionDiagnostic } {
  const { korean, compatible } = compatibleVoices(voices, preset)
  if (korean.length === 0) {
    return {
      voice: null,
      diagnostic: {
        voiceId: preset.id,
        presetName: preset.name,
        expectedGender: preset.gender,
        status: 'missing',
        selectedVoiceName: null,
        selectedVoiceUri: null,
        inferredGender: null,
        selectionBasis: 'none',
        koreanCandidateCount: 0,
        compatibleCandidateCount: 0,
        reason: '설치된 한국어 브라우저 음성이 없습니다.',
      },
    }
  }
  if (compatible.length === 0) {
    return {
      voice: null,
      diagnostic: {
        voiceId: preset.id,
        presetName: preset.name,
        expectedGender: preset.gender,
        status: 'missing',
        selectedVoiceName: null,
        selectedVoiceUri: null,
        inferredGender: null,
        selectionBasis: 'none',
        koreanCandidateCount: korean.length,
        compatibleCandidateCount: 0,
        reason: '성별이 확인되는 호환 한국어 음성이 없습니다. 반대 성별은 사용하지 않습니다.',
      },
    }
  }

  const preferred = compatible.find((voice) => {
    const identity = voiceIdentity(voice)
    return preset.preferredVoiceTokens.some((token) => identityIncludesToken(identity, token))
  })
  const selected = preferred ?? compatible[preset.voiceVariantIndex] ?? null
  if (!selected) {
    return {
      voice: null,
      diagnostic: {
        voiceId: preset.id,
        presetName: preset.name,
        expectedGender: preset.gender,
        status: 'missing',
        selectedVoiceName: null,
        selectedVoiceUri: null,
        inferredGender: null,
        selectionBasis: 'none',
        koreanCandidateCount: korean.length,
        compatibleCandidateCount: compatible.length,
        reason: `호환 후보가 ${compatible.length}개뿐이라 프리셋 순번 ${preset.voiceVariantIndex + 1}을 배정할 수 없습니다. 같은 음성을 중복 사용하지 않습니다.`,
      },
    }
  }

  const selectionBasis = preferred ? 'preferred-token' : 'variant-index'
  return {
    voice: selected,
    diagnostic: {
      voiceId: preset.id,
      presetName: preset.name,
      expectedGender: preset.gender,
      status: 'ready',
      selectedVoiceName: selected.name,
      selectedVoiceUri: selected.voiceURI,
      inferredGender: inferBrowserVoiceGender(selected),
      selectionBasis,
      koreanCandidateCount: korean.length,
      compatibleCandidateCount: compatible.length,
      reason: selectionBasis === 'preferred-token'
        ? '프리셋 선호 토큰과 성별이 일치하는 음성을 선택했습니다.'
        : `성별 호환 후보 중 프리셋 전용 순번 ${preset.voiceVariantIndex + 1}을 선택했습니다.`,
    },
  }
}

export function diagnoseBrowserSpeechVoices(
  voices: SpeechSynthesisVoice[] = availableBrowserVoices(),
): BrowserVoiceSelectionDiagnostic[] {
  return voicePresets.map((preset) => selectBrowserSpeechVoiceWithEvidence(voices, preset).diagnostic)
}

export function createBrowserSpeechResult(
  request: TtsSynthesisRequest,
  jobId: string,
  fallbackUsed = true,
): TtsSynthesisResult {
  const preset = requireVoicePreset(request.voiceId)
  const voices = availableBrowserVoices()
  const selected = selectBrowserSpeechVoice(voices, request.voiceId)
  if (voices.length > 0 && !selected) {
    throw new Error(
      `${preset.name}(${preset.gender === 'male' ? '남성' : preset.gender === 'female' ? '여성' : '중성'}) 프리셋과 맞는 한국어 시스템 음성을 찾지 못했습니다. `
      + '반대 성별 음성으로 자동 대체하지 않습니다. 전용 CosyVoice WAV를 준비하거나 운영체제에 맞는 한국어 음성을 설치해 주세요.',
    )
  }
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
    message: selected
      ? `${preset.name} 프리셋과 성별이 맞는 기기 내장 한국어 음성(${selected.name})을 선택했습니다. 전용 AI 화자와는 다른 시스템 근사 음성입니다.`
      : '브라우저 음성 목록을 불러오는 중입니다. 재생 시 프리셋 성별을 다시 확인하며 반대 성별 음성은 사용하지 않습니다.',
    normalizedText: request.text,
    segmentCount: 1,
    firstAudioMs: null,
    processingMs: 0,
    fileSizeBytes: null,
    realtimeFactor: 0,
    requestedEngineId: request.engineId ?? 'auto',
    attemptedEngineIds: [BROWSER_SPEECH_ENGINE_ID],
    fallbackUsed,
  }
}

export function createBrowserSpeechPlayback(request: TtsSynthesisRequest): BrowserSpeechPlayback {
  const preset = requireVoicePreset(request.voiceId)
  return {
    text: request.text,
    lang: 'ko-KR',
    rate: Math.min(2, Math.max(0.5, request.speed * preset.rateMultiplier)),
    pitch: Math.min(2, Math.max(0, 1 + (request.pitch + preset.pitchOffset) / 12)),
    voiceId: preset.id,
    expectedGender: preset.gender,
  }
}

export function selectBrowserSpeechVoice(
  voices: SpeechSynthesisVoice[],
  voiceId: string,
): SpeechSynthesisVoice | null {
  const preset = requireVoicePreset(voiceId)
  return selectBrowserSpeechVoiceWithEvidence(voices, preset).voice
}

export function createBrowserSpeechUtterance(
  playback: BrowserSpeechPlayback,
): SpeechSynthesisUtterance {
  const selected = selectBrowserSpeechVoice(window.speechSynthesis.getVoices(), playback.voiceId)
  const preset = requireVoicePreset(playback.voiceId)
  if (!selected) {
    throw new Error(
      `${preset.name} 프리셋과 성별이 맞는 한국어 브라우저 음성이 없습니다. 반대 성별 음성 재생을 차단했습니다.`,
    )
  }
  const utterance = new SpeechSynthesisUtterance(playback.text)
  utterance.lang = playback.lang
  utterance.rate = playback.rate
  utterance.pitch = playback.pitch
  utterance.voice = selected
  return utterance
}
