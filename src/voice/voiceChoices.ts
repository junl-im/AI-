import { calculateVoiceSampleScore } from '../voiceclone/sampleQualityScore'
import type { VoiceCloneProfile } from '../voiceclone/voiceCloneTypes'
import { findMyVoiceProfile, isMyVoiceId, myVoiceInitial, toMyVoiceId } from '../voiceclone/voiceIdentity'
import { getVoicePreset, voicePresets, type VoiceGender } from '../tts/voicePresets'

export interface VoiceChoice {
  id: string
  name: string
  shortName: string
  kind: 'preset' | 'my-voice'
  description: string
  meta: string
  tone: string
  ready: boolean
  profile: VoiceCloneProfile | null
  gender: VoiceGender | 'custom'
  bestFor: string[]
  strengths: string[]
  tradeoffs: string[]
}

function customChoice(profile: VoiceCloneProfile): VoiceChoice {
  const quality = calculateVoiceSampleScore(profile.analysis)
  return {
    id: toMyVoiceId(profile.id),
    name: profile.displayName,
    shortName: myVoiceInitial(profile.displayName),
    kind: 'my-voice',
    description: profile.status === 'engine-ready'
      ? '내 샘플로 준비된 개인 음성'
      : profile.message || '내 목소리 엔진 준비가 필요합니다.',
    meta: `샘플 ${Math.round(profile.analysis.durationSeconds)}초 · 품질 ${quality}/100`,
    tone: 'soa-my-voice-tone',
    ready: profile.status === 'engine-ready',
    profile,
    gender: 'custom',
    bestFor: ['내레이션', '개인 콘텐츠', '내 목소리'],
    strengths: ['내 샘플 기반 음색', '프로젝트 전체에 재사용'],
    tradeoffs: profile.status === 'engine-ready'
      ? ['샘플 품질에 따라 결과 차이', '일반 프리셋보다 생성 시간이 길 수 있음']
      : ['엔진 준비가 필요함', '준비 전에는 생성할 수 없음'],
  }
}

function presetChoice(voiceId: string): VoiceChoice {
  const preset = getVoicePreset(voiceId)
  return {
    id: preset.id,
    name: preset.name,
    shortName: preset.shortName,
    kind: 'preset',
    description: preset.description,
    meta: preset.tags.join(' · '),
    tone: preset.tone,
    ready: true,
    profile: null,
    gender: preset.gender,
    bestFor: [...preset.bestFor],
    strengths: [...preset.strengths],
    tradeoffs: [...preset.tradeoffs],
  }
}

export function buildVoiceChoices(profiles: VoiceCloneProfile[]): VoiceChoice[] {
  return [
    ...profiles.map(customChoice),
    ...voicePresets.map((preset) => presetChoice(preset.id)),
  ]
}

export function resolveVoiceChoice(
  choices: VoiceChoice[],
  voiceId: string,
): VoiceChoice {
  const found = choices.find((choice) => choice.id === voiceId)
  if (found) return found

  if (isMyVoiceId(voiceId)) {
    const profile = findMyVoiceProfile(
      choices.flatMap((choice) => choice.profile ? [choice.profile] : []),
      voiceId,
    )
    if (profile) return customChoice(profile)
    return {
      id: voiceId,
      name: '내 목소리',
      shortName: '내',
      kind: 'my-voice',
      description: '저장된 내 목소리 프로필을 찾지 못했습니다.',
      meta: '프로필 확인 필요',
      tone: 'soa-my-voice-tone',
      ready: false,
      profile: null,
      gender: 'custom',
      bestFor: ['내 목소리'],
      strengths: ['개인 음성'],
      tradeoffs: ['프로필을 다시 선택해 주세요.'],
    }
  }
  return presetChoice(voiceId)
}
