export type VoiceGender = 'female' | 'male' | 'neutral'
export type VoiceCadence = 'conversation' | 'explainer' | 'narrative' | 'documentary' | 'shortform'

export interface VoicePreset {
  id: string
  name: string
  shortName: string
  description: string
  personaLabel: string
  personaSummary: string
  cadence: VoiceCadence
  paceLabel: string
  tone: string
  badge: string
  gender: VoiceGender
  tags: [string, string, string]
  rhythmTags: [string, string, string]
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
    description: '브이로그와 일상 콘텐츠에 자연스러운 따뜻한 여성 목소리',
    personaLabel: '따뜻한 대화',
    personaSummary: '친근하고 밝게, 문장 사이를 짧게 이어 말하는 일상형 보이스',
    cadence: 'conversation',
    paceLabel: '자연스러운 빠르기 · +6%',
    tone: 'bg-[#ffe5dc]',
    badge: '추천',
    gender: 'female',
    tags: ['친근함', '여성', '한국어'],
    rhythmTags: ['짧은 호흡', '부드러운 종결', '대화형'],
    rateMultiplier: 1.06,
    pitchOffset: 0.35,
    voiceVariantIndex: 0,
    requiresDedicatedReference: true,
    preferredVoiceTokens: ['sunhi', 'yuna', 'heami', 'seoyeon', 'korean a'],
    bestFor: ['브이로그', '일상 대화', '감성 소개'],
    strengths: ['부드러운 친근감', '짧은 문장 연결이 자연스러움'],
    tradeoffs: ['강한 권위감은 약함', '빠른 광고톤에는 힘이 부족할 수 있음'],
    naturalSpeedRange: [1.0, 1.18],
    naturalPitchRange: [-1, 1.5],
  },
  {
    id: 'on-clear',
    name: '도윤',
    shortName: '도',
    description: '교육과 설명 영상에 어울리는 또렷한 남성 목소리',
    personaLabel: '또렷한 설명',
    personaSummary: '정보를 빠르고 정확하게 끊어 읽는 교육·튜토리얼형 보이스',
    cadence: 'explainer',
    paceLabel: '또렷하고 빠르게 · +11%',
    tone: 'bg-[#dff5ff]',
    badge: '또렷함',
    gender: 'male',
    tags: ['명료함', '남성', '한국어'],
    rhythmTags: ['짧은 쉼', '강한 자음', '설명형'],
    rateMultiplier: 1.11,
    pitchOffset: -0.65,
    voiceVariantIndex: 0,
    requiresDedicatedReference: true,
    preferredVoiceTokens: ['injoon', 'hyunsu', 'korean b'],
    bestFor: ['교육', '튜토리얼', '정보 전달'],
    strengths: ['자음 전달이 또렷함', '단계 설명과 숫자 읽기에 안정적'],
    tradeoffs: ['감성 연기 폭은 좁음', '긴 서정 문장에서는 다소 단정하게 들릴 수 있음'],
    naturalSpeedRange: [1.03, 1.23],
    naturalPitchRange: [-2, 0.5],
  },
  {
    id: 'dam-calm',
    name: '소리',
    shortName: '소',
    description: '오디오북과 긴 문장에 편안한 중성 목소리',
    personaLabel: '편안한 장문',
    personaSummary: '느려지지 않으면서 호흡이 안정적인 오디오북·장문형 보이스',
    cadence: 'narrative',
    paceLabel: '편안하지만 답답하지 않게 · +4%',
    tone: 'bg-[#ebe5ff]',
    badge: '장문',
    gender: 'neutral',
    tags: ['편안함', '중성', '한국어'],
    rhythmTags: ['균형 호흡', '긴 문장', '내레이션'],
    rateMultiplier: 1.04,
    pitchOffset: -0.1,
    voiceVariantIndex: 0,
    requiresDedicatedReference: true,
    preferredVoiceTokens: ['jimin', 'natural', 'neutral', '중성', 'korean c'],
    bestFor: ['오디오북', '장문 내레이션', '명상·잔잔한 콘텐츠'],
    strengths: ['오래 들어도 피로가 적음', '문장 사이 호흡이 안정적'],
    tradeoffs: ['강한 세일즈 표현은 약함', '짧고 강한 숏폼에는 임팩트가 덜할 수 있음'],
    naturalSpeedRange: [1.0, 1.16],
    naturalPitchRange: [-1, 1],
  },
  {
    id: 'jun-deep',
    name: '준호',
    shortName: '준',
    description: '다큐멘터리와 오디오북에 안정적인 낮은 남성 목소리',
    personaLabel: '묵직한 다큐',
    personaSummary: '낮고 단단하지만 늘어지지 않는 다큐멘터리·사건 내레이션형 보이스',
    cadence: 'documentary',
    paceLabel: '묵직하지만 선명하게 · +5%',
    tone: 'bg-[#dbe8ff]',
    badge: '저음',
    gender: 'male',
    tags: ['저음', '남성', '한국어'],
    rhythmTags: ['단단한 종결', '중간 호흡', '다큐형'],
    rateMultiplier: 1.05,
    pitchOffset: -1.2,
    voiceVariantIndex: 1,
    requiresDedicatedReference: true,
    preferredVoiceTokens: ['minsu', 'bongjin', 'yong', 'deep', 'baritone', 'korean d'],
    bestFor: ['다큐멘터리', '역사·사건', '무게감 있는 내레이션'],
    strengths: ['저음의 안정감', '긴 호흡에서 신뢰감을 유지'],
    tradeoffs: ['밝은 캐릭터 표현은 제한적', '속도를 과하게 올리면 무게감이 쉽게 깨짐'],
    naturalSpeedRange: [1.0, 1.16],
    naturalPitchRange: [-3, 0],
  },
  {
    id: 'min-energetic',
    name: '민준',
    shortName: '민',
    description: '광고와 숏폼에 생동감 있는 젊은 남성 목소리',
    personaLabel: '빠른 숏폼',
    personaSummary: '쉼을 짧게 가져가며 초반부터 에너지를 올리는 광고·숏폼형 보이스',
    cadence: 'shortform',
    paceLabel: '경쾌하고 빠르게 · +14%',
    tone: 'bg-[#e2f7e7]',
    badge: '활력',
    gender: 'male',
    tags: ['활기', '남성', '한국어'],
    rhythmTags: ['최소 쉼', '빠른 전개', 'CTA형'],
    rateMultiplier: 1.14,
    pitchOffset: 0.45,
    voiceVariantIndex: 2,
    requiresDedicatedReference: true,
    preferredVoiceTokens: ['young male', 'energetic', 'youngho', 'korean e'],
    bestFor: ['광고', '숏폼', '프로모션·CTA'],
    strengths: ['초반 주목도가 높음', '짧은 문장과 강조 표현에 강함'],
    tradeoffs: ['장문에서는 피로감이 생길 수 있음', '차분한 설명 콘텐츠에는 다소 과할 수 있음'],
    naturalSpeedRange: [1.08, 1.25],
    naturalPitchRange: [-0.5, 2],
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
