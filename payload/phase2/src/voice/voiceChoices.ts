import { voicePresets } from '../tts/voicePresets'
import { calculateVoiceSampleScore, voiceSampleScoreLabel } from '../voiceclone/sampleQualityScore'
import { findMyVoiceProfile, myVoiceInitial, toMyVoiceId } from '../voiceclone/voiceIdentity'
import type { VoiceCloneProfile } from '../voiceclone/voiceCloneTypes'

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
}

export function buildVoiceChoices(profiles: VoiceCloneProfile[]): VoiceChoice[] {
  return [
    ...profiles.map((profile): VoiceChoice => {
      const score = calculateVoiceSampleScore(profile.analysis)
      return {
        id: toMyVoiceId(profile.id),
        name: profile.displayName,
        shortName: myVoiceInitial(profile),
        kind: 'my-voice',
        description: profile.status === 'engine-ready'
          ? '내 샘플로 실제 음성 생성 준비됨'
          : '샘플 저장됨 · 음성 엔진 연결 시 생성 가능',
        meta: `MY VOICE · ${score}점 ${voiceSampleScoreLabel(score)}`,
        tone: 'soa-my-voice-tone',
        ready: profile.status === 'engine-ready',
        profile,
      }
    }),
    ...voicePresets.map((voice): VoiceChoice => ({
      id: voice.id,
      name: voice.name,
      shortName: voice.shortName,
      kind: 'preset',
      description: voice.description,
      meta: voice.tags.join(' · '),
      tone: voice.tone,
      ready: true,
      profile: null,
    })),
  ]
}

export function resolveVoiceChoice(profiles: VoiceCloneProfile[], voiceId: string): VoiceChoice {
  const custom = findMyVoiceProfile(profiles, voiceId)
  if (custom) {
    const score = calculateVoiceSampleScore(custom.analysis)
    return {
      id: voiceId,
      name: custom.displayName,
      shortName: myVoiceInitial(custom),
      kind: 'my-voice',
      description: custom.status === 'engine-ready'
        ? '내 샘플로 실제 음성 생성 준비됨'
        : '샘플 저장됨 · 음성 엔진 연결 시 생성 가능',
      meta: `MY VOICE · ${score}점 ${voiceSampleScoreLabel(score)}`,
      tone: 'soa-my-voice-tone',
      ready: custom.status === 'engine-ready',
      profile: custom,
    }
  }
  const preset = voicePresets.find((voice) => voice.id === voiceId) ?? voicePresets[0]
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
  }
}
