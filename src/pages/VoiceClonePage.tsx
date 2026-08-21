import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/httpClient'
import { CloneConsentCard } from '../components/clone/CloneConsentCard'
import { CloneExecutionCard } from '../components/clone/CloneExecutionCard'
import { CloneReadyCard } from '../components/clone/CloneReadyCard'
import { MyVoiceLibrary } from '../components/clone/MyVoiceLibrary'
import { CloneStepIndicator } from '../components/clone/CloneStepIndicator'
import { SampleQualityCard } from '../components/clone/SampleQualityCard'
import { VoiceSampleCapture } from '../components/clone/VoiceSampleCapture'
import { WorkspacePageScaffold } from '../components/layout/WorkspacePageScaffold'
import { useMyVoiceProfiles } from '../hooks/useMyVoiceProfiles'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { useAppStore } from '../store/useAppStore'
import { usePlayerStore } from '../store/usePlayerStore'
import { analyzeAudioFile } from '../voiceclone/audioAnalysis'
import { deleteVoiceProfile, saveVoiceProfile } from '../voiceclone/profileRepository'
import { createRandomId } from '../utils/randomId'
import {
  cancelVoiceCloneJob,
  deleteRemoteVoiceCloneProfile,
  getVoiceCloneCapabilityCached,
  prepareVoiceCloneProfile,
  retryVoiceCloneJob,
  startVoiceCloneJob,
  type VoiceCloneCapability,
} from '../voiceclone/voiceCloneApi'
import { watchVoiceCloneJob } from '../voiceclone/voiceCloneSynthesis'
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
    remoteProfileId: null,
    remoteSynced: false,
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

const DEFINITE_LOCAL_FALLBACK_KINDS = new Set([
  'unconfigured',
  'offline',
  'mixed-content',
  'mobile-localhost',
])
const UNCERTAIN_REMOTE_KINDS = new Set(['timeout', 'cors-or-network'])

function localFallbackMode(error: unknown): 'local-only' | 'remote-unknown' | null {
  if (!(error instanceof ApiError)) return null
  if (DEFINITE_LOCAL_FALLBACK_KINDS.has(error.kind)) return 'local-only'
  if (UNCERTAIN_REMOTE_KINDS.has(error.kind)) return 'remote-unknown'
  return null
}

export function VoiceClonePage() {
  const recorder = useVoiceRecorder()
  const { profiles, loading: profilesLoading } = useMyVoiceProfiles()
  const showNotice = useAppStore((state) => state.showNotice)
  const enqueue = usePlayerStore((state) => state.enqueue)
  const enqueuedJobId = useRef<string | null>(null)
  const activeJobRef = useRef<VoiceCloneJob | null>(null)
  const [analysis, setAnalysis] = useState<VoiceSampleAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [displayName, setDisplayName] = useState('내 SoriON 목소리')
  const [consent, setConsent] = useState<VoiceCloneConsent>(initialConsent)
  const [profile, setProfile] = useState<VoiceCloneProfile | null>(null)
  const [capability, setCapability] = useState<VoiceCloneCapability | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [syncingProfile, setSyncingProfile] = useState(false)
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
    let active = true
    const refresh = (force = false) => {
      void getVoiceCloneCapabilityCached({ force })
        .then((result) => { if (active) setCapability(result) })
        .catch(() => { if (active) setCapability(null) })
    }
    refresh()
    const refreshNow = () => refresh(true)
    window.addEventListener('focus', refreshNow)
    window.addEventListener('online', refreshNow)
    return () => {
      active = false
      window.removeEventListener('focus', refreshNow)
      window.removeEventListener('online', refreshNow)
    }
  }, [])

  useEffect(() => {
    setProfile((current) => {
      if (!current) return current
      return profiles.find((candidate) => candidate.id === current.id) ?? current
    })
  }, [profiles])

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
    activeJobRef.current = job
  }, [job])

  useEffect(() => {
    const activeJob = activeJobRef.current
    if (!activeJob || !activeJobId || !activeJobStatus) return undefined
    if (activeJob.id !== activeJobId || !['queued', 'running'].includes(activeJobStatus)) return undefined
    const controller = new AbortController()
    let active = true
    void watchVoiceCloneJob(activeJob, controller.signal, (progress) => {
      if (!active) return
      setJob((current) => current && current.id === progress.jobId
        ? {
            ...current,
            status: ['completed', 'failed', 'cancelled'].includes(progress.status) ? current.status : progress.status,
            progress: progress.progress,
            phase: progress.phase,
            message: progress.message,
            firstAudioMs: progress.firstAudioMs,
          }
        : current)
    }).then((nextJob) => {
      if (active) setJob(nextJob)
    }).catch((error) => {
      if (active && !controller.signal.aborted) setJobError(errorMessage(error))
    })
    return () => {
      active = false
      controller.abort()
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


  function selectSavedProfile(nextProfile: VoiceCloneProfile) {
    setProfile(nextProfile)
    setDisplayName(nextProfile.displayName)
    setAnalysis(nextProfile.analysis)
    setConsent(nextProfile.consent)
    setJob(null)
    setJobError(null)
    enqueuedJobId.current = null
    showNotice(`${nextProfile.displayName} 프로필을 불러왔습니다. 바로 내 목소리 테스트를 만들 수 있습니다.`)
  }

  function startNewProfile() {
    setProfile(null)
    setJob(null)
    setJobError(null)
    recorder.reset()
    setAnalysis(null)
    setConsent(initialConsent)
    setDisplayName('내 SoriON 목소리')
  }

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
        profileId: nextProfile.id,
        displayName: displayName.trim(),
        consent: completedConsent,
        analysis,
      })
      nextProfile = {
        ...nextProfile,
        remoteProfileId: remote.id,
        remoteSynced: true,
        status: remote.status,
        engineId: remote.engineId,
        analysis: remote.serverAnalysis ?? nextProfile.analysis,
        updatedAt: remote.createdAt,
        message: remote.message,
      }
    } catch (error) {
      const fallbackMode = localFallbackMode(error)
      if (!fallbackMode) {
        showNotice(errorMessage(error))
        setSubmitting(false)
        return
      }
      nextProfile.remoteSynced = fallbackMode === 'remote-unknown' ? null : false
      nextProfile.message = fallbackMode === 'remote-unknown'
        ? '서버 응답이 끊겨 등록 여부를 확정하지 못했습니다. 연결이 회복되면 같은 프로필 ID로 자동 확인합니다.'
        : '서버에 연결하지 못해 샘플과 동의 기록만 이 기기에 저장했습니다. 서버 연결 후 직접 다시 준비할 수 있습니다.'
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

  async function handleResync() {
    if (!profile || profile.remoteSynced === true || syncingProfile) return
    setSyncingProfile(true)
    try {
      const file = new File([profile.sampleBlob], profile.fileName, { type: profile.mimeType })
      const remote = await prepareVoiceCloneProfile({
        file,
        profileId: profile.id,
        displayName: profile.displayName,
        consent: profile.consent,
        analysis: profile.analysis,
      })
      const nextProfile: VoiceCloneProfile = {
        ...profile,
        remoteProfileId: remote.id,
        remoteSynced: true,
        status: remote.status,
        engineId: remote.engineId,
        analysis: remote.serverAnalysis ?? profile.analysis,
        updatedAt: new Date().toISOString(),
        message: remote.message,
      }
      await saveVoiceProfile(nextProfile)
      setProfile(nextProfile)
      showNotice('서버 재검증까지 완료해 실제 생성용 내 목소리를 준비했습니다.')
    } catch (error) {
      showNotice(errorMessage(error))
    } finally {
      setSyncingProfile(false)
    }
  }

  async function handleStart(text: string) {
    if (!profile || !capability?.ready) return
    setJobBusy(true)
    setJobError(null)
    try {
      const remoteId = profile.remoteProfileId ?? (profile.remoteSynced === false ? null : profile.id)
      if (!remoteId) throw new Error('서버에 다시 준비한 뒤 실제 목소리를 생성할 수 있습니다.')
      const nextJob = await startVoiceCloneJob(remoteId, text)
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
    const remoteId = profile.remoteProfileId ?? (profile.remoteSynced === false ? null : profile.id)
    if (remoteId) {
      try {
        await deleteRemoteVoiceCloneProfile(remoteId)
      } catch (error) {
        showNotice(`서버 샘플 삭제를 확인하지 못했습니다. 연결을 확인한 뒤 다시 삭제해 주세요. ${errorMessage(error)}`)
        return
      }
    }
    try {
      await deleteVoiceProfile(profile.id)
    } catch {
      showNotice('서버 샘플은 삭제했지만 이 기기의 사본을 지우지 못했습니다. 브라우저 저장소를 확인해 주세요.')
      return
    }
    setProfile(null)
    setJob(null)
    setJobError(null)
    recorder.reset()
    setAnalysis(null)
    setConsent(initialConsent)
    showNotice('동의를 철회하고 서버와 이 기기의 음성 샘플 삭제를 확인했습니다.')
  }

  return (
    <WorkspacePageScaffold
      eyebrow="VOICE CLONE · CONSENT FIRST"
      title="내 목소리 복제"
      description="동의된 샘플만 안전한 음성 제작 과정에 사용합니다. 문장별 생성 상태와 취소·재시도를 실시간으로 관리합니다."
      className="soa-clone-page"
    >
      <MyVoiceLibrary
        profiles={profiles}
        selectedId={profile?.id ?? null}
        loading={profilesLoading}
        onSelect={selectSavedProfile}
        onCreate={startNewProfile}
      />
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
        {profile ? (
          <CloneReadyCard
            profile={profile}
            syncing={syncingProfile}
            onSync={() => void handleResync()}
            onDelete={() => void handleDelete()}
          />
        ) : null}
        {profile ? (
          <CloneExecutionCard
            profileName={profile.displayName}
            ready={Boolean(
              capability?.ready
              && profile.status === 'engine-ready'
              && profile.remoteSynced !== false
              && profile.remoteSynced !== null
            )}
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
