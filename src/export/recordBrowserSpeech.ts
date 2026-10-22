import { createBrowserSpeechUtterance } from '../tts/browserSpeech'
import type { TimelineBlock } from '../workspace/workspaceTypes'

function waitForSpeech(block: Extract<TimelineBlock, { kind: 'voice' }>, signal: AbortSignal): Promise<void> {
  const playback = block.audio?.browserSpeech
  if (!playback) throw new Error('녹음할 브라우저 음성이 없습니다.')
  const utterance = createBrowserSpeechUtterance(playback)
  return new Promise((resolve, reject) => {
    const abort = () => {
      window.speechSynthesis.cancel()
      reject(new Error('녹음이 취소되었습니다.'))
    }
    signal.addEventListener('abort', abort, { once: true })
    utterance.onend = () => {
      signal.removeEventListener('abort', abort)
      resolve()
    }
    utterance.onerror = () => {
      signal.removeEventListener('abort', abort)
      reject(new Error('기기 음성 재생이 중단되어 녹음을 완료하지 못했습니다.'))
    }
    window.speechSynthesis.speak(utterance)
  })
}

function waitForPause(seconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, Math.max(0, seconds) * 1000)
    signal.addEventListener('abort', () => {
      window.clearTimeout(timer)
      reject(new Error('녹음이 취소되었습니다.'))
    }, { once: true })
  })
}

export async function recordBrowserSpeech(
  blocks: TimelineBlock[],
  signal: AbortSignal,
  onProgress: (index: number, total: number) => void,
): Promise<Blob> {
  if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === 'undefined') {
    throw new Error('이 브라우저는 탭 오디오 녹음을 지원하지 않습니다. 최신 Chrome 또는 Edge를 사용해 주세요.')
  }
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: { restrictOwnAudio: false },
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
  } as DisplayMediaStreamOptions)
  try {
    if (signal.aborted) throw new Error('녹음이 취소되었습니다.')
    const audioTrack = stream.getAudioTracks()[0]
    if (!audioTrack) throw new Error('탭 오디오가 공유되지 않았습니다. 현재 탭을 선택하고 ‘탭 오디오 공유’를 켜 주세요.')
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
