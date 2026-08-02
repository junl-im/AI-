export interface VoicePreset {
  id: string
  name: string
  shortName: string
  description: string
  tone: string
  badge: string
  tags: [string, string, string]
  rateMultiplier: number
  pitchOffset: number
  preferredVoiceTokens: string[]
}

export const voicePresets: VoicePreset[] = [
  {
    id: 'sori-warm',
    name: '혜린',
    shortName: '혜',
    description: '브이로그와 일상 콘텐츠에 자연스러운 따뜻한 목소리',
    tone: 'bg-[#ffe5dc]',
    badge: '추천',
    tags: ['차분', '여성', '한국어'],
    rateMultiplier: 0.96,
    pitchOffset: 1.5,
    preferredVoiceTokens: ['sunhi', 'yuna', 'heami', 'seoyeon', 'female', '여성', 'korean a'],
  },
  {
    id: 'on-clear',
    name: '도윤',
    shortName: '도',
    description: '교육과 설명 영상에 어울리는 또렷한 목소리',
    tone: 'bg-[#dff5ff]',
    badge: '또렷함',
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
    tags: ['따뜻', '중성', '한국어'],
    rateMultiplier: 0.9,
    pitchOffset: -0.5,
    preferredVoiceTokens: ['sora', 'jimin', 'natural', 'korean c'],
  },
]

export function getVoicePreset(voiceId: string): VoicePreset {
  return voicePresets.find((voice) => voice.id === voiceId) ?? voicePresets[0]
}
