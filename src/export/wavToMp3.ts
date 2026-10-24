import { encodePcmMp3, throwIfMp3Aborted, type Mp3EncodeOptions } from './encodePcmMp3'

class WorkerUnavailableError extends Error {}
export const MP3_WORKER_STALL_TIMEOUT_MS = 45_000

export interface WavToMp3Options extends Mp3EncodeOptions {
  onFallback?: (reason: string) => void
}

function encodeWithWorker(wav: Blob, options: WavToMp3Options): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let worker: Worker
    try {
      worker = new Worker(new URL('./mp3Encoder.worker.ts', import.meta.url), { type: 'module' })
    } catch {
      reject(new WorkerUnavailableError('MP3 작업 스레드를 시작하지 못했습니다.'))
      return
    }
    let settled = false
    let stallTimer: ReturnType<typeof setTimeout> | null = null
    const finish = (result: Blob | Error) => {
      if (settled) return
      settled = true
      if (stallTimer) clearTimeout(stallTimer)
      options.signal?.removeEventListener('abort', onAbort)
      worker.terminate()
      if (result instanceof Blob) resolve(result)
      else reject(result)
    }
    const onAbort = () => finish(new DOMException('MP3 변환이 취소되었습니다.', 'AbortError'))
    const armStallTimer = () => {
      if (stallTimer) clearTimeout(stallTimer)
      stallTimer = setTimeout(() => finish(new WorkerUnavailableError('MP3 작업 스레드 응답이 지연됐습니다.')), MP3_WORKER_STALL_TIMEOUT_MS)
    }
    options.signal?.addEventListener('abort', onAbort, { once: true })
    if (options.signal?.aborted) { onAbort(); return }
    worker.onmessage = (event: MessageEvent<{ type: string; done?: number; total?: number; buffer?: ArrayBuffer; message?: string }>) => {
      const data = event.data
      armStallTimer()
      if (data.type === 'progress' && data.done !== undefined && data.total !== undefined) {
        try { options.onProgress?.(data.done, data.total) } catch (error) { finish(error instanceof Error ? error : new Error(String(error))) }
      } else if (data.type === 'done' && data.buffer) finish(new Blob([data.buffer], { type: 'audio/mpeg' }))
      else if (data.type === 'error') finish(new Error(data.message || 'MP3 변환에 실패했습니다.'))
    }
    worker.onerror = () => finish(new WorkerUnavailableError('MP3 작업 스레드를 실행하지 못했습니다.'))
    worker.onmessageerror = () => finish(new WorkerUnavailableError('MP3 작업 스레드 결과를 읽지 못했습니다.'))
    try { armStallTimer(); worker.postMessage({ wav }) }
    catch { finish(new WorkerUnavailableError('MP3 작업 스레드에 WAV를 전달하지 못했습니다.')) }
  })
}

export async function wavToMp3(wav: Blob, options: WavToMp3Options = {}): Promise<Blob> {
  throwIfMp3Aborted(options.signal)
  if (typeof Worker === 'undefined') return encodePcmMp3(wav, options)
  try {
    return await encodeWithWorker(wav, options)
  } catch (error) {
    if (!(error instanceof WorkerUnavailableError)) throw error
    throwIfMp3Aborted(options.signal)
    options.onFallback?.(error.message)
    return encodePcmMp3(wav, options)
  }
}
