import type { VoiceEmotion } from '../ai/contracts'
import type { ComposerDirective } from './workspaceTypes'

export interface InterpretedPrompt {
  spokenText: string
  displayText: string
  emotion: VoiceEmotion
  speed: number
  normalizeText: boolean
  draftMode: 'direct' | 'local-draft'
}

function topicFromPrompt(value: string): string {
  const cleaned = value
    .replace(/\d+\s*초/g, '')
    .replace(/(밝은|차분한|광고|따뜻한)\s*톤으로/g, '')
    .replace(/(대본|스크립트).*/g, '')
    .replace(/만들어\s*줘/g, '')
    .trim()
  return cleaned || '오늘의 이야기'
}

function localDraft(value: string): string {
  const topic = topicFromPrompt(value)
  return [
    `${topic}를 시작합니다.`,
    '지금 이 순간의 분위기와 가장 기억하고 싶은 장면을 함께 만나보세요.',
    '짧지만 또렷한 목소리로 오늘의 이야기를 전해드릴게요.',
  ].join(' ')
}

export function interpretComposerPrompt(
  value: string,
  directives: ComposerDirective[],
): InterpretedPrompt {
  const trimmed = value.trim()
  const wantsDraft = /(대본|스크립트).*(만들|작성)|브이로그.*(대본|스크립트)/.test(trimmed)
  const commercial = directives.some((directive) => directive.id === 'commercial')
  const bright = directives.some((directive) => directive.id === 'bright')
  const slow = directives.some((directive) => directive.id === 'slow')
  const normalizeText = directives.some((directive) => directive.id === 'numbers')

  return {
    spokenText: wantsDraft ? localDraft(trimmed) : trimmed,
    displayText: trimmed,
    emotion: commercial ? 'commercial' : bright ? 'happy' : 'neutral',
    speed: slow ? 0.88 : 1,
    normalizeText,
    draftMode: wantsDraft ? 'local-draft' : 'direct',
  }
}
