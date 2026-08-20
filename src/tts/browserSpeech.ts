import type { EngineInfo, TtsSynthesisRequest, TtsSynthesisResult } from '../ai/contracts'
import {
  requireVoicePreset,
  voicePresets,
  type VoiceCadence,
  type VoiceGender,
  type VoicePreset,
} from './voicePresets'

export const BROWSER_SPEECH_ENGINE_ID = 'browser-speech'

const BROWSER_USER_PITCH_SCALE = 0.3
const BROWSER_PITCH_MIN = 0.92
const BROWSER_PITCH_MAX = 1.08

export interface BrowserSpeechProsodyDiagnostic {
  voiceId: string
  presetName: string
  requestedSpeed: number
  effectiveRate: number
  requestedPitch: number
  presetPitchOffset: number
  effectivePitchSemitones: number
  webSpeechPitch: number
  cadence: VoiceCadence
  personaLabel: string
  policy: 'characterized-korean-system'
}

export interface BrowserSpeechPlayback {
  text: string
  lang: string
  rate: number
  pitch: number
  voiceId: string
  expectedGender?: VoiceGender
  cadence?: VoiceCadence
  personaLabel?: string
}

export interface BrowserVoiceSelectionDiagnostic {
  voiceId: string
  presetName: string
  expectedGender: VoiceGender
  status: 'ready' | 'missing'
  selectedVoiceName: string | null
  selectedVoiceUri: string | null
  inferredGender: VoiceGender | 'unknown' | null
  selectionBasis: 'preferred-token' | 'variant-index' | 'compatible-cycle' | 'none'
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

function cleanSpeechWhitespace(text: string): string {
  return text
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\.{3,}/g, '…')
    .replace(/…{2,}/g, '…')
    .trim()
}

function joinSpeechLines(text: string, separator: ', ' | '. '): string {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index, lines) => {
      if (index === lines.length - 1 || /[.!?。！？…]$/.test(line)) return line
      return `${line}${separator.trimEnd()}`
    })
    .join(' ')
    .replace(/\s{2,}/g, ' ')
}

export function prepareBrowserSpeechText(text: string, voiceId: string): string {
  const preset = requireVoicePreset(voiceId)
  const normalized = cleanSpeechWhitespace(text)
  if (!normalized) return normalized

  switch (preset.cadence) {
    case 'conversation':
      return joinSpeechLines(normalized, ', ')
    case 'explainer':
      return joinSpeechLines(normalized.replace(/\s*…\s*/g, '. '), '. ')
    case 'narrative':
      return joinSpeechLines(normalized, '. ')
    case 'documentary':
      return joinSpeechLines(normalized, '. ')
    case 'shortform':
      return joinSpeechLines(normalized.replace(/\s*…\s*/g, ', '), ', ')
  }
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
    reason: '기기에 설치된 한국어 음성을 쓰는 빠른 근사 미리듣기입니다. 성우별 pace·문장 리듬을 적용하고 pitch 변조는 제한하며 전용 neural 성우 음색과 동일하지 않습니다.',
    autoEligible: true,
    recommended: false,
    health: 'ready',
    successCount: 0,
    failureCount: 0,
    consecutiveFailures: 0,
    cooldownRemainingSeconds: 0,
    lastError: null,
    selectionPenalty: 0,
    degradedRemainingSeconds: 0,
    selectionReason: null,
    activeRequestCount: 0,
    performanceSampleCount: 0,
    performanceMinSamples: 0,
    performanceWindowSeconds: 0,
    performanceWindowRemainingSeconds: 0,
    performanceObservationStatus: 'disabled',
    performanceObservationStartedAt: null,
    performanceLastSampleAt: null,
    performanceLatencyEwmaMs: null,
    performanceReliabilityEwma: null,
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
  const exactVariant = compatible[preset.voiceVariantIndex] ?? null
  const selected = preferred ?? exactVariant ?? compatible[preset.voiceVariantIndex % compatible.length]
  const selectionBasis = preferred
    ? 'preferred-token'
    : exactVariant
      ? 'variant-index'
      : 'compatible-cycle'
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
        : selectionBasis === 'variant-index'
          ? `성별 호환 후보 중 프리셋 전용 순번 ${preset.voiceVariantIndex + 1}을 선택했습니다.`
          : '설치된 같은 성별 한국어 음성이 제한적이어서 해당 음성을 프리셋 속도·높낮이 설정과 함께 재사용합니다.',
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
  const playback = createBrowserSpeechPlayback(request)
  return {
    jobId,
    status: 'completed',
    engineId: BROWSER_SPEECH_ENGINE_ID,
    engineMode: 'browser',
    audioUrl: null,
    estimatedDurationSeconds: estimateBrowserSpeechDuration(playback.text, playback.rate),
    message: selected
      ? `${preset.name} · ${preset.personaLabel} 프로필로 기기 내장 한국어 음성(${selected.name})을 재생합니다. 성우별 pace·문장 리듬과 제한된 pitch를 적용한 근사 음성이며 전용 neural 성우와는 다릅니다.`
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

export function diagnoseBrowserSpeechProsody(
  request: TtsSynthesisRequest,
): BrowserSpeechProsodyDiagnostic {
  const preset = requireVoicePreset(request.voiceId)
  const effectiveRate = Math.min(2, Math.max(0.5, request.speed * preset.rateMultiplier))
  const effectivePitchSemitones = request.pitch * BROWSER_USER_PITCH_SCALE + preset.pitchOffset
  const pitchRatio = 2 ** (effectivePitchSemitones / 12)
  const webSpeechPitch = Math.min(BROWSER_PITCH_MAX, Math.max(BROWSER_PITCH_MIN, pitchRatio))
  return {
    voiceId: preset.id,
    presetName: preset.name,
    requestedSpeed: request.speed,
    effectiveRate,
    requestedPitch: request.pitch,
    presetPitchOffset: preset.pitchOffset,
    effectivePitchSemitones,
    webSpeechPitch,
    cadence: preset.cadence,
    personaLabel: preset.personaLabel,
    policy: 'characterized-korean-system',
  }
}

export function createBrowserSpeechPlayback(request: TtsSynthesisRequest): BrowserSpeechPlayback {
  const preset = requireVoicePreset(request.voiceId)
  const prosody = diagnoseBrowserSpeechProsody(request)
  return {
    text: prepareBrowserSpeechText(request.text, preset.id),
    lang: 'ko-KR',
    rate: prosody.effectiveRate,
    pitch: prosody.webSpeechPitch,
    voiceId: preset.id,
    expectedGender: preset.gender,
    cadence: preset.cadence,
    personaLabel: preset.personaLabel,
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
