import { useCallback, useEffect, useState } from 'react'
import { listVoiceProfiles, MY_VOICE_PROFILES_CHANGED_EVENT } from '../voiceclone/profileRepository'
import type { VoiceCloneProfile } from '../voiceclone/voiceCloneTypes'

export function useMyVoiceProfiles() {
  const [profiles, setProfiles] = useState<VoiceCloneProfile[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setProfiles(await listVoiceProfiles())
    } catch {
      setProfiles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const handleProfilesChanged = () => void refresh()
    window.addEventListener(MY_VOICE_PROFILES_CHANGED_EVENT, handleProfilesChanged)
    return () => window.removeEventListener(MY_VOICE_PROFILES_CHANGED_EVENT, handleProfilesChanged)
  }, [refresh])

  return { profiles, loading, refresh }
}
