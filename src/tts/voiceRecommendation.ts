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
    return byId('min-energetic', '광고·행동 유도 표현이 있어 짧고 선명한 활력 톤을 추천합니다.')
  }
  if (contains(text, ['방법', '단계', '설명', '강의', '교육', '튜토리얼', '안내', '사용법', '정리하면'])) {
    return byId('on-clear', '설명·교육 문장이 많아 또렷한 정보 전달형 목소리를 추천합니다.')
  }
  if (contains(text, ['역사', '사건', '기록', '다큐', '탐사', '보고서', '뉴스', '사실은'])) {
    return byId('jun-deep', '사실 전달과 무게감 있는 내레이션에 어울리는 저음 톤을 추천합니다.')
  }
  if (text.length >= 520 || contains(text, ['오디오북', '명상', '이야기', '소설', '낭독'])) {
    return byId('dam-calm', '긴 호흡으로 듣는 대본이라 피로가 적은 장문형 목소리를 추천합니다.')
  }
  if (contains(text, ['오늘', '여러분', '같이', '브이로그', '일상', '해볼게', '소개해'])) {
    return byId('sori-warm', '대화형·일상형 문장이 많아 친근하고 부드러운 톤을 추천합니다.')
  }
  return byId('sori-warm', '일반 대화와 소개 문장에 무난한 자연스러운 기본 톤입니다.')
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
