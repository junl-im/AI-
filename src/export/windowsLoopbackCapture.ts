import { waitForSpeech } from './recordBrowserSpeech'
import { audioBufferToWav } from './recordedAudioFormats'
import { combineTimelinePcmWav } from './timelineWav'
import type { TimelineBlock } from '../workspace/workspaceTypes'

const BRIDGE_URL = 'http://127.0.0.1:18717'
const TOKEN_KEY = 'sorion-windows-capture-token'

export function readWindowsCaptureToken(): string | null {
  const url = new URL(window.location.href)
  const supplied = url.searchParams.get('sorion-capture-token')
  if (supplied) {
    url.searchParams.delete('sorion-capture-token')
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    if (/^[A-F0-9]{48}$/i.test(supplied)) {
      window.sessionStorage.setItem(TOKEN_KEY, supplied)
      return supplied
    }
  }
  return window.sessionStorage.getItem(TOKEN_KEY)
}

async function bridgeRequest(path: string, signal?: AbortSignal): Promise<Response> {
  const token = readWindowsCaptureToken()
  if (!token) throw new Error('Windows 오디오 보조 앱을 실행해 열린 소리온 페이지에서 다시 시도해 주세요.')
  let response: Response
  try {
    response = await fetch(`${BRIDGE_URL}${path}`, {
      method: path === '/status' ? 'GET' : 'POST',
      headers: { 'X-SoriON-Token': token },
      mode: 'cors', credentials: 'omit', signal,
      targetAddressSpace: 'loopback',
    } as RequestInit & { targetAddressSpace: 'loopback' })
  } catch {
    throw new Error('Windows 오디오 보조 앱에 연결하지 못했습니다. 앱 창을 확인하고 Chrome/Edge에서 이 사이트의 ‘이 기기의 앱 접근’ 권한을 허용해 주세요.')
  }
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string; detail?: string } | null
    throw new Error(result?.error ?? result?.detail ?? `Windows 오디오 보조 앱 오류(${response.status})`)
  }
  return response
}

export async function windowsCaptureAvailable(signal?: AbortSignal): Promise<boolean> {
  if (!readWindowsCaptureToken()) return false
  try { await bridgeRequest('/status', signal); return true }
  catch { return false }
}

export async function captureBrowserSpeechWithWindowsLoopback(
  blocks: TimelineBlock[],
  signal: AbortSignal,
  onProgress: (index: number, total: number) => void,
): Promise<Blob> {
  const parts: Array<{ audio?: ArrayBuffer; pauseSeconds?: number }> = []
  const context = new AudioContext()
  try {
    window.speechSynthesis.cancel()
    for (const [index, block] of blocks.entries()) {
      if (signal.aborted) throw new Error('녹음이 취소되었습니다.')
      onProgress(index + 1, blocks.length)
      if (block.kind === 'pause') {
        parts.push({ pauseSeconds: block.durationSeconds })
        continue
      }
      await bridgeRequest('/capture/start', signal)
      try {
        await waitForSpeech(block, signal)
        await new Promise((resolve) => window.setTimeout(resolve, 150))
        const captured = await (await bridgeRequest('/capture/stop', signal)).arrayBuffer()
        const decoded = await context.decodeAudioData(captured)
        const wav = audioBufferToWav(decoded)
        parts.push({ audio: await wav.arrayBuffer() })
      } catch (error) {
        window.speechSynthesis.cancel()
        await bridgeRequest('/capture/cancel').catch(() => undefined)
        throw error
      }
    }
    return combineTimelinePcmWav(parts)
  } finally {
    await context.close()
  }
}
