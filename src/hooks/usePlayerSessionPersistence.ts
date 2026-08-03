import { useEffect, useRef } from 'react'
import {
  createPlayerSessionSnapshot,
  loadPlayerSession,
  rehydratePlayerSession,
  savePlayerSession,
} from '../player/playerSession'
import { usePlayerStore } from '../store/usePlayerStore'
import { refreshSpeechFinalAudio } from '../tts/voiceApi'

const SAVE_DELAY_MS = 500

export function usePlayerSessionPersistence() {
  const queue = usePlayerStore((state) => state.queue)
  const currentTrackId = usePlayerStore((state) => state.currentTrackId)
  const repeatMode = usePlayerStore((state) => state.repeatMode)
  const playbackRate = usePlayerStore((state) => state.playbackRate)
  const restoreSession = usePlayerStore((state) => state.restoreSession)
  const hydratedRef = useRef(false)
  const timerRef = useRef<number | null>(null)
  const latestRef = useRef({ queue, currentTrackId, repeatMode, playbackRate })
  latestRef.current = { queue, currentTrackId, repeatMode, playbackRate }

  useEffect(() => {
    let cancelled = false
    const restore = async () => {
      const snapshot = loadPlayerSession()
      const renewed = snapshot
        ? await rehydratePlayerSession(snapshot, (jobId) => refreshSpeechFinalAudio(jobId))
        : null
      if (cancelled) return
      hydratedRef.current = true
      if (renewed) {
        restoreSession(
          renewed.tracks,
          renewed.currentTrackId,
          renewed.repeatMode,
          renewed.playbackRate,
        )
      }
    }
    void restore()
    return () => { cancelled = true }
  }, [restoreSession])

  useEffect(() => {
    if (!hydratedRef.current) return
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      savePlayerSession(createPlayerSessionSnapshot(latestRef.current))
    }, SAVE_DELAY_MS)
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [currentTrackId, playbackRate, queue, repeatMode])

  useEffect(() => {
    const checkpoint = () => {
      if (!hydratedRef.current) return
      savePlayerSession(createPlayerSessionSnapshot(latestRef.current))
    }
    window.addEventListener('pagehide', checkpoint)
    return () => window.removeEventListener('pagehide', checkpoint)
  }, [])
}
