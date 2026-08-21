import { useEffect, useState } from 'react'
import { ApiError } from '../api/httpClient'
import {
  listVoiceProfiles,
  MY_VOICE_PROFILES_CHANGED_EVENT,
  notifyVoiceProfilesChanged,
  saveVoiceProfile,
} from '../voiceclone/profileRepository'
import { getRemoteVoiceCloneProfile } from '../voiceclone/voiceCloneApi'
import type { VoiceCloneProfile } from '../voiceclone/voiceCloneTypes'

function remoteProfileId(profile: VoiceCloneProfile): string | null {
  return profile.remoteProfileId ?? (profile.remoteSynced === false ? null : profile.id)
}

function analysisChanged(left: VoiceCloneProfile, right: VoiceCloneProfile): boolean {
  return JSON.stringify(left.analysis) !== JSON.stringify(right.analysis)
}

async function reconcileProfile(
  profile: VoiceCloneProfile,
  signal: AbortSignal,
): Promise<VoiceCloneProfile> {
  const remoteId = remoteProfileId(profile)
  if (!remoteId) return profile
  try {
    const remote = await getRemoteVoiceCloneProfile(remoteId, signal)
    const next: VoiceCloneProfile = {
      ...profile,
      remoteProfileId: remote.id,
      remoteSynced: true,
      status: remote.status,
      engineId: remote.engineId,
      analysis: remote.serverAnalysis ?? profile.analysis,
      message: remote.message,
    }
    const changed = profile.remoteProfileId !== next.remoteProfileId
      || profile.remoteSynced !== next.remoteSynced
      || profile.status !== next.status
      || profile.engineId !== next.engineId
      || profile.message !== next.message
      || analysisChanged(profile, next)
    return changed ? { ...next, updatedAt: new Date().toISOString() } : profile
  } catch (error) {
    if (signal.aborted) return profile
    if (error instanceof ApiError && error.status === 404) {
      if (profile.remoteSynced === false && profile.remoteProfileId == null) return profile
      return {
        ...profile,
        remoteProfileId: null,
        remoteSynced: false,
        status: 'engine-unavailable',
        updatedAt: new Date().toISOString(),
        message: '이 기기에만 저장된 프로필입니다. 서버에 다시 준비하면 실제 생성에 사용할 수 있습니다.',
      }
    }
    return profile
  }
}

export function useMyVoiceProfiles(): { profiles: VoiceCloneProfile[]; loading: boolean } {
  const [profiles, setProfiles] = useState<VoiceCloneProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    let controller: AbortController | null = null

    const load = async () => {
      controller?.abort()
      controller = new AbortController()
      const signal = controller.signal
      try {
        const local = await listVoiceProfiles()
        if (!active || signal.aborted) return
        setProfiles(local)
        const reconciled = await Promise.all(
          local.map((profile) => reconcileProfile(profile, signal)),
        )
        if (!active || signal.aborted) return
        const changed = reconciled.filter((profile, index) => profile !== local[index])
        if (changed.length > 0) {
          await Promise.all(changed.map((profile) => saveVoiceProfile(profile, false)))
          if (!active || signal.aborted) return
          setProfiles(reconciled)
          notifyVoiceProfilesChanged()
        }
      } catch {
        if (active && !signal.aborted) setProfiles([])
      } finally {
        if (active && !signal.aborted) setLoading(false)
      }
    }

    void load()
    const refresh = () => void load()
    window.addEventListener(MY_VOICE_PROFILES_CHANGED_EVENT, refresh)
    window.addEventListener('online', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      active = false
      controller?.abort()
      window.removeEventListener(MY_VOICE_PROFILES_CHANGED_EVENT, refresh)
      window.removeEventListener('online', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return { profiles, loading }
}
