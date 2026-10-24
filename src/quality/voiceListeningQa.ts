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
    const latest = new Map<string, VoiceListeningQaEntry>()
    for (const entry of entries) {
      if (entry.voiceId !== preset.id || !voiceListeningScenarios.some((scenario) => scenario.id === entry.scenarioId)) continue
      const previous = latest.get(entry.scenarioId)
      if (!previous || entry.updatedAt >= previous.updatedAt) latest.set(entry.scenarioId, entry)
    }
    const voiceEntries = [...latest.values()]
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
        && voiceEntries.every((entry) => normalizeListeningScores(entry.scores).naturalPace >= 4)
        && (longformFatigueScore ?? 0) >= 4,
      issues,
    }
  })
}

export const pronunciationStressSamples = [
  { label: "별하 · 운세 결과", text: "오늘의 운세 결과를 전해 드릴게요. 오래 기다린 소식이 조용히 다가오고 있습니다. 서두르지 말고, 마음이 향하는 쪽을 차분히 살펴보세요. 작은 행운이 당신의 하루를 밝힐 거예요." },
  { label: "숫자·단위", text: "2026년 10월 12일 오전 9시 30분, 참가자는 12명입니다. 할인율은 3.5%, 가격은 12,500원입니다." },
  { label: "영문·괄호·인용", text: "API(에이피아이) 연결을 확인한 뒤, 담당자는 ‘준비가 되면 시작하세요.’라고 말했습니다. SoriON의 새 이야기가 시작됩니다." },
  { label: "긴 호흡", text: "새로운 일을 시작할 때에는 결과를 서두르기보다 지금 할 수 있는 작은 일을 하나씩 고르고, 중간에 생각이 바뀌더라도 잠시 쉬면서 다음 문장을 준비하는 편이 좋습니다. 조용한 호흡 뒤에 이야기를 이어갑니다." },
]
