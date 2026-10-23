import { createBrowserSpeechUtterance } from '../tts/browserSpeech'
import type { TimelineBlock } from '../workspace/workspaceTypes'

export function waitForSpeech(block: Extract<TimelineBlock, { kind: 'voice' }>, signal: AbortSignal): Promise<void> {
  const playback = block.audio?.browserSpeech
  if (!playback) throw new Error('녹음할 브라우저 음성이 없습니다.')
  const utterance = createBrowserSpeechUtterance(playback)
  return new Promise((resolve, reject) => {
    let settled = false
    let startTimer = 0
    let finishTimer = 0
    const cleanup = () => {
      window.clearTimeout(startTimer)
      window.clearTimeout(finishTimer)
      signal.removeEventListener('abort', abort)
    }
    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      cleanup()
      if (error) reject(error)
      else resolve()
    }
    const abort = () => {
      window.speechSynthesis.cancel()
      finish(new Error('녹음이 취소되었습니다.'))
    }
    if (signal.aborted) { abort(); return }
    signal.addEventListener('abort', abort, { once: true })
    utterance.onstart = () => {
      if (settled) return
      window.clearTimeout(startTimer)
      const maxPlaybackMs = Math.min(180_000, Math.max(30_000, playback.text.length * 450))
      finishTimer = window.setTimeout(() => {
        window.speechSynthesis.cancel()
        finish(new Error('기기 음성 재생이 끝나지 않아 녹음을 중단했습니다. 클립을 나누어 다시 시도해 주세요.'))
      }, maxPlaybackMs)
    }
    utterance.onend = () => finish()
    utterance.onerror = () => {
      finish(new Error('기기 음성 재생이 중단되어 녹음을 완료하지 못했습니다.'))
    }
    startTimer = window.setTimeout(() => {
      window.speechSynthesis.cancel()
      finish(new Error('기기 음성이 시작되지 않아 녹음을 중단했습니다. 음성 재생을 확인한 뒤 다시 시도해 주세요.'))
    }, 8_000)
    try { window.speechSynthesis.speak(utterance) }
    catch { finish(new Error('기기 음성을 시작하지 못했습니다.')) }
  })
}

function waitForPause(seconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    let timer = 0
    const abort = () => {
      window.clearTimeout(timer)
      reject(new Error('녹음이 취소되었습니다.'))
    }
    if (signal.aborted) { abort(); return }
    timer = window.setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, Math.max(0, seconds) * 1000)
    signal.addEventListener('abort', abort, { once: true })
  })
}

export async function getBrowserSpeechCaptureStream(inputDeviceId?: string): Promise<MediaStream> {
  if (!navigator.mediaDevices
    || (inputDeviceId ? !navigator.mediaDevices.getUserMedia : !navigator.mediaDevices.getDisplayMedia)) {
    throw new Error('이 브라우저는 선택한 오디오 녹음 방식을 지원하지 않습니다. 최신 Chrome 또는 Edge를 사용해 주세요.')
  }
  return inputDeviceId ? navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: inputDeviceId === 'default' ? undefined : { exact: inputDeviceId },
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  }) : await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: { restrictOwnAudio: false, suppressLocalAudioPlayback: false },
    systemAudio: 'include',
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
  } as DisplayMediaStreamOptions)
}

export async function recordBrowserSpeech(
  blocks: TimelineBlock[],
  signal: AbortSignal,
  onProgress: (index: number, total: number) => void,
  inputDeviceId?: string,
): Promise<Blob> {
  if (typeof MediaRecorder === 'undefined') throw new Error('이 브라우저는 오디오 녹음을 지원하지 않습니다.')
  const stream = await getBrowserSpeechCaptureStream(inputDeviceId)
  try {
    if (signal.aborted) throw new Error('녹음이 취소되었습니다.')
    const audioTrack = stream.getAudioTracks()[0]
    if (!audioTrack) throw new Error(inputDeviceId ? '선택한 소리 입력 장치에 오디오가 없습니다.' : '오디오가 공유되지 않았습니다. 현재 탭의 오디오 공유 또는 화면 전체의 시스템 오디오를 켜 주세요.')
    const audioStream = new MediaStream([audioTrack])
    const mimeType = ['audio/webm;codecs=opus', 'audio/webm'].find((type) => MediaRecorder.isTypeSupported(type))
    if (!mimeType) throw new Error('이 브라우저는 WebM 오디오 저장을 지원하지 않습니다.')
    const recorder = new MediaRecorder(audioStream, { mimeType })
    const chunks: BlobPart[] = []
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
    const stopped = new Promise<Blob>((resolve, reject) => {
      recorder.onerror = () => reject(new Error('탭 오디오 녹음에 실패했습니다.'))
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
    })
    audioTrack.addEventListener('ended', () => {
      if (recorder.state !== 'inactive') recorder.stop()
    }, { once: true })
    recorder.start(250)
    try {
      window.speechSynthesis.cancel()
      for (const [index, block] of blocks.entries()) {
        if (signal.aborted || audioTrack.readyState !== 'live') throw new Error('탭 오디오 공유가 중단되었습니다.')
        onProgress(index + 1, blocks.length)
        if (block.kind === 'pause') await waitForPause(block.durationSeconds, signal)
        else await waitForSpeech(block, signal)
      }
      await waitForPause(0.35, signal)
      if (recorder.state !== 'inactive') recorder.stop()
      const blob = await stopped
      if (blob.size === 0) throw new Error('녹음된 오디오가 없습니다. 탭 오디오 공유를 확인해 주세요.')
      return blob
    } catch (error) {
      window.speechSynthesis.cancel()
      if (recorder.state !== 'inactive') recorder.stop()
      await stopped.catch(() => undefined)
      throw error
    }
  } finally {
    stream.getTracks().forEach((track) => track.stop())
  }
}
