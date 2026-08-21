import { useCallback, useEffect, useRef, useState } from 'react'

const MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/webm',
]
const MAX_RECORDING_MS = 29_500

function preferredMimeType() {
  return MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
}

export function useVoiceRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const hardStopRef = useRef<number | null>(null)
  const startingRef = useRef(false)
  const discardNextStopRef = useRef(false)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current)
    if (hardStopRef.current !== null) window.clearTimeout(hardStopRef.current)
    timerRef.current = null
    hardStopRef.current = null
  }, [])

  const stop = useCallback(() => {
    clearTimers()
    const recorder = recorderRef.current
    if (recorder?.state === 'recording') recorder.stop()
  }, [clearTimers])

  const start = useCallback(async () => {
    if (startingRef.current || recorderRef.current?.state === 'recording') return
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('이 브라우저에서는 마이크 녹음을 지원하지 않습니다. 음성 파일을 업로드해 주세요.')
      return
    }

    startingRef.current = true
    discardNextStopRef.current = false
    setError(null)
    setFile(null)
    setSeconds(0)
    chunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      })
      streamRef.current = stream
      const mimeType = preferredMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      })
      recorder.addEventListener('error', () => {
        discardNextStopRef.current = true
        setError('녹음 스트림에 오류가 발생했습니다. 마이크 연결을 확인하고 다시 시도해 주세요.')
        stop()
      })
      recorder.addEventListener('stop', () => {
        clearTimers()
        setRecording(false)
        stopTracks()
        recorderRef.current = null

        if (discardNextStopRef.current) {
          discardNextStopRef.current = false
          chunksRef.current = []
          return
        }

        const type = recorder.mimeType || 'audio/webm'
        const extension = type.includes('mp4') ? 'm4a' : 'webm'
        const blob = new Blob(chunksRef.current, { type })
        chunksRef.current = []
        if (blob.size <= 0) {
          setError('녹음된 오디오가 비어 있습니다. 마이크 입력을 확인하고 다시 녹음해 주세요.')
          setFile(null)
          return
        }
        setFile(new File([blob], `sorion-voice-sample.${extension}`, { type }))
      })

      recorder.start(250)
      setRecording(true)
      const startedAt = performance.now()
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((performance.now() - startedAt) / 1000)
        setSeconds(Math.min(30, elapsed))
      }, 250)
      hardStopRef.current = window.setTimeout(() => {
        setSeconds(30)
        stop()
      }, MAX_RECORDING_MS)
    } catch {
      setError('마이크 권한을 확인하지 못했습니다. 브라우저 권한 설정을 확인해 주세요.')
      stopTracks()
    } finally {
      startingRef.current = false
    }
  }, [stop, stopTracks, clearTimers])

  const reset = useCallback(() => {
    discardNextStopRef.current = recorderRef.current?.state === 'recording'
    stop()
    stopTracks()
    recorderRef.current = null
    chunksRef.current = []
    setRecording(false)
    setFile(null)
    setSeconds(0)
    setError(null)
  }, [stop, stopTracks])

  useEffect(() => () => {
    discardNextStopRef.current = true
    clearTimers()
    const recorder = recorderRef.current
    if (recorder?.state === 'recording') recorder.stop()
    stopTracks()
  }, [clearTimers, stopTracks])

  return { recording, seconds, file, error, start, stop, reset, setFile }
}
