import { useEffect, useMemo, useState } from 'react'
import {
  collectBrowserPlaybackEvidence,
  downloadBrowserPlaybackEvidence,
  loadBrowserPlaybackEvidence,
  resetBrowserSoakEvidence,
  runGesturePlaybackProbe,
  saveBrowserPlaybackEvidence,
  startBrowserPlaybackEvidenceMonitor,
  type BrowserPlaybackEvidence,
  type PlaybackProbeResult,
} from '../../quality/browserPlaybackEvidence'
import { StatusPill } from '../ui/StatusPill'

const profileLabels: Record<BrowserPlaybackEvidence['deviceProfile'], string> = {
  'android-chrome': 'Android Chrome',
  'ios-safari': 'iOS Safari',
  pwa: '설치형 PWA',
  'desktop-browser': 'Desktop Browser',
}

const resultLabels: Record<PlaybackProbeResult, string> = {
  'not-tested': '미측정',
  passed: '통과',
  blocked: '차단됨',
  failed: '실패',
}

function formatDuration(ms: number) {
  if (ms < 1_000) return `${Math.round(ms)}ms`
  if (ms < 60_000) return `${(ms / 1_000).toFixed(1)}초`
  return `${(ms / 60_000).toFixed(1)}분`
}

export function BrowserPlaybackEvidenceCard() {
  const [evidence, setEvidence] = useState<BrowserPlaybackEvidence | null>(() => loadBrowserPlaybackEvidence())
  const [testing, setTesting] = useState(false)

  useEffect(() => startBrowserPlaybackEvidenceMonitor(setEvidence), [])

  function refreshEnvironment() {
    const next = collectBrowserPlaybackEvidence(
      evidence?.gesturePlayback ?? 'not-tested',
      evidence?.backgroundRestore ?? 'not-tested',
      evidence?.soak,
    )
    saveBrowserPlaybackEvidence(next)
    setEvidence(next)
  }

  async function testPlayback() {
    setTesting(true)
    const result = await runGesturePlaybackProbe()
    const next = collectBrowserPlaybackEvidence(
      result,
      evidence?.backgroundRestore ?? 'not-tested',
      evidence?.soak,
    )
    saveBrowserPlaybackEvidence(next)
    setEvidence(next)
    setTesting(false)
  }

  function resetSoak() {
    const next = resetBrowserSoakEvidence(evidence)
    saveBrowserPlaybackEvidence(next)
    setEvidence(next)
  }

  const readyChecks = evidence
    ? [
        evidence.secureContext,
        evidence.online,
        evidence.eventSourceSupported,
        evidence.serviceWorkerSupported,
        evidence.gesturePlayback === 'passed',
      ].filter(Boolean).length
    : 0
  const elapsedMs = useMemo(() => {
    if (!evidence) return 0
    const started = Date.parse(evidence.soak.startedAt)
    const updated = Date.parse(evidence.soak.updatedAt)
    return Number.isFinite(started) && Number.isFinite(updated) ? Math.max(0, updated - started) : 0
  }, [evidence])

  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">BROWSER PLAYBACK EVIDENCE</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">현재 기기 재생 점검</h2>
        </div>
        <StatusPill
          label={evidence ? `${readyChecks}/5` : '미측정'}
          tone={readyChecks === 5 ? 'good' : 'warning'}
        />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
        자동 기능 감지, 사용자 제스처 재생, 탭 숨김·복귀와 네트워크 전환을 분리 기록합니다. 이 기록만으로 장시간 음성 재생 성공을 인증하지는 않습니다.
      </p>

      {evidence ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-soa-line bg-white p-4">
            <strong className="text-sm">{profileLabels[evidence.deviceProfile]} · {evidence.browserName}</strong>
            <p className="mt-1 text-[10px] font-bold text-soa-muted">
              {new Date(evidence.recordedAt).toLocaleString('ko-KR')} · {evidence.standalone ? 'standalone' : 'browser tab'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-black">
            <span className={`rounded-xl p-3 ${evidence.secureContext ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>HTTPS {evidence.secureContext ? '통과' : '필요'}</span>
            <span className={`rounded-xl p-3 ${evidence.online ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>네트워크 {evidence.online ? '온라인' : '오프라인'}</span>
            <span className={`rounded-xl p-3 ${evidence.eventSourceSupported ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>SSE API {evidence.eventSourceSupported ? '지원' : '미지원'}</span>
            <span className={`rounded-xl p-3 ${evidence.serviceWorkerSupported ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>Service Worker {evidence.serviceWorkerSupported ? '지원' : '미지원'}</span>
            <span className={`rounded-xl p-3 ${evidence.mediaSessionSupported ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f4f2ec] text-soa-muted'}`}>Media Session {evidence.mediaSessionSupported ? '지원' : '선택 기능'}</span>
            <span className={`rounded-xl p-3 ${evidence.gesturePlayback === 'passed' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f4f2ec] text-soa-muted'}`}>제스처 재생 {resultLabels[evidence.gesturePlayback]}</span>
          </div>
          <div className="rounded-2xl border border-soa-line bg-white p-4 text-[11px] font-bold leading-5 text-soa-muted">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-xs text-soa-ink">관찰 세션 {formatDuration(elapsedMs)}</strong>
              <span>탭 복귀 {evidence.backgroundRestore === 'observed' ? '감지됨' : '미감지'}</span>
            </div>
            <p className="mt-2">
              네트워크 전환 {evidence.soak.networkTransitions}회 · visibility 전환 {evidence.soak.visibilityTransitions}회 · 백그라운드 복귀 {evidence.soak.backgroundReturnCount}회
            </p>
            <p>
              숨김 누적 {formatDuration(evidence.soak.totalHiddenMs)} · 최장 숨김 {formatDuration(evidence.soak.longestHiddenMs)} · BFCache 복원 {evidence.soak.pageShowRestoreCount}회
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-[#f4f2ec] p-4 text-sm font-semibold leading-6 text-soa-muted">
          현재 브라우저의 HTTPS, SSE API, PWA, 네트워크 상태를 아직 기록하지 않았습니다.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={refreshEnvironment} className="focus-ring min-h-11 rounded-2xl border border-soa-line bg-white text-xs font-black">
          환경 자동 검사
        </button>
        <button type="button" onClick={() => void testPlayback()} disabled={testing} className="focus-ring min-h-11 rounded-2xl bg-soa-ink text-xs font-black text-white disabled:opacity-50">
          {testing ? '재생 확인 중…' : '재생 허용 검사'}
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={resetSoak} className="focus-ring min-h-11 rounded-2xl border border-soa-line bg-white text-xs font-black">
          관찰 세션 초기화
        </button>
        <button
          type="button"
          onClick={() => evidence && downloadBrowserPlaybackEvidence(evidence)}
          disabled={!evidence}
          className="focus-ring min-h-11 rounded-2xl border border-soa-line bg-white text-xs font-black disabled:opacity-45"
        >
          기기 증거 JSON 저장
        </button>
      </div>
    </section>
  )
}
