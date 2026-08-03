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
  preferredVoiceTokens: string[]
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
    description: '브이로그와 일상 콘텐츠에 자연스러운 따뜻한 목소리',
    tone: 'bg-[#ffe5dc]',
    badge: '추천',
    gender: 'female',
    tags: ['차분', '여성', '한국어'],
    rateMultiplier: 0.96,
    pitchOffset: 1.5,
    preferredVoiceTokens: ['sunhi', 'yuna', 'heami', 'seoyeon', 'female', '여성', 'korean a'],
  },
  {
    id: 'on-clear',
    name: '도윤',
    shortName: '도',
    description: '교육과 설명 영상에 어울리는 또렷한 남성 목소리',
    tone: 'bg-[#dff5ff]',
    badge: '또렷함',
    gender: 'male',
    tags: ['명료', '남성', '한국어'],
    rateMultiplier: 1.04,
    pitchOffset: -1.5,
    preferredVoiceTokens: ['injoon', 'hyunsu', 'male', '남성', 'korean b'],
  },
  {
    id: 'dam-calm',
    name: '소리',
    shortName: '소',
    description: '오디오북과 긴 문장에 편안한 낮은 에너지',
    tone: 'bg-[#ebe5ff]',
    badge: '차분함',
    gender: 'neutral',
    tags: ['따뜻', '중성', '한국어'],
    rateMultiplier: 0.9,
    pitchOffset: -0.5,
    preferredVoiceTokens: ['sora', 'jimin', 'natural', 'korean c'],
  },
  {
    id: 'jun-deep',
    name: '준호',
    shortName: '준',
    description: '다큐멘터리와 오디오북에 안정적인 낮은 남성 목소리',
    tone: 'bg-[#dbe8ff]',
    badge: '저음',
    gender: 'male',
    tags: ['저음', '남성', '한국어'],
    rateMultiplier: 0.92,
    pitchOffset: -2.5,
    preferredVoiceTokens: ['minsu', 'bongjin', 'deep', 'baritone', 'male', '남성', 'korean d'],
  },
  {
    id: 'min-energetic',
    name: '민준',
    shortName: '민',
    description: '광고와 숏폼에 생동감 있는 젊은 남성 목소리',
    tone: 'bg-[#e2f7e7]',
    badge: '활력',
    gender: 'male',
    tags: ['활기', '남성', '한국어'],
    rateMultiplier: 1.08,
    pitchOffset: -0.5,
    preferredVoiceTokens: ['young male', 'energetic', 'male', '남성', 'korean e'],
  },
]

export function getVoicePreset(voiceId: string): VoicePreset {
  return voicePresets.find((voice) => voice.id === voiceId) ?? voicePresets[0]
}

export function filterVoicePresets(gender: VoiceGender | 'all'): VoicePreset[] {
  return gender === 'all'
    ? voicePresets
    : voicePresets.filter((voice) => voice.gender === gender)
}
