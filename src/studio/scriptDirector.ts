import { recommendVoiceForScript } from '../tts/voiceRecommendation'
import { voicePresets } from '../tts/voicePresets'

export function analyzeScriptForStudio(source: string) {
  const text = source.trim()
  const sentences = text.split(/(?<=[.!?。！？])\s+/).filter(Boolean)
  const longSentences = sentences.filter((sentence) => sentence.length > 140).length
  const dense = /\d|[A-Za-z]|[()（）]/.test(text)
  return {
    recommendation: recommendVoiceForScript(text, voicePresets),
    notes: [
      ...(longSentences ? ['긴 문장 ' + longSentences + '개 · 문장 경계와 호흡을 먼저 들어보세요.'] : []),
      ...(dense ? ['숫자·영문·괄호가 있어요. 첫 문장으로 발음을 확인해 보세요.'] : []),
      ...(text.length > 500 ? ['긴 대본은 첫 구간을 들어본 뒤 전체 생성하면 수정 시간을 줄일 수 있어요.'] : []),
    ],
  }
}
