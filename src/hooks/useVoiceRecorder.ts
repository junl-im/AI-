import { useCallback, useEffect, useRef, useState } from 'react'

const MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/webm',
]

function preferredMimeType() {
  return MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
}

export function useVoiceRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const stop = useCallback(() => {
    clearTimer()
    const recorder = recorderRef.current
    if (recorder?.state === 'recording') recorder.stop()
  }, [clearTimer])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('이 브라우저에서는 마이크 녹음을 지원하지 않습니다. 음성 파일을 업로드해 주세요.')
      return
    }
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
      recorder.addEventListener('stop', () => {
        const type = recorder.mimeType || 'audio/webm'
        const extension = type.includes('mp4') ? 'm4a' : 'webm'
        const blob = new Blob(chunksRef.current, { type })
        setFile(new File([blob], `sorion-voice-sample.${extension}`, { type }))
        setRecording(false)
        stopTracks()
      })
      recorder.start(250)
      setRecording(true)
      const startedAt = Date.now()
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000)
        setSeconds(elapsed)
        if (elapsed >= 60) stop()
      }, 250)
    } catch {
      setError('마이크 권한을 확인하지 못했습니다. 브라우저 권한 설정을 확인해 주세요.')
      stopTracks()
    }
  }, [stop, stopTracks])

  const reset = useCallback(() => {
    stop()
    stopTracks()
    setFile(null)
    setSeconds(0)
    setError(null)
  }, [stop, stopTracks])

  useEffect(() => () => {
    clearTimer()
    stopTracks()
  }, [clearTimer, stopTracks])

  return { recording, seconds, file, error, start, stop, reset, setFile }
}
