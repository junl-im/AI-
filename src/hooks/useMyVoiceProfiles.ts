import { useEffect, useState } from 'react'
import {
  listVoiceProfiles,
  MY_VOICE_PROFILES_CHANGED_EVENT,
} from '../voiceclone/profileRepository'
import type { VoiceCloneProfile } from '../voiceclone/voiceCloneTypes'

export function useMyVoiceProfiles(): { profiles: VoiceCloneProfile[]; loading: boolean } {
  const [profiles, setProfiles] = useState<VoiceCloneProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const next = await listVoiceProfiles()
        if (active) setProfiles(next)
      } catch {
        if (active) setProfiles([])
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    const refresh = () => void load()
    window.addEventListener(MY_VOICE_PROFILES_CHANGED_EVENT, refresh)
    return () => {
      active = false
      window.removeEventListener(MY_VOICE_PROFILES_CHANGED_EVENT, refresh)
    }
  }, [])

  return { profiles, loading }
}
