export type VoiceGender = 'female' | 'male' | 'neutral'

export interface VoicePreset {
  id: string
  name: string
  shortName: string
  description: string
  tone: string
  badge: string
  gender: VoiceGender
  tags: [string, string, string]
  rateMultiplier: number
  pitchOffset: number
  voiceVariantIndex: number
  requiresDedicatedReference: boolean
  preferredVoiceTokens: string[]
  bestFor: [string, string, string]
  strengths: [string, string]
  tradeoffs: [string, string]
  naturalSpeedRange: [number, number]
  naturalPitchRange: [number, number]
}

export const voiceGenderLabels: Record<VoiceGender, string> = {
  female: '여성',
  male: '남성',
  neutral: '중성',
}

export const voicePresets: VoicePreset[] = [
  {
    id: 'sori-warm',
    name: '혜린',
    shortName: '혜',
    description: '따뜻하고 자연스러운 여성 톤',
    tone: 'bg-[#ffe5dc]',
    badge: '추천',
    gender: 'female',
    tags: ['차분', '여성', '한국어'],
    rateMultiplier: 0.96,
    pitchOffset: 1.5,
    voiceVariantIndex: 0,
    requiresDedicatedReference: true,
    preferredVoiceTokens: ['sunhi', 'yuna', 'heami', 'seoyeon', 'korean a'],
    bestFor: ['브이로그', '일상 대화', '감성 소개'],
    strengths: ['부드러운 친근감', '짧은 문장 연결이 자연스러움'],
    tradeoffs: ['강한 권위감은 약함', '빠른 광고톤에는 힘이 부족할 수 있음'],
    naturalSpeedRange: [0.88, 1.08],
    naturalPitchRange: [-1, 3],
  },
  {
    id: 'on-clear',
    name: '도윤',
    shortName: '도',
    description: '또렷하고 안정적인 남성 톤',
    tone: 'bg-[#dff5ff]',
    badge: '또렷함',
    gender: 'male',
    tags: ['명료', '남성', '한국어'],
    rateMultiplier: 1.04,
    pitchOffset: -1.5,
    voiceVariantIndex: 0,
    requiresDedicatedReference: true,
    preferredVoiceTokens: ['injoon', 'hyunsu', 'korean b'],
    bestFor: ['교육', '튜토리얼', '정보 전달'],
    strengths: ['자음 전달이 또렷함', '단계 설명과 숫자 읽기에 안정적'],
    tradeoffs: ['감성 연기 폭은 좁음', '긴 서정 문장에서는 다소 단정하게 들릴 수 있음'],
    naturalSpeedRange: [0.94, 1.12],
    naturalPitchRange: [-3, 1],
  },
  {
    id: 'dam-calm',
    name: '소리',
    shortName: '소',
    description: '편안하고 차분한 중성 톤',
    tone: 'bg-[#ebe5ff]',
    badge: '차분함',
    gender: 'neutral',
    tags: ['따뜻', '중성', '한국어'],
    rateMultiplier: 0.9,
    pitchOffset: -0.5,
    voiceVariantIndex: 0,
    requiresDedicatedReference: true,
    preferredVoiceTokens: ['jimin', 'natural', 'neutral', '중성', 'korean c'],
    bestFor: ['오디오북', '장문 내레이션', '명상·잔잔한 콘텐츠'],
    strengths: ['오래 들어도 피로가 적음', '문장 사이 호흡이 안정적'],
    tradeoffs: ['강한 세일즈 표현은 약함', '짧고 강한 숏폼에는 임팩트가 덜할 수 있음'],
    naturalSpeedRange: [0.82, 1.02],
    naturalPitchRange: [-2, 2],
  },
  {
    id: 'jun-deep',
    name: '준호',
    shortName: '준',
    description: '낮고 묵직한 남성 톤',
    tone: 'bg-[#dbe8ff]',
    badge: '저음',
    gender: 'male',
    tags: ['저음', '남성', '한국어'],
    rateMultiplier: 0.92,
    pitchOffset: -2.5,
    voiceVariantIndex: 1,
    requiresDedicatedReference: true,
    preferredVoiceTokens: ['minsu', 'bongjin', 'yong', 'deep', 'baritone', 'korean d'],
    bestFor: ['다큐멘터리', '역사·사건', '무게감 있는 내레이션'],
    strengths: ['저음의 안정감', '긴 호흡에서 신뢰감을 유지'],
    tradeoffs: ['밝은 캐릭터 표현은 제한적', '속도를 과하게 올리면 무게감이 쉽게 깨짐'],
    naturalSpeedRange: [0.84, 1.0],
    naturalPitchRange: [-4, 0],
  },
  {
    id: 'min-energetic',
    name: '민준',
    shortName: '민',
    description: '밝고 생동감 있는 남성 톤',
    tone: 'bg-[#e2f7e7]',
    badge: '활력',
    gender: 'male',
    tags: ['활기', '남성', '한국어'],
    rateMultiplier: 1.08,
    pitchOffset: -0.5,
    voiceVariantIndex: 2,
    requiresDedicatedReference: true,
    preferredVoiceTokens: ['young male', 'energetic', 'youngho', 'korean e'],
    bestFor: ['광고', '숏폼', '프로모션·CTA'],
    strengths: ['초반 주목도가 높음', '짧은 문장과 강조 표현에 강함'],
    tradeoffs: ['장문에서는 피로감이 생길 수 있음', '차분한 설명 콘텐츠에는 다소 과할 수 있음'],
    naturalSpeedRange: [0.98, 1.18],
    naturalPitchRange: [-2, 2],
  },
]

export function getVoicePreset(voiceId: string): VoicePreset {
  return voicePresets.find((voice) => voice.id === voiceId) ?? voicePresets[0]
}

export function requireVoicePreset(voiceId: string): VoicePreset {
  const preset = voicePresets.find((voice) => voice.id === voiceId)
  if (!preset) throw new Error(`지원하지 않는 음성 프리셋입니다: ${voiceId}`)
  return preset
}

export function isVoicePresetId(voiceId: string): boolean {
  return voicePresets.some((voice) => voice.id === voiceId)
}

export function filterVoicePresets(gender: VoiceGender | 'all'): VoicePreset[] {
  return gender === 'all'
    ? voicePresets
    : voicePresets.filter((voice) => voice.gender === gender)
}
