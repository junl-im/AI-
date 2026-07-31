export interface VoicePreset {
  id: string
  name: string
  shortName: string
  description: string
  tone: string
  badge: string
}

export const voicePresets: VoicePreset[] = [
  {
    id: 'sori-warm',
    name: '소리 · 따뜻함',
    shortName: '소리',
    description: '일상 대화와 안내에 자연스러운 따뜻한 목소리',
    tone: 'bg-[#ffe5dc]',
    badge: '추천',
  },
  {
    id: 'on-clear',
    name: '온 · 또렷함',
    shortName: '온',
    description: '교육, 뉴스, 설명 영상에 어울리는 명료한 목소리',
    tone: 'bg-[#dff5ff]',
    badge: '또렷함',
  },
  {
    id: 'dam-calm',
    name: '담 · 차분함',
    shortName: '담',
    description: '오디오북과 긴 문장에 편안한 낮은 에너지',
    tone: 'bg-[#ebe5ff]',
    badge: '차분함',
  },
]

export function getVoicePreset(voiceId: string): VoicePreset {
  return voicePresets.find((voice) => voice.id === voiceId) ?? voicePresets[0]
}
