import { useEffect, useRef, useState } from 'react'
import { CloneConsentCard } from '../components/clone/CloneConsentCard'
import { CloneExecutionCard } from '../components/clone/CloneExecutionCard'
import { CloneReadyCard } from '../components/clone/CloneReadyCard'
import { CloneStepIndicator } from '../components/clone/CloneStepIndicator'
import { SampleQualityCard } from '../components/clone/SampleQualityCard'
import { VoiceSampleCapture } from '../components/clone/VoiceSampleCapture'
import { WorkspacePageScaffold } from '../components/layout/WorkspacePageScaffold'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { useAppStore } from '../store/useAppStore'
import { usePlayerStore } from '../store/usePlayerStore'
import { analyzeAudioFile } from '../voiceclone/audioAnalysis'
import { deleteVoiceProfile, saveVoiceProfile } from '../voiceclone/profileRepository'
import { createRandomId } from '../utils/randomId'
import {
  cancelVoiceCloneJob,
  deleteRemoteVoiceCloneProfile,
  getVoiceCloneCapability,
  getVoiceCloneJob,
  prepareVoiceCloneProfile,
  retryVoiceCloneJob,
  startVoiceCloneJob,
  type VoiceCloneCapability,
} from '../voiceclone/voiceCloneApi'
import type {
  VoiceCloneConsent,
  VoiceCloneJob,
  VoiceCloneProfile,
  VoiceSampleAnalysis,
} from '../voiceclone/voiceCloneTypes'

const initialConsent: VoiceCloneConsent = {
  rightsConfirmed: false,
  disclosureConfirmed: false,
  prohibitedUseConfirmed: false,
  consentedAt: '',
  allowedPurpose: 'personal',
}

function localProfile(input: {
  file: File
  displayName: string
  analysis: VoiceSampleAnalysis
  consent: VoiceCloneConsent
}): VoiceCloneProfile {
  const now = new Date().toISOString()
  return {
    id: createRandomId(),
    displayName: input.displayName,
    status: 'engine-unavailable',
    engineId: 'cosyvoice3-worker',
    fileName: input.file.name,
    mimeType: input.file.type,
    sampleBlob: input.file,
    analysis: input.analysis,
    consent: input.consent,
    createdAt: now,
    updatedAt: now,
    message: '샘플과 동의 기록을 이 기기에 저장했습니다. 준비가 완료되면 실제 복제를 바로 시작할 수 있습니다.',
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '음성 복제 요청을 처리하지 못했습니다.'
}

export function VoiceClonePage() {
  const recorder = useVoiceRecorder()
  const showNotice = useAppStore((state) => state.showNotice)
  const enqueue = usePlayerStore((state) => state.enqueue)
  const enqueuedJobId = useRef<string | null>(null)
  const [analysis, setAnalysis] = useState<VoiceSampleAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [displayName, setDisplayName] = useState('내 SoriON 목소리')
  const [consent, setConsent] = useState<VoiceCloneConsent>(initialConsent)
  const [profile, setProfile] = useState<VoiceCloneProfile | null>(null)
  const [capability, setCapability] = useState<VoiceCloneCapability | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [job, setJob] = useState<VoiceCloneJob | null>(null)
  const activeJobId = job?.id ?? null
  const activeJobStatus = job?.status ?? null
  const [jobBusy, setJobBusy] = useState(false)
  const [jobError, setJobError] = useState<string | null>(null)
  const currentStep = profile ? 3 : analysis ? 2 : 1
  const consentReady = consent.rightsConfirmed
    && consent.disclosureConfirmed
    && consent.prohibitedUseConfirmed
  const canSubmit = Boolean(
    recorder.file
    && analysis
    && analysis.status !== 'blocked'
    && consentReady
    && displayName.trim()
    && !submitting,
  )

  useEffect(() => {
    void getVoiceCloneCapability()
      .then((result) => {
        setCapability(result)
      })
      .catch(() => setCapability(null))
  }, [])

  useEffect(() => {
    const file = recorder.file
    if (!file) {
      setAnalysis(null)
      return
    }
    let active = true
    setAnalyzing(true)
    void analyzeAudioFile(file)
      .then((result) => { if (active) setAnalysis(result) })
      .catch(() => {
        if (!active) return
        setAnalysis({
          durationSeconds: 0,
          sampleRate: null,
          channelCount: null,
          rmsDb: null,
          silenceRatio: null,
          clippingRatio: null,
          status: 'blocked',
          messages: ['브라우저에서 파형을 해석하지 못했습니다. 다른 형식으로 변환하거나 다시 녹음해 주세요.'],
        })
      })
      .finally(() => { if (active) setAnalyzing(false) })
    return () => { active = false }
  }, [recorder.file])

  useEffect(() => {
    if (!activeJobId || !activeJobStatus) return undefined
    if (!['queued', 'running'].includes(activeJobStatus)) return undefined
    let active = true
    const timer = window.setInterval(() => {
      void getVoiceCloneJob(activeJobId)
        .then((nextJob) => {
          if (active) setJob(nextJob)
        })
        .catch((error) => {
          if (active) setJobError(errorMessage(error))
        })
    }, 750)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [activeJobId, activeJobStatus])

  useEffect(() => {
    if (!job || job.status !== 'completed' || !job.audioUrl) return
    if (enqueuedJobId.current === job.id) return
    enqueuedJobId.current = job.id
    enqueue({
      url: job.audioUrl,
      filename: `sorion-clone-${job.id}.wav`,
      source: 'api',
      durationSeconds: job.durationSeconds ?? 0,
      result: {
        jobId: job.id,
        status: 'completed',
        engineId: 'cosyvoice3-worker',
        engineMode: 'ai',
        audioUrl: job.audioUrl,
        estimatedDurationSeconds: job.durationSeconds ?? 0,
        message: job.message,
        normalizedText: job.text,
        segmentCount: job.segments.length,
        processingMs: null,
        fileSizeBytes: null,
        realtimeFactor: null,
      },
    }, `${profile?.displayName ?? 'SoriON 복제 목소리'} · 생성 결과`)
    showNotice('복제 음성을 완성해 하단 플레이어에 연결했습니다.')
  }, [enqueue, job, profile?.displayName, showNotice])



  async function handlePrepare() {
    if (!recorder.file || !analysis || !canSubmit) return
    setSubmitting(true)
    const completedConsent = { ...consent, consentedAt: new Date().toISOString() }
    let nextProfile = localProfile({
      file: recorder.file,
      displayName: displayName.trim(),
      analysis,
      consent: completedConsent,
    })

    try {
      const remote = await prepareVoiceCloneProfile({
        file: recorder.file,
        displayName: displayName.trim(),
        consent: completedConsent,
        analysis,
      })
      nextProfile = {
        ...nextProfile,
        id: remote.id,
        status: remote.status,
        engineId: remote.engine_id,
        createdAt: remote.created_at,
        updatedAt: remote.created_at,
        message: remote.message,
      }
    } catch {
      // 공개 Pages와 오프라인 환경에서는 로컬 우선 프로필을 만든다.
    }

    try {
      await saveVoiceProfile(nextProfile)
      setProfile(nextProfile)
      const sampleUrl = URL.createObjectURL(recorder.file)
      enqueue({
        url: sampleUrl,
        filename: recorder.file.name,
        source: 'browser-demo',
        durationSeconds: analysis.durationSeconds,
        revokeOnRemove: true,
        result: {
          jobId: nextProfile.id,
          status: 'completed',
          engineId: 'voice-sample-local',
          engineMode: 'local',
          audioUrl: null,
          estimatedDurationSeconds: analysis.durationSeconds,
          message: '복제 전 원본 샘플입니다.',
          normalizedText: null,
          segmentCount: 1,
          processingMs: null,
          fileSizeBytes: recorder.file.size,
          realtimeFactor: null,
        },
      }, `${nextProfile.displayName} · 원본 샘플`)
      showNotice('목소리 샘플과 동의 기록을 안전하게 준비했습니다.')
    } catch {
      showNotice('목소리 샘플을 기기에 저장하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStart(text: string) {
    if (!profile || !capability?.ready) return
    setJobBusy(true)
    setJobError(null)
    try {
      const nextJob = await startVoiceCloneJob(profile.id, text)
      enqueuedJobId.current = null
      setJob(nextJob)
    } catch (error) {
      setJobError(errorMessage(error))
    } finally {
      setJobBusy(false)
    }
  }

  async function handleCancel() {
    if (!job) return
    setJobBusy(true)
    try {
      setJob(await cancelVoiceCloneJob(job.id))
    } catch (error) {
      setJobError(errorMessage(error))
    } finally {
      setJobBusy(false)
    }
  }

  async function handleRetry() {
    if (!job) return
    setJobBusy(true)
    setJobError(null)
    try {
      setJob(await retryVoiceCloneJob(job.id))
    } catch (error) {
      setJobError(errorMessage(error))
    } finally {
      setJobBusy(false)
    }
  }

  async function handleDelete() {
    if (!profile) return
    await deleteVoiceProfile(profile.id).catch(() => undefined)
    await deleteRemoteVoiceCloneProfile(profile.id).catch(() => undefined)
    setProfile(null)
    setJob(null)
    setJobError(null)
    recorder.reset()
    setAnalysis(null)
    setConsent(initialConsent)
    showNotice('동의를 철회하고 저장된 음성 샘플을 삭제했습니다.')
  }

  return (
    <WorkspacePageScaffold
      eyebrow="VOICE CLONE · CONSENT FIRST"
      title="내 목소리 복제"
      description="동의된 샘플만 안전한 음성 제작 과정에 사용합니다. 문장별 생성 상태와 취소·재시도를 실시간으로 관리합니다."
      className="soa-clone-page"
    >
      <CloneStepIndicator current={currentStep} />
      <div className="soa-clone-grid">
        <VoiceSampleCapture
          file={recorder.file}
          recording={recorder.recording}
          seconds={recorder.seconds}
          error={recorder.error}
          onStart={() => void recorder.start()}
          onStop={recorder.stop}
          onReset={recorder.reset}
          onFile={recorder.setFile}
        />
        <SampleQualityCard analysis={analysis} analyzing={analyzing} />
        <CloneConsentCard
          displayName={displayName}
          consent={consent}
          disabled={!canSubmit}
          onDisplayName={setDisplayName}
          onConsent={setConsent}
          onSubmit={() => void handlePrepare()}
        />
        {profile ? <CloneReadyCard profile={profile} onDelete={() => void handleDelete()} /> : null}
        {profile ? (
          <CloneExecutionCard
            profileName={profile.displayName}
            ready={Boolean(capability?.ready && profile.status === 'engine-ready')}
            job={job}
            busy={jobBusy}
            error={jobError}
            onStart={(text) => void handleStart(text)}
            onCancel={() => void handleCancel()}
            onRetry={() => void handleRetry()}
          />
        ) : null}
      </div>
    </WorkspacePageScaffold>
  )
}
