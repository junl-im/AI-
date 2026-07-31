export interface EngineSummary {
  id: string
  name: string
  kind: 'tts' | 'stt' | 'voiceclone' | 'translation'
  languages: string[]
  ready: boolean
}
