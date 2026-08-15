import type { TtsSynthesisResult } from '../ai/contracts'
import { ApiError } from '../api/httpClient'
import { cancelVoiceCloneJob, getVoiceCloneJob, startVoiceCloneJob } from './voiceCloneApi'
import { streamVoiceCloneProgress, type VoiceCloneProgressSnapshot } from './voiceCloneProgressStream'
import type { VoiceCloneJob } from './voiceCloneTypes'

export interface VoiceCloneSynthesisProgress {
  jobId: string
  status: VoiceCloneJob['status']
  progress: number
  phase: string
  message: string
  firstAudioMs: number | null
}

interface VoiceCloneSynthesisOptions {
  profileId: string
  text: string
  existingJobId?: string | null
  allowStart?: boolean
  signal?: AbortSignal
  onJobId?: (jobId: string) => void
  onProgress?: (progress: VoiceCloneSynthesisProgress) => void
}

function cancelledError(): ApiError {
  return new ApiError('내 목소리 생성을 취소했습니다.', 499, 'SOA-5203', 'cancelled')
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      globalThis.clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
      reject(cancelledError())
    }
    const timer = globalThis.setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      resolve()
    }, ms)
    if (signal?.aborted) {
      abort()
      return
    }
    signal?.addEventListener('abort', abort, { once: true })
  })
}

function completedResult(job: VoiceCloneJob): TtsSynthesisResult {
  if (job.status !== 'completed' || !job.audioUrl) {
    throw new ApiError(job.error || job.message || '내 목소리 생성 결과를 받지 못했습니다.', 502, 'SOA-5201', 'server', true)
  }
  return {
    jobId: job.id,
    status: 'completed',
    engineId: 'cosyvoice3-worker',
    engineMode: 'ai',
    audioUrl: job.audioUrl,
    estimatedDurationSeconds: job.durationSeconds ?? Math.max(1, job.text.length / 5.6),
    message: job.message,
    normalizedText: job.text,
    segmentCount: Math.max(1, job.segments.length),
    firstAudioMs: job.firstAudioMs,
    processingMs: null,
    fileSizeBytes: null,
    realtimeFactor: null,
    requestedEngineId: 'cosyvoice3-worker',
    attemptedEngineIds: ['cosyvoice3-worker'],
    fallbackUsed: false,
  }
}

function publishProgress(
  progress: VoiceCloneProgressSnapshot | VoiceCloneJob,
  onProgress?: VoiceCloneSynthesisOptions['onProgress'],
) {
  onProgress?.({
    jobId: progress.id,
    status: progress.status,
    progress: progress.progress,
    phase: progress.phase,
    message: progress.message,
    firstAudioMs: progress.firstAudioMs,
  })
}

export async function watchVoiceCloneJob(
  job: VoiceCloneJob,
  signal: AbortSignal,
  onProgress?: VoiceCloneSynthesisOptions['onProgress'],
): Promise<VoiceCloneJob> {
  let latest = job
  const streamed = await streamVoiceCloneProgress(job.eventsUrl, (progress) => publishProgress(progress, onProgress), signal)
  if (signal.aborted) throw cancelledError()
  if (streamed) {
    try {
      latest = await getVoiceCloneJob(job.id, signal)
      publishProgress(latest, onProgress)
      if (!['queued', 'running'].includes(latest.status)) return latest
    } catch (error) {
      if (signal.aborted) throw cancelledError()
      if (error instanceof ApiError && error.kind === 'cancelled') throw error
    }
  }

  let delayMs = 360
  while (latest.status === 'queued' || latest.status === 'running') {
    await wait(delayMs, signal)
    latest = await getVoiceCloneJob(job.id, signal)
    publishProgress(latest, onProgress)
    delayMs = Math.min(900, Math.round(delayMs * 1.35))
  }
  return latest
}

export async function synthesizeVoiceCloneProfile(
  options: VoiceCloneSynthesisOptions,
): Promise<TtsSynthesisResult | null> {
  const allowStart = options.allowStart ?? true
  const controller = new AbortController()
  const abort = () => controller.abort()
  options.signal?.addEventListener('abort', abort, { once: true })
  if (options.signal?.aborted) controller.abort()

  let job: VoiceCloneJob | null = null
  let activeJobId = options.existingJobId ?? null
  const cancelRemote = () => {
    if (activeJobId) void cancelVoiceCloneJob(activeJobId).catch(() => undefined)
  }
  controller.signal.addEventListener('abort', cancelRemote, { once: true })

  try {
    if (activeJobId) {
      try {
        job = await getVoiceCloneJob(activeJobId, controller.signal)
        publishProgress(job, options.onProgress)
        if (job.status === 'completed') return completedResult(job)
        if (job.status === 'failed' || job.status === 'cancelled') job = null
      } catch (error) {
        if (controller.signal.aborted) throw cancelledError()
        if (error instanceof ApiError && error.kind === 'cancelled') throw error
        if (!allowStart) return null
        const expired = error instanceof ApiError && [404, 410].includes(error.status)
        if (!expired) throw error
        job = null
      }
    }

    if (!job) {
      if (!allowStart) return null
      job = await startVoiceCloneJob(options.profileId, options.text, controller.signal)
      activeJobId = job.id
      options.onJobId?.(job.id)
      publishProgress(job, options.onProgress)
    }
    if (job.status === 'completed') return completedResult(job)
    if (job.status === 'cancelled') throw cancelledError()
    if (job.status === 'failed') {
      throw new ApiError(job.error || job.message || '내 목소리 생성에 실패했습니다.', 502, 'SOA-5202', 'server', true)
    }

    const completed = await watchVoiceCloneJob(job, controller.signal, options.onProgress)
    if (controller.signal.aborted) throw cancelledError()
    if (completed.status === 'completed') return completedResult(completed)
    if (completed.status === 'cancelled') throw cancelledError()
    throw new ApiError(completed.error || completed.message || '내 목소리 생성에 실패했습니다.', 502, 'SOA-5202', 'server', true)
  } finally {
    controller.signal.removeEventListener('abort', cancelRemote)
    options.signal?.removeEventListener('abort', abort)
  }
}
