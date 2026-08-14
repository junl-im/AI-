import {
  completeTransaction,
  openSoriOnDatabase,
  VOICE_PROFILE_STORE,
} from '../storage/database'
import type { VoiceCloneProfile } from './voiceCloneTypes'

export const MY_VOICE_PROFILES_CHANGED_EVENT = 'sorion-my-voice-profiles-changed'

function notifyProfilesChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(MY_VOICE_PROFILES_CHANGED_EVENT))
}

export async function saveVoiceProfile(profile: VoiceCloneProfile): Promise<void> {
  const database = await openSoriOnDatabase()
  const transaction = database.transaction(VOICE_PROFILE_STORE, 'readwrite')
  transaction.objectStore(VOICE_PROFILE_STORE).put(profile)
  await completeTransaction(transaction)
  database.close()
  notifyProfilesChanged()
}

export async function listVoiceProfiles(): Promise<VoiceCloneProfile[]> {
  const database = await openSoriOnDatabase()
  const profiles = await new Promise<VoiceCloneProfile[]>((resolve, reject) => {
    const request = database
      .transaction(VOICE_PROFILE_STORE, 'readonly')
      .objectStore(VOICE_PROFILE_STORE)
      .getAll()
    request.onsuccess = () => resolve(request.result as VoiceCloneProfile[])
    request.onerror = () => reject(request.error)
  })
  database.close()
  return profiles.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function deleteVoiceProfile(profileId: string): Promise<void> {
  const database = await openSoriOnDatabase()
  const transaction = database.transaction(VOICE_PROFILE_STORE, 'readwrite')
  transaction.objectStore(VOICE_PROFILE_STORE).delete(profileId)
  await completeTransaction(transaction)
  database.close()
  notifyProfilesChanged()
}
