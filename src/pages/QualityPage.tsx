import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { BrowserPlaybackEvidenceCard } from '../components/evaluation/BrowserPlaybackEvidenceCard'
import { PlaybackSeamEvidenceCard } from '../components/evaluation/PlaybackSeamEvidenceCard'
import { DeviceEvidenceCard } from '../components/evaluation/DeviceEvidenceCard'
import { BenchmarkDashboardCard } from '../components/evaluation/BenchmarkDashboardCard'
import { VoicePresetApprovalCard } from '../components/evaluation/VoicePresetApprovalCard'
import { DeviceSoakRecorderCard } from '../components/evaluation/DeviceSoakRecorderCard'
import { VerificationEvidenceCard } from '../components/evaluation/VerificationEvidenceCard'
import { EvidenceIntakeCard } from '../components/evaluation/EvidenceIntakeCard'
import { LocalExportBundleCard } from '../components/evaluation/LocalExportBundleCard'
import { QualityDiagnosticsCard } from '../components/evaluation/QualityDiagnosticsCard'
import { WorkspacePageScaffold } from '../components/layout/WorkspacePageScaffold'
import { QualityResultCard } from '../components/evaluation/QualityResultCard'
import { TextPreviewCard } from '../components/evaluation/TextPreviewCard'
import {
  compareQualityEngines,
  downloadQualityEvidenceBundle,
  getDeviceBenchmarkSummary,
  getWorkerTelemetrySummary,
  getQualityEvidenceSummary,
  getEvaluationSentences,
  getQualityDiagnostics,
  previewQualityText,
} from '../quality/qualityApi'
import type {
  DeviceBenchmarkSummary,
  WorkerTelemetrySummary,
  QualityEvidenceSummary,
  EvaluationSentence,
  QualityComparison,
  QualityDiagnostics,
  TextPreview,
} from '../quality/qualityTypes'
import { StatusPill } from '../components/ui/StatusPill'
import { exportQualityReviewsCsv, exportQualityReviewsJson } from '../quality/qualityReport'
import { listQualityReviews } from '../quality/qualityReviewRepository'
import {
  buildVoicePresetReviewBundle,
  downloadVoicePresetReviewBundle,
  parseAndImportVoicePresetReviewBundle,
} from '../quality/voicePresetReviewBundle'
import { voiceGenderLabels, voicePresets } from '../tts/voicePresets'

const FALLBACK_SENTENCE: EvaluationSentence = {
  id: 'fallback-basic',
  category: '기본',
  text: '오늘 주문은 총 12건이고 결제 금액은 38,500원입니다.',
  focus: ['숫자', '금액'],
}

export function QualityPage() {
  const [diagnostics, setDiagnostics] = useState<QualityDiagnostics | null>(null)
  const [deviceSummary, setDeviceSummary] = useState<DeviceBenchmarkSummary | null>(null)
  const [workerSummary, setWorkerSummary] = useState<WorkerTelemetrySummary | null>(null)
  const [evidenceSummary, setEvidenceSummary] = useState<QualityEvidenceSummary | null>(null)
  const [sentences, setSentences] = useState<EvaluationSentence[]>([FALLBACK_SENTENCE])
  const [text, setText] = useState(FALLBACK_SENTENCE.text)
  const [selectedEngines, setSelectedEngines] = useState<string[]>([])
  const [selectedVoiceId, setSelectedVoiceId] = useState(voicePresets[0].id)
  const [preview, setPreview] = useState<TextPreview | null>(null)
  const [comparison, setComparison] = useState<QualityComparison | null>(null)
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(true)
  const [loadingDeviceSummary, setLoadingDeviceSummary] = useState(true)
  const [loadingWorkerSummary, setLoadingWorkerSummary] = useState(true)
  const [loadingEvidenceSummary, setLoadingEvidenceSummary] = useState(true)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [reviewSyncNotice, setReviewSyncNotice] = useState<string | null>(null)
  const reviewImportRef = useRef<HTMLInputElement | null>(null)

  const refreshDiagnostics = useCallback(async () => {
    setLoadingDiagnostics(true)
    setError(null)
    try {
      const result = await getQualityDiagnostics()
      setDiagnostics(result)
      const ready = result.engines.filter((engine) => engine.ready && engine.mode !== 'mock').slice(0, 2)
      setSelectedEngines((current) => current.length ? current : ready.map((engine) => engine.engineId))
    } catch (caught) {
      setDiagnostics(null)
      setError(caught instanceof Error ? caught.message : '품질 진단 API에 연결하지 못했습니다.')
    } finally {
      setLoadingDiagnostics(false)
    }
  }, [])


  const refreshDeviceSummary = useCallback(async () => {
    setLoadingDeviceSummary(true)
    try {
      setDeviceSummary(await getDeviceBenchmarkSummary())
    } catch {
      setDeviceSummary(null)
    } finally {
      setLoadingDeviceSummary(false)
    }
  }, [])

  const refreshWorkerSummary = useCallback(async () => {
    setLoadingWorkerSummary(true)
    try {
      setWorkerSummary(await getWorkerTelemetrySummary())
    } catch {
      setWorkerSummary(null)
    } finally {
      setLoadingWorkerSummary(false)
    }
  }, [])

  const refreshEvidenceSummary = useCallback(async () => {
    setLoadingEvidenceSummary(true)
    try {
      setEvidenceSummary(await getQualityEvidenceSummary())
    } catch {
      setEvidenceSummary(null)
    } finally {
      setLoadingEvidenceSummary(false)
    }
  }, [])

  const refreshReviewCount = useCallback(() => {
    void listQualityReviews().then((items) => setReviewCount(items.length)).catch(() => undefined)
  }, [])

  const handleEvidenceDownload = useCallback(async () => {
    setError(null)
    try {
      await downloadQualityEvidenceBundle()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '증거 묶음을 검증하지 못했습니다.')
    }
  }, [])

  useEffect(() => {
    void refreshDiagnostics()
    void refreshDeviceSummary()
    void refreshWorkerSummary()
    void refreshEvidenceSummary()
    refreshReviewCount()
    void getEvaluationSentences().then((items) => {
      if (items.length) {
        setSentences(items)
        setText(items[0].text)
      }
    }).catch(() => undefined)
  }, [refreshDeviceSummary, refreshDiagnostics, refreshEvidenceSummary, refreshReviewCount, refreshWorkerSummary])

  const selectedVoice = useMemo(
    () => voicePresets.find((voice) => voice.id === selectedVoiceId) ?? voicePresets[0],
    [selectedVoiceId],
  )

  const comparableEngines = useMemo(
    () => diagnostics?.engines.filter((engine) => engine.ready && engine.mode !== 'mock') ?? [],
    [diagnostics],
  )

  function toggleEngine(engineId: string) {
    setSelectedEngines((current) => {
      if (current.includes(engineId)) return current.filter((id) => id !== engineId)
      if (current.length >= 2) return [current[1], engineId]
      return [...current, engineId]
    })
  }

  async function handlePreview() {
    if (!text.trim()) return
    setLoadingPreview(true)
    setError(null)
    try {
      setPreview(await previewQualityText(text))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '문장 전처리를 확인하지 못했습니다.')
    } finally {
      setLoadingPreview(false)
    }
  }

  async function exportReviews(format: 'json' | 'csv') {
    const reviews = await listQualityReviews()
    if (!reviews.length) {
      setError('저장된 품질 평가가 없습니다.')
      return
    }
    if (format === 'json') exportQualityReviewsJson(reviews)
    else exportQualityReviewsCsv(reviews)
  }


  async function exportManifestReviewDraft() {
    const reviews = await listQualityReviews()
    if (!reviews.length) {
      setError('저장된 품질 평가가 없습니다.')
      return
    }
    try {
      downloadVoicePresetReviewBundle(await buildVoicePresetReviewBundle(reviews))
      setError(null)
      setReviewSyncNotice('SHA-256가 포함된 manifest 검수 초안을 내려받았습니다. 실제 manifest는 변경되지 않았습니다.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '검수 초안을 내보내지 못했습니다.')
    }
  }

  async function importManifestReviewDraft(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setReviewSyncNotice(null)
    try {
      const result = await parseAndImportVoicePresetReviewBundle(await file.text())
      refreshReviewCount()
      setError(null)
      setReviewSyncNotice(result.migrated
        ? `구형 품질 보고서를 6.8.3 schema로 변환해 ${result.imported}개 로컬 평가로 가져왔습니다.`
        : `검수 묶음 SHA-256를 확인하고 ${result.imported}개 로컬 평가를 병합했습니다.`)
    } catch (caught) {
      setReviewSyncNotice(null)
      setError(caught instanceof Error ? caught.message : '검수 초안을 가져오지 못했습니다.')
    }
  }

  async function handleCompare() {
    if (!text.trim() || !selectedEngines.length) return
    setComparing(true)
    setComparison(null)
    setError(null)
    try {
      const result = await compareQualityEngines({
        text,
        engineIds: selectedEngines,
        voiceId: selectedVoiceId,
        emotion: 'neutral',
        speed: 1,
        pitch: 0,
      })
      setComparison(result)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'A/B 비교를 완료하지 못했습니다.')
    } finally {
      setComparing(false)
    }
  }

  return (
    <WorkspacePageScaffold
      eyebrow="QUALITY LAB · KOREAN FIRST"
      title="한국어 음질 연구소"
      description="같은 문장을 동일 조건으로 생성해 속도·파일 크기·발음·자연스러움을 비교하고, 자동 엔진 우선순위의 근거를 축적합니다."
    >
      <div className="space-y-4">
        <DeviceEvidenceCard
          summary={deviceSummary}
          loading={loadingDeviceSummary}
          onRefresh={() => void refreshDeviceSummary()}
        />

        <BenchmarkDashboardCard
          deviceSummary={deviceSummary}
          workerSummary={workerSummary}
          loading={loadingDeviceSummary || loadingWorkerSummary}
          onRefresh={() => { void refreshDeviceSummary(); void refreshWorkerSummary() }}
        />

        <VoicePresetApprovalCard />

        <DeviceSoakRecorderCard onRecorded={() => void refreshDeviceSummary()} />

        <BrowserPlaybackEvidenceCard />

        <PlaybackSeamEvidenceCard />

        <EvidenceIntakeCard />

        <LocalExportBundleCard />

        <VerificationEvidenceCard
          summary={evidenceSummary}
          loading={loadingEvidenceSummary}
          onRefresh={() => void refreshEvidenceSummary()}
          onDownload={() => void handleEvidenceDownload()}
        />

        <QualityDiagnosticsCard
          diagnostics={diagnostics}
          loading={loadingDiagnostics}
          error={error}
          onRefresh={() => void refreshDiagnostics()}
        />

        <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">EVALUATION SCRIPT</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">평가 문장 선택</h2>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {sentences.map((sentence) => (
              <button
                key={sentence.id}
                type="button"
                onClick={() => { setText(sentence.text); setPreview(null); setComparison(null) }}
                className={`focus-ring min-h-10 shrink-0 rounded-full border px-4 text-xs font-black ${text === sentence.text ? 'border-soa-violet bg-soa-violet text-white' : 'border-soa-line bg-white text-soa-muted'}`}
              >
                {sentence.category}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setText(event.target.value)}
            maxLength={3000}
            className="focus-ring mt-3 min-h-32 w-full resize-y rounded-2xl border border-soa-line bg-white p-4 text-sm font-semibold leading-6"
            aria-label="품질 평가 문장"
          />
          <div className="mt-2 flex justify-between text-[10px] font-bold text-soa-muted"><span>숫자·날짜·영문 혼용 자동 분석</span><span>{text.length}/3000</span></div>
        </section>

        <TextPreviewCard preview={preview} loading={loadingPreview} onPreview={() => void handlePreview()} />

        <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">PRESET A / B REVIEW</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">검수할 인물 프리셋</h2>
          <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
            동일 문장과 동일 엔진 조건으로 프리셋을 바꿔 들으며 인물 구분·선언 성별·발음·속도를 기록합니다.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {voicePresets.map((voice) => {
              const active = selectedVoiceId === voice.id
              return (
                <button
                  key={voice.id}
                  type="button"
                  onClick={() => { setSelectedVoiceId(voice.id); setComparison(null) }}
                  className={`focus-ring min-h-16 rounded-2xl border px-4 text-left ${active ? 'border-soa-violet bg-soa-violet text-white' : 'border-soa-line bg-white'}`}
                >
                  <strong className="block text-sm">{voice.name} · {voiceGenderLabels[voice.gender]}</strong>
                  <span className={`mt-1 block text-[10px] font-bold ${active ? 'text-white/70' : 'text-soa-muted'}`}>
                    {voice.id} · {voice.description}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">A / B ENGINE</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">비교할 엔진</h2>
          <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">최대 두 개를 선택합니다. 동일한 전처리와 설정으로 순서대로 생성합니다.</p>
          <div className="mt-3 space-y-2">
            {comparableEngines.length ? comparableEngines.map((engine) => {
              const active = selectedEngines.includes(engine.engineId)
              return (
                <button key={engine.engineId} type="button" onClick={() => toggleEngine(engine.engineId)} className={`focus-ring flex min-h-14 w-full items-center justify-between rounded-2xl border px-4 text-left ${active ? 'border-soa-ink bg-soa-ink text-white' : 'border-soa-line bg-white'}`}>
                  <span><strong className="block text-sm">{engine.name}</strong><span className={`text-[10px] font-bold ${active ? 'text-white/60' : 'text-soa-muted'}`}>{engine.provider}</span></span>
                  <span className="text-lg font-black" aria-hidden="true">{active ? '✓' : '+'}</span>
                </button>
              )
            }) : <p className="rounded-2xl bg-[#f4f2ec] p-4 text-sm font-semibold leading-6 text-soa-muted">실제 비교 엔진이 없습니다. 로컬 FastAPI에서 MeloTTS 또는 한국어 시스템 음성을 준비해 주세요.</p>}
          </div>
          <button type="button" onClick={() => void handleCompare()} disabled={comparing || !selectedEngines.length || !text.trim()} className="focus-ring mt-4 min-h-14 w-full rounded-2xl bg-soa-lime px-5 font-black disabled:opacity-45">
            {comparing ? '두 음성을 비교 생성 중…' : 'A/B 비교 시작'}
          </button>
        </section>

        {error ? <p className="rounded-2xl border border-soa-coral/40 bg-soa-coral/10 p-4 text-sm font-bold leading-6 text-soa-ink">{error}</p> : null}

        {comparison ? (
          <section className="soa-quality-results">
            <div className="soa-section-heading"><span>COMPARISON RESULT</span><h2>청취 결과</h2></div>
            <div className="space-y-3">{comparison.results.map((result) => (
              <QualityResultCard
                key={`${selectedVoice.id}-${result.engineId}`}
                result={result}
                sentence={text}
                voiceId={selectedVoice.id}
                voiceName={selectedVoice.name}
                voiceGender={selectedVoice.gender}
                onSaved={refreshReviewCount}
              />
            ))}</div>
          </section>
        ) : null}

        <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">QUALITY REPORT</span>
          <div className="mt-1 flex items-center justify-between gap-3"><h2 className="text-xl font-black tracking-[-0.05em]">저장된 평가 {reviewCount}개</h2><StatusPill label="LOCAL ONLY" /></div>
          <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">평가 기록은 이 기기에만 저장됩니다. 모델 비교와 인수인계에 쓸 수 있도록 보고서로 내보냅니다.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => void exportReviews('json')} className="focus-ring min-h-11 rounded-2xl border border-soa-line bg-white text-xs font-black">일반 JSON</button>
            <button type="button" onClick={() => void exportReviews('csv')} className="focus-ring min-h-11 rounded-2xl border border-soa-line bg-white text-xs font-black">CSV</button>
            <button type="button" onClick={() => void exportManifestReviewDraft()} className="focus-ring min-h-11 rounded-2xl bg-soa-ink text-xs font-black text-white">manifest 검수 초안</button>
            <button type="button" onClick={() => reviewImportRef.current?.click()} className="focus-ring min-h-11 rounded-2xl bg-soa-lime text-xs font-black">검수 초안 가져오기</button>
          </div>
          <input ref={reviewImportRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void importManifestReviewDraft(event)} />
          <p className="mt-2 text-[10px] font-semibold leading-5 text-soa-muted">가져오기는 로컬 평가 기록만 병합합니다. manifest의 approved·검수자·WAV SHA-256는 자동 변경하지 않습니다.</p>
          {reviewSyncNotice ? <p className="mt-2 rounded-2xl border border-soa-lime/50 bg-soa-lime/10 p-3 text-[11px] font-bold leading-5 text-soa-ink">{reviewSyncNotice}</p> : null}
        </section>
      </div>
    </WorkspacePageScaffold>
  )
}
