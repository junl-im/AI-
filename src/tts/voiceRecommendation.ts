import type { VoicePreset } from './voicePresets'

export interface VoiceContextRecommendation {
  voiceId: string
  reason: string
}

function contains(text: string, tokens: string[]): boolean {
  return tokens.some((token) => text.includes(token))
}

export function recommendVoiceForScript(
  source: string,
  voices: VoicePreset[],
): VoiceContextRecommendation | null {
  const text = source.trim().toLowerCase()
  if (!text || voices.length === 0) return null

  const byId = (id: string, reason: string) => (
    voices.some((voice) => voice.id === id) ? { voiceId: id, reason } : null
  )

  if (contains(text, ['할인', '이벤트', '구매', '구독', '지금 바로', '놓치지', '프로모션', '광고'])) {
    return byId('min-energetic', '민준 · 빠른 숏폼: 쉼을 줄이고 초반 에너지를 높이는 CTA형 리듬을 추천합니다.')
  }
  if (contains(text, ['방법', '단계', '설명', '강의', '교육', '튜토리얼', '안내', '사용법', '정리하면'])) {
    return byId('on-clear', '도윤 · 또렷한 설명: 짧은 쉼과 선명한 문장 종결이 있는 설명형 리듬을 추천합니다.')
  }
  if (contains(text, ['역사', '사건', '기록', '다큐', '탐사', '보고서', '뉴스', '사실은'])) {
    return byId('jun-deep', '준호 · 묵직한 다큐: 낮고 단단하지만 늘어지지 않는 다큐형 리듬을 추천합니다.')
  }
  if (text.length >= 520 || contains(text, ['오디오북', '명상', '이야기', '소설', '낭독'])) {
    return byId('dam-calm', '소리 · 편안한 장문: 긴 문장을 안정적으로 이어가되 느려지지 않는 내레이션형 리듬을 추천합니다.')
  }
  if (contains(text, ['오늘', '여러분', '같이', '브이로그', '일상', '해볼게', '소개해'])) {
    return byId('sori-warm', '혜린 · 따뜻한 대화: 짧은 호흡과 부드러운 종결이 있는 일상 대화형 리듬을 추천합니다.')
  }
  return byId('sori-warm', '혜린 · 따뜻한 대화: 자연스러운 기본 페이스와 친근한 문장 연결을 추천합니다.')
}

export function clampVoiceSettingsToNaturalRange(
  voice: VoicePreset,
  speed: number,
  pitch: number,
): { speed: number; pitch: number } {
  return {
    speed: Math.min(voice.naturalSpeedRange[1], Math.max(voice.naturalSpeedRange[0], speed)),
    pitch: Math.min(voice.naturalPitchRange[1], Math.max(voice.naturalPitchRange[0], pitch)),
  }
}
