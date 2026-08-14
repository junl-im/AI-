import type { TtsSynthesisResult } from '../ai/contracts'
import { ApiError } from '../api/httpClient'
import {
  cancelVoiceCloneJob,
  getVoiceCloneJob,
  startVoiceCloneJob,
} from './voiceCloneApi'
import type { VoiceCloneJob } from './voiceCloneTypes'

export interface VoiceCloneSynthesisProgress {
  jobId: string
  progress: number
  phase: string
  message: string
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

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      resolve()
    }, ms)
    const abort = () => {
      globalThis.clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
      reject(new ApiError('내 목소리 생성을 취소했습니다.', 499, 'SOA-5203', 'cancelled'))
    }
    if (signal?.aborted) {
      abort()
      return
    }
    signal?.addEventListener('abort', abort, { once: true })
  })
}

function completedResult(job: VoiceCloneJob): TtsSynthesisResult {
  if (job.status !== 'completed' || !job.audioUrl) {
    throw new ApiError(
      job.error || job.message || '내 목소리 생성 결과를 받지 못했습니다.',
      502,
      'SOA-5201',
      'server',
      true,
    )
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

function publishProgress(job: VoiceCloneJob, onProgress?: VoiceCloneSynthesisOptions['onProgress']) {
  onProgress?.({
    jobId: job.id,
    progress: job.progress,
    phase: job.phase,
    message: job.message,
  })
}

export async function synthesizeVoiceCloneProfile(
  options: VoiceCloneSynthesisOptions,
): Promise<TtsSynthesisResult | null> {
  const allowStart = options.allowStart ?? true
  let job: VoiceCloneJob | null = null
  let activeJobId = options.existingJobId ?? null

  if (activeJobId) {
    try {
      job = await getVoiceCloneJob(activeJobId)
      publishProgress(job, options.onProgress)
      if (job.status === 'completed') return completedResult(job)
      if (job.status === 'failed' || job.status === 'cancelled') job = null
    } catch (error) {
      if (!allowStart) return null
      if (error instanceof ApiError && error.kind === 'cancelled') throw error
      job = null
    }
  }

  if (!job) {
    if (!allowStart) return null
    job = await startVoiceCloneJob(options.profileId, options.text)
    activeJobId = job.id
    options.onJobId?.(job.id)
    publishProgress(job, options.onProgress)
  }

  let aborted = false
  const cancelRemote = () => {
    aborted = true
    if (activeJobId) void cancelVoiceCloneJob(activeJobId).catch(() => undefined)
  }
  options.signal?.addEventListener('abort', cancelRemote, { once: true })

  try {
    while (job.status === 'queued' || job.status === 'running') {
      await wait(650, options.signal)
      job = await getVoiceCloneJob(job.id)
      activeJobId = job.id
      publishProgress(job, options.onProgress)
    }
    if (aborted || options.signal?.aborted) {
      throw new ApiError('내 목소리 생성을 취소했습니다.', 499, 'SOA-5203', 'cancelled')
    }
    if (job.status === 'completed') return completedResult(job)
    if (job.status === 'cancelled') {
      throw new ApiError('내 목소리 생성을 취소했습니다.', 499, 'SOA-5203', 'cancelled')
    }
    throw new ApiError(
      job.error || job.message || '내 목소리 생성에 실패했습니다.',
      502,
      'SOA-5202',
      'server',
      true,
    )
  } finally {
    options.signal?.removeEventListener('abort', cancelRemote)
  }
}
