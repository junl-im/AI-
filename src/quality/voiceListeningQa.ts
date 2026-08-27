import { getVoicePreset, voicePresets } from '../tts/voicePresets'

export const VOICE_LISTENING_QA_SCHEMA = 'sorion.voice-listening-qa.v1' as const

export type VoiceListeningScenarioId = 'conversation' | 'explainer' | 'longform' | 'documentary' | 'shortform'
export type VoiceListeningDimension = 'softness' | 'naturalPace' | 'distinctiveness' | 'articulation' | 'breathing' | 'lowFatigue'

export interface VoiceListeningScenario {
  id: VoiceListeningScenarioId
  label: string
  sampleText: string
  purpose: string
}

export interface VoiceListeningScores {
  softness: number
  naturalPace: number
  distinctiveness: number
  articulation: number
  breathing: number
  lowFatigue: number
}

export interface VoiceListeningQaEntry {
  id: string
  schemaVersion: typeof VOICE_LISTENING_QA_SCHEMA
  voiceId: string
  scenarioId: VoiceListeningScenarioId
  scores: VoiceListeningScores
  note: string
  createdAt: string
  updatedAt: string
}

export interface VoiceListeningVoiceSummary {
  voiceId: string
  voiceName: string
  scenarioCount: number
  requiredScenarioCount: number
  averageScore: number
  minimumScore: number
  longformFatigueScore: number | null
  ready: boolean
  issues: string[]
}

export const voiceListeningScenarios: VoiceListeningScenario[] = [
  {
    id: 'conversation',
    label: '일상 대화',
    sampleText: '오늘은 날씨가 좋아서 조금 천천히 걸어도 괜찮을 것 같아요. 준비되면 같이 출발해요.',
    purpose: '부드러운 연결, 자연스러운 종결, 과장 없는 말하기를 확인합니다.',
  },
  {
    id: 'explainer',
    label: '설명·정보',
    sampleText: '설정 화면에서 음성 속도를 선택한 뒤 미리듣기를 눌러 실제 재생 결과를 확인합니다.',
    purpose: '자음 명료도, 숫자·정보 전달력, 지나치게 딱딱하지 않은 속도를 확인합니다.',
  },
  {
    id: 'longform',
    label: '장문·오디오북',
    sampleText: '한 문장이 길어져도 호흡이 급해지지 않아야 하고, 다음 문장으로 넘어갈 때에는 듣는 사람이 피곤하지 않을 만큼 자연스럽게 쉬어야 합니다.',
    purpose: '장문 호흡, 리듬 안정성, 청취 피로도를 가장 엄격하게 확인합니다.',
  },
  {
    id: 'documentary',
    label: '다큐·사건',
    sampleText: '기록에 따르면 변화는 아주 작은 징후에서 시작됐지만, 그 순간에는 누구도 이후의 결과를 예상하지 못했습니다.',
    purpose: '무게감, 종결 안정성, 감정을 과장하지 않는 신뢰감을 확인합니다.',
  },
  {
    id: 'shortform',
    label: '광고·숏폼',
    sampleText: '지금 바로 핵심만 확인하세요. 짧고 또렷하게, 필요한 정보만 빠르게 전달합니다.',
    purpose: '초반 주목도와 활력을 보되, AI처럼 급하게 읽거나 숨이 차지 않는지 확인합니다.',
  },
]

export const voiceListeningDimensionLabels: Record<VoiceListeningDimension, string> = {
  softness: '부드러움',
  naturalPace: '현실 속도',
  distinctiveness: '성우 개성',
  articulation: '발음 명료도',
  breathing: '호흡·쉼',
  lowFatigue: '낮은 피로도',
}

export function clampListeningScore(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(5, Math.max(1, Math.round(value)))
}

export function normalizeListeningScores(scores: VoiceListeningScores): VoiceListeningScores {
  return Object.fromEntries(
    Object.entries(scores).map(([key, value]) => [key, clampListeningScore(value)]),
  ) as unknown as VoiceListeningScores
}

export function scoreVoiceListeningEntry(entry: VoiceListeningQaEntry): number {
  const scores = normalizeListeningScores(entry.scores)
  const values = Object.values(scores)
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function summarizeVoiceListeningQa(entries: VoiceListeningQaEntry[]): VoiceListeningVoiceSummary[] {
  return voicePresets.map((preset) => {
    const voiceEntries = entries.filter((entry) => entry.voiceId === preset.id)
    const scenarioIds = new Set(voiceEntries.map((entry) => entry.scenarioId))
    const entryScores = voiceEntries.map(scoreVoiceListeningEntry)
    const allDimensionScores = voiceEntries.flatMap((entry) => Object.values(normalizeListeningScores(entry.scores)))
    const longform = voiceEntries.find((entry) => entry.scenarioId === 'longform')
    const averageScore = entryScores.length ? entryScores.reduce((sum, value) => sum + value, 0) / entryScores.length : 0
    const minimumScore = allDimensionScores.length ? Math.min(...allDimensionScores) : 0
    const longformFatigueScore = longform ? normalizeListeningScores(longform.scores).lowFatigue : null
    const issues: string[] = []
    if (scenarioIds.size < voiceListeningScenarios.length) issues.push(`청취 시나리오 ${scenarioIds.size}/${voiceListeningScenarios.length}`)
    if (averageScore < 4) issues.push('평균 청취 점수 4.0 미만')
    if (minimumScore > 0 && minimumScore < 3) issues.push('2점 이하 품질 항목 존재')
    if (longformFatigueScore !== null && longformFatigueScore < 4) issues.push('장문 피로도 기준 미달')
    if (voiceEntries.length && voiceEntries.some((entry) => normalizeListeningScores(entry.scores).naturalPace < 4)) {
      issues.push('현실 속도 재조정 필요')
    }
    return {
      voiceId: preset.id,
      voiceName: getVoicePreset(preset.id).name,
      scenarioCount: scenarioIds.size,
      requiredScenarioCount: voiceListeningScenarios.length,
      averageScore,
      minimumScore,
      longformFatigueScore,
      ready: scenarioIds.size === voiceListeningScenarios.length
        && averageScore >= 4
        && minimumScore >= 3
        && (longformFatigueScore ?? 0) >= 4,
      issues,
    }
  })
}
