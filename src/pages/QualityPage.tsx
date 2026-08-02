import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { DeviceEvidenceCard } from '../components/evaluation/DeviceEvidenceCard'
import { QualityDiagnosticsCard } from '../components/evaluation/QualityDiagnosticsCard'
import { WorkspacePageScaffold } from '../components/layout/WorkspacePageScaffold'
import { QualityResultCard } from '../components/evaluation/QualityResultCard'
import { TextPreviewCard } from '../components/evaluation/TextPreviewCard'
import {
  compareQualityEngines,
  getDeviceBenchmarkSummary,
  getEvaluationSentences,
  getQualityDiagnostics,
  previewQualityText,
} from '../quality/qualityApi'
import type {
  DeviceBenchmarkSummary,
  EvaluationSentence,
  QualityComparison,
  QualityDiagnostics,
  TextPreview,
} from '../quality/qualityTypes'
import { StatusPill } from '../components/ui/StatusPill'
import { exportQualityReviewsCsv, exportQualityReviewsJson } from '../quality/qualityReport'
import { listQualityReviews } from '../quality/qualityReviewRepository'

const FALLBACK_SENTENCE: EvaluationSentence = {
  id: 'fallback-basic',
  category: '기본',
  text: '오늘 주문은 총 12건이고 결제 금액은 38,500원입니다.',
  focus: ['숫자', '금액'],
}

export function QualityPage() {
  const [diagnostics, setDiagnostics] = useState<QualityDiagnostics | null>(null)
  const [deviceSummary, setDeviceSummary] = useState<DeviceBenchmarkSummary | null>(null)
  const [sentences, setSentences] = useState<EvaluationSentence[]>([FALLBACK_SENTENCE])
  const [text, setText] = useState(FALLBACK_SENTENCE.text)
  const [selectedEngines, setSelectedEngines] = useState<string[]>([])
  const [preview, setPreview] = useState<TextPreview | null>(null)
  const [comparison, setComparison] = useState<QualityComparison | null>(null)
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(true)
  const [loadingDeviceSummary, setLoadingDeviceSummary] = useState(true)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviewCount, setReviewCount] = useState(0)

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

  const refreshReviewCount = useCallback(() => {
    void listQualityReviews().then((items) => setReviewCount(items.length)).catch(() => undefined)
  }, [])

  useEffect(() => {
    void refreshDiagnostics()
    void refreshDeviceSummary()
    refreshReviewCount()
    void getEvaluationSentences().then((items) => {
      if (items.length) {
        setSentences(items)
        setText(items[0].text)
      }
    }).catch(() => undefined)
  }, [refreshDeviceSummary, refreshDiagnostics, refreshReviewCount])

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

  async function handleCompare() {
    if (!text.trim() || !selectedEngines.length) return
    setComparing(true)
    setComparison(null)
    setError(null)
    try {
      const result = await compareQualityEngines({
        text,
        engineIds: selectedEngines,
        voiceId: 'sori-warm',
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
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">A / B VOICE</span>
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
            <div className="space-y-3">{comparison.results.map((result) => <QualityResultCard key={result.engineId} result={result} sentence={text} onSaved={refreshReviewCount} />)}</div>
          </section>
        ) : null}

        <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">QUALITY REPORT</span>
          <div className="mt-1 flex items-center justify-between gap-3"><h2 className="text-xl font-black tracking-[-0.05em]">저장된 평가 {reviewCount}개</h2><StatusPill label="LOCAL ONLY" /></div>
          <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">평가 기록은 이 기기에만 저장됩니다. 모델 비교와 인수인계에 쓸 수 있도록 보고서로 내보냅니다.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => void exportReviews('json')} className="focus-ring min-h-11 rounded-2xl border border-soa-line bg-white text-xs font-black">JSON 내보내기</button>
            <button type="button" onClick={() => void exportReviews('csv')} className="focus-ring min-h-11 rounded-2xl bg-soa-ink text-xs font-black text-white">CSV 내보내기</button>
          </div>
        </section>
      </div>
    </WorkspacePageScaffold>
  )
}
