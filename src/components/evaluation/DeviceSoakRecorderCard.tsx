import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { usePlayerStore } from '../../store/usePlayerStore'
import { voicePresets } from '../../tts/voicePresets'
import {
  downloadDeviceSoakRecord,
  elapsedSoakSeconds,
  loadDeviceSoakSession,
  saveDeviceSoakSession,
  summarizeSeams,
  type DeviceSoakSession,
} from '../../quality/deviceSoakRecorder'
import { loadBrowserPlaybackEvidence } from '../../quality/browserPlaybackEvidence'
import { recordDeviceSoak } from '../../quality/qualityApi'
import type { DeviceCertificationScenario, DeviceSoakRecordInput, DeviceSoakRecordResult } from '../../quality/qualityTypes'
import { StatusPill } from '../ui/StatusPill'

const scenarioLabels: Record<DeviceCertificationScenario, string> = {
  baseline: '기본 재생',
  'network-switch': '네트워크 전환',
  'background-resume': '백그라운드 복귀',
  'installed-pwa': '설치형 PWA',
}

function nullableNumber(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remain = seconds % 60
  return `${minutes}:${remain.toString().padStart(2, '0')}`
}

function recoveryValue(value: string): boolean | null {
  if (value === 'passed') return true
  if (value === 'failed') return false
  return null
}

export function DeviceSoakRecorderCard({ onRecorded }: { onRecorded: () => void }) {
  const queue = usePlayerStore((state) => state.queue)
  const seamSummary = useMemo(() => summarizeSeams(queue.flatMap((track) => track.audio.telemetry?.seams ?? [])), [queue])
  const browserEvidence = useMemo(() => loadBrowserPlaybackEvidence(), [])
  const [session, setSession] = useState<DeviceSoakSession | null>(() => loadDeviceSoakSession())
  const [elapsedSeconds, setElapsedSeconds] = useState(() => session ? elapsedSoakSeconds(session) : 0)
  const [deviceProfile, setDeviceProfile] = useState<'android' | 'ios'>(() => session?.deviceProfile ?? (browserEvidence?.deviceProfile === 'ios-safari' ? 'ios' : 'android'))
  const [deviceName, setDeviceName] = useState(() => browserEvidence ? `${browserEvidence.browserName} 실기기` : '모바일 실기기')
  const [engineId, setEngineId] = useState('cosyvoice3')
  const [modelId, setModelId] = useState('cosyvoice3-local')
  const [modelVersion, setModelVersion] = useState('unknown')
  const [presetId, setPresetId] = useState('sori-warm')
  const [sampleMinutes, setSampleMinutes] = useState<10 | 30 | 60>(() => session?.sampleMinutes ?? 10)
  const [scenario, setScenario] = useState<DeviceCertificationScenario>(() => session?.scenario ?? 'baseline')
  const [firstAudioMs, setFirstAudioMs] = useState('')
  const [processingSeconds, setProcessingSeconds] = useState('')
  const [audioDurationSeconds, setAudioDurationSeconds] = useState('')
  const [sseState, setSseState] = useState('unverified')
  const [fetchState, setFetchState] = useState('unverified')
  const [sseReconnectMs, setSseReconnectMs] = useState('')
  const [audioFetchRecoveryMs, setAudioFetchRecoveryMs] = useState('')
  const [playbackInterruptionMs, setPlaybackInterruptionMs] = useState('')
  const [finalHandoffErrorMs, setFinalHandoffErrorMs] = useState('')
  const [playbackCompleted, setPlaybackCompleted] = useState(true)
  const [succeeded, setSucceeded] = useState(true)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<DeviceSoakRecordResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    const update = () => setElapsedSeconds(elapsedSoakSeconds(session))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [session])

  function startSession() {
    const next: DeviceSoakSession = {
      schemaVersion: 1,
      startedAt: new Date().toISOString(),
      sampleMinutes,
      deviceProfile,
      scenario,
    }
    saveDeviceSoakSession(next)
    setSession(next)
    setElapsedSeconds(0)
    setResult(null)
  }

  function stopSession() {
    const seconds = session ? elapsedSoakSeconds(session) : elapsedSeconds
    setElapsedSeconds(seconds)
    if (!processingSeconds) setProcessingSeconds(String(Math.max(1, seconds)))
    if (!audioDurationSeconds) setAudioDurationSeconds(String(Math.max(1, seconds)))
    saveDeviceSoakSession(null)
    setSession(null)
  }

  function buildRecord(): DeviceSoakRecordInput {
    return {
      deviceProfile,
      deviceName: deviceName.trim() || '모바일 실기기',
      engineId: engineId.trim() || 'cosyvoice3',
      modelId: modelId.trim() || 'unknown',
      modelVersion: modelVersion.trim() || 'unknown',
      presetId,
      sampleMinutes,
      soakElapsedSeconds: elapsedSeconds || null,
      scenario,
      browserVersion: browserEvidence?.browserName ?? '',
      firstAudioMs: nullableNumber(firstAudioMs),
      processingSeconds: Math.max(0.1, Number(processingSeconds) || elapsedSeconds || 1),
      audioDurationSeconds: Math.max(0.1, Number(audioDurationSeconds) || elapsedSeconds || 1),
      retryCount: 0,
      failureCount: succeeded ? 0 : 1,
      playbackCompleted,
      sseReconnected: recoveryValue(sseState),
      audioFetchRecovered: recoveryValue(fetchState),
      sseReconnectMs: nullableNumber(sseReconnectMs),
      audioFetchRecoveryMs: nullableNumber(audioFetchRecoveryMs),
      playbackInterruptionMs: nullableNumber(playbackInterruptionMs),
      seamP95WaitedMs: seamSummary.waitedP95Ms,
      seamP95DecodeMs: seamSummary.decodeP95Ms,
      finalHandoffErrorMs: nullableNumber(finalHandoffErrorMs),
      succeeded,
      notes: notes.trim(),
    }
  }

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      const saved = await recordDeviceSoak(buildRecord())
      setResult(saved)
      onRecorded()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '실기기 측정 기록을 저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const targetSeconds = sampleMinutes * 60
  const progress = Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100))
  const recoveryRequired = scenario !== 'baseline'

  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">DEVICE SOAK RECORDER</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">10·30·60분 실기기 기록</h2>
        </div>
        <StatusPill label={session ? `${progress}%` : result?.status ?? '대기'} tone={result?.status === 'ready' ? 'good' : 'warning'} />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
        실제 Android Chrome·iOS Safari에서 측정을 시작하고 복구 시간과 재생 중단 시간을 입력합니다. 자동 감지값만으로 READY를 만들지 않습니다.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="text-[10px] font-black text-soa-muted">기기
          <select value={deviceProfile} onChange={(event) => setDeviceProfile(event.target.value as 'android' | 'ios')} disabled={Boolean(session)} className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-soa-line bg-white px-3 text-xs text-soa-ink">
            <option value="android">Android Chrome</option><option value="ios">iOS Safari</option>
          </select>
        </label>
        <label className="text-[10px] font-black text-soa-muted">목표 시간
          <select value={sampleMinutes} onChange={(event) => setSampleMinutes(Number(event.target.value) as 10 | 30 | 60)} disabled={Boolean(session)} className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-soa-line bg-white px-3 text-xs text-soa-ink">
            <option value={10}>10분</option><option value={30}>30분</option><option value={60}>60분</option>
          </select>
        </label>
        <label className="col-span-2 text-[10px] font-black text-soa-muted">시나리오
          <select value={scenario} onChange={(event) => setScenario(event.target.value as DeviceCertificationScenario)} disabled={Boolean(session)} className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-soa-line bg-white px-3 text-xs text-soa-ink">
            {Object.entries(scenarioLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-3 rounded-2xl border border-soa-line bg-white p-4">
        <div className="flex items-center justify-between gap-3"><strong className="text-sm">관찰 시간 {formatElapsed(elapsedSeconds)}</strong><span className="text-xs font-black text-soa-muted">목표 {sampleMinutes}분</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ece9df]"><div className="h-full bg-soa-lime" style={{ width: `${progress}%` }} /></div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={startSession} disabled={Boolean(session)} className="focus-ring min-h-11 rounded-xl bg-soa-ink text-xs font-black text-white disabled:opacity-45">측정 시작</button>
          <button type="button" onClick={stopSession} disabled={!session} className="focus-ring min-h-11 rounded-xl border border-soa-line text-xs font-black disabled:opacity-45">측정 종료</button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <input aria-label="기기 이름" value={deviceName} onChange={(event) => setDeviceName(event.target.value)} placeholder="기기 이름" className="focus-ring min-h-11 rounded-xl border border-soa-line bg-white px-3 text-xs" />
        <select aria-label="프리셋" value={presetId} onChange={(event) => setPresetId(event.target.value)} className="focus-ring min-h-11 rounded-xl border border-soa-line bg-white px-3 text-xs">
          {voicePresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name} · {preset.id}</option>)}
        </select>
        <input aria-label="엔진 ID" value={engineId} onChange={(event) => setEngineId(event.target.value)} placeholder="엔진 ID" className="focus-ring min-h-11 rounded-xl border border-soa-line bg-white px-3 text-xs" />
        <input aria-label="모델 ID" value={modelId} onChange={(event) => setModelId(event.target.value)} placeholder="모델 ID" className="focus-ring min-h-11 rounded-xl border border-soa-line bg-white px-3 text-xs" />
        <input aria-label="모델 버전" value={modelVersion} onChange={(event) => setModelVersion(event.target.value)} placeholder="모델 버전" className="focus-ring min-h-11 rounded-xl border border-soa-line bg-white px-3 text-xs" />
        <input aria-label="처리 시간 초" inputMode="decimal" value={processingSeconds} onChange={(event) => setProcessingSeconds(event.target.value)} placeholder="처리 시간 초" className="focus-ring min-h-11 rounded-xl border border-soa-line bg-white px-3 text-xs" />
        <input aria-label="재생 음원 길이 초" inputMode="decimal" value={audioDurationSeconds} onChange={(event) => setAudioDurationSeconds(event.target.value)} placeholder="재생 음원 길이 초" className="focus-ring min-h-11 rounded-xl border border-soa-line bg-white px-3 text-xs" />
        <input aria-label="첫 음성 밀리초" inputMode="numeric" value={firstAudioMs} onChange={(event) => setFirstAudioMs(event.target.value)} placeholder="첫 음성 ms" className="focus-ring min-h-11 rounded-xl border border-soa-line bg-white px-3 text-xs" />
        <input aria-label="최종 교체 오차 밀리초" inputMode="numeric" value={finalHandoffErrorMs} onChange={(event) => setFinalHandoffErrorMs(event.target.value)} placeholder="handoff 오차 ms" className="focus-ring min-h-11 rounded-xl border border-soa-line bg-white px-3 text-xs" />
      </div>

      {recoveryRequired ? (
        <div className="mt-3 rounded-2xl border border-soa-line bg-white p-3">
          <strong className="text-xs">복구 증거</strong>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <select aria-label="SSE 재연결 결과" value={sseState} onChange={(event) => setSseState(event.target.value)} className="focus-ring min-h-11 rounded-xl border border-soa-line px-3 text-xs"><option value="unverified">SSE 미검증</option><option value="passed">SSE 성공</option><option value="failed">SSE 실패</option></select>
            <input aria-label="SSE 재연결 시간" inputMode="numeric" value={sseReconnectMs} onChange={(event) => setSseReconnectMs(event.target.value)} placeholder="SSE 재연결 ms" className="focus-ring min-h-11 rounded-xl border border-soa-line px-3 text-xs" />
            <select aria-label="음원 복구 결과" value={fetchState} onChange={(event) => setFetchState(event.target.value)} className="focus-ring min-h-11 rounded-xl border border-soa-line px-3 text-xs"><option value="unverified">음원 미검증</option><option value="passed">음원 복구 성공</option><option value="failed">음원 복구 실패</option></select>
            <input aria-label="음원 복구 시간" inputMode="numeric" value={audioFetchRecoveryMs} onChange={(event) => setAudioFetchRecoveryMs(event.target.value)} placeholder="음원 복구 ms" className="focus-ring min-h-11 rounded-xl border border-soa-line px-3 text-xs" />
            <input aria-label="재생 중단 시간" inputMode="numeric" value={playbackInterruptionMs} onChange={(event) => setPlaybackInterruptionMs(event.target.value)} placeholder="재생 중단 ms" className="focus-ring col-span-2 min-h-11 rounded-xl border border-soa-line px-3 text-xs" />
          </div>
        </div>
      ) : null}

      <div className="mt-3 rounded-2xl bg-white p-3 text-[11px] font-bold leading-5 text-soa-muted">
        현재 Player 실측: 생성 대기 seam P95 {seamSummary.waitedP95Ms ?? '미측정'}ms · 순수 전환 seam P95 {seamSummary.decodeP95Ms ?? '미측정'}ms
      </div>
      <textarea aria-label="측정 메모" value={notes} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNotes(event.target.value)} maxLength={1000} placeholder="OS 버전, 네트워크 조건, 중단 상황을 기록하세요." className="focus-ring mt-3 min-h-20 w-full rounded-2xl border border-soa-line bg-white p-3 text-xs" />
      <div className="mt-2 flex flex-wrap gap-3 text-xs font-black">
        <label><input type="checkbox" checked={playbackCompleted} onChange={(event) => setPlaybackCompleted(event.target.checked)} /> 재생 완료</label>
        <label><input type="checkbox" checked={succeeded} onChange={(event) => setSucceeded(event.target.checked)} /> 시나리오 성공</label>
      </div>
      {error ? <p className="mt-3 text-xs font-bold text-soa-coral">{error}</p> : null}
      {result ? <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-black text-emerald-700">저장 완료 · {result.status.toUpperCase()} · RTF {result.realtimeFactor.toFixed(3)}</p> : null}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => void submit()} disabled={saving || Boolean(session)} className="focus-ring min-h-11 rounded-xl bg-soa-lime text-xs font-black disabled:opacity-45">{saving ? '저장 중…' : 'API 측정표에 저장'}</button>
        <button type="button" onClick={() => downloadDeviceSoakRecord(buildRecord(), result?.status)} className="focus-ring min-h-11 rounded-xl border border-soa-line bg-white text-xs font-black">현재 기록 JSON</button>
      </div>
    </section>
  )
}
