import { useEffect, useMemo, useState } from 'react'
import { CloneConsentCard } from '../components/clone/CloneConsentCard'
import { CloneReadyCard } from '../components/clone/CloneReadyCard'
import { CloneStepIndicator } from '../components/clone/CloneStepIndicator'
import { SampleQualityCard } from '../components/clone/SampleQualityCard'
import { VoiceSampleCapture } from '../components/clone/VoiceSampleCapture'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { useAppStore } from '../store/useAppStore'
import { usePlayerStore } from '../store/usePlayerStore'
import { analyzeAudioFile } from '../voiceclone/audioAnalysis'
import { deleteVoiceProfile, saveVoiceProfile } from '../voiceclone/profileRepository'
import {
  deleteRemoteVoiceCloneProfile,
  getVoiceCloneCapability,
  prepareVoiceCloneProfile,
  type VoiceCloneCapability,
} from '../voiceclone/voiceCloneApi'
import type {
  VoiceCloneConsent,
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
    id: crypto.randomUUID(),
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
    message: '샘플과 동의 기록을 이 기기에 저장했습니다. CosyVoice Worker 연결 후 실제 복제를 시작할 수 있습니다.',
  }
}

export function VoiceClonePage() {
  const recorder = useVoiceRecorder()
  const showNotice = useAppStore((state) => state.showNotice)
  const enqueue = usePlayerStore((state) => state.enqueue)
  const [analysis, setAnalysis] = useState<VoiceSampleAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [displayName, setDisplayName] = useState('내 SoriON 목소리')
  const [consent, setConsent] = useState<VoiceCloneConsent>(initialConsent)
  const [profile, setProfile] = useState<VoiceCloneProfile | null>(null)
  const [capability, setCapability] = useState<VoiceCloneCapability | null>(null)
  const [submitting, setSubmitting] = useState(false)
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
    void getVoiceCloneCapability().then(setCapability).catch(() => undefined)
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

  const engineLabel = useMemo(() => {
    if (!capability) return 'CosyVoice Worker 확인 중'
    return capability.ready
      ? `${capability.engineName} 준비됨`
      : `${capability.engineName} 연결 대기`
  }, [capability])

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

  async function handleDelete() {
    if (!profile) return
    await deleteVoiceProfile(profile.id).catch(() => undefined)
    await deleteRemoteVoiceCloneProfile(profile.id).catch(() => undefined)
    setProfile(null)
    recorder.reset()
    setAnalysis(null)
    setConsent(initialConsent)
    showNotice('동의를 철회하고 저장된 음성 샘플을 삭제했습니다.')
  }

  return (
    <div className="soa-clone-page">
      <header className="soa-page-intro">
        <span>VOICE CLONE · LOCAL FIRST</span>
        <h1>내 목소리를<br /><b>10초 안에 준비합니다.</b></h1>
        <p>녹음과 품질 검사는 휴대폰에서 먼저 처리하고, 동의가 확인된 샘플만 복제 엔진에 전달합니다.</p>
        <small>{engineLabel}</small>
      </header>
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
      </div>
    </div>
  )
}
