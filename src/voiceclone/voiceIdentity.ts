import type { VoiceCloneProfile } from './voiceCloneTypes'

export const MY_VOICE_PREFIX = 'myvoice:'

export function toMyVoiceId(profileId: string): string {
  return `${MY_VOICE_PREFIX}${profileId}`
}

export function isMyVoiceId(voiceId: string): boolean {
  return voiceId.startsWith(MY_VOICE_PREFIX) && voiceId.length > MY_VOICE_PREFIX.length
}

export function getMyVoiceProfileId(voiceId: string): string | null {
  return isMyVoiceId(voiceId) ? voiceId.slice(MY_VOICE_PREFIX.length) : null
}

export function findMyVoiceProfile(
  profiles: VoiceCloneProfile[],
  voiceId: string,
): VoiceCloneProfile | null {
  const profileId = getMyVoiceProfileId(voiceId)
  if (!profileId) return null
  return profiles.find((profile) => profile.id === profileId) ?? null
}

export function myVoiceInitial(name: string): string {
  return name.trim().slice(0, 1) || 'V'
}
