import { useMemo, useState, type ChangeEvent } from 'react'
import {
  getApiConnectionContext,
  normalizeApiBaseUrl,
  resetApiBaseUrl,
  saveApiBaseUrl,
} from '../../api/httpClient'
import { runApiConnectivityAudit } from '../../settings/connectivityApi'
import type { ApiConnectivityReport } from '../../settings/connectivityTypes'
import { useAppStore } from '../../store/useAppStore'
import { StatusPill } from '../ui/StatusPill'

const LOCAL_API_EXAMPLE = 'http://127.0.0.1:8000'

export function ApiSetupWizard() {
  const initialContext = useMemo(() => getApiConnectionContext(), [])
  const setBackendStatus = useAppStore((state) => state.setBackendStatus)
  const showNotice = useAppStore((state) => state.showNotice)
  const [baseUrl, setBaseUrl] = useState(initialContext.baseUrl || LOCAL_API_EXAMPLE)
  const [report, setReport] = useState<ApiConnectivityReport | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function testConnection() {
    setChecking(true)
    setError(null)
    setReport(null)
    try {
      const result = await runApiConnectivityAudit(baseUrl)
      setReport(result)
      const online = result.checks.some(
        (check) => check.id === 'health-route' && check.status === 'ready',
      )
      setBackendStatus(online ? 'online' : 'offline')
      showNotice(
        result.status === 'ready'
          ? 'Voice API와 실제 TTS 엔진 연결을 확인했습니다.'
          : online
            ? 'API는 연결됐지만 엔진 또는 Worker 준비가 필요합니다.'
            : 'Voice API 연결에 실패했습니다.',
      )
    } catch (caught) {
      setBackendStatus('offline')
      setError(caught instanceof Error ? caught.message : 'Voice API에 연결하지 못했습니다.')
    } finally {
      setChecking(false)
    }
  }

  function saveConnection() {
    try {
      const saved = saveApiBaseUrl(baseUrl)
      setBaseUrl(saved)
      showNotice('Voice API 주소를 이 기기에 저장했습니다.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'API 주소를 저장하지 못했습니다.')
    }
  }

  function restoreDefault() {
    resetApiBaseUrl()
    const context = getApiConnectionContext()
    setBaseUrl(context.baseUrl || LOCAL_API_EXAMPLE)
    setReport(null)
    setError(null)
    showNotice('저장된 API 주소를 지웠습니다.')
  }

  const statusLabel = checking
    ? '검사 중'
    : report?.status === 'ready'
      ? '전체 연결'
      : report?.status === 'warning'
        ? '일부 준비'
        : report
          ? '연결 실패'
          : '연결 필요'

  return (
    <article className="rounded-[26px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.14em] text-soa-muted">ENGINE CONNECTIVITY</span>
          <h2 className="mt-1 font-black tracking-[-0.035em]">Voice API 연결 점검</h2>
        </div>
        <StatusPill
          label={statusLabel}
          tone={report?.status === 'ready' ? 'good' : 'warning'}
        />
      </div>

      <p className="mt-2 text-sm leading-6 text-soa-muted">
        GitHub Pages에는 Python 엔진이 포함되지 않습니다. PC에서는 로컬 API를 실행하고,
        모바일 서비스에는 공개 HTTPS API가 필요합니다.
      </p>

      {initialContext.warnings.map((warning) => (
        <p key={warning} className="mt-2 rounded-2xl bg-[#fff0c9] p-3 text-xs font-bold leading-5 text-[#77590d]">
          {warning}
        </p>
      ))}

      <label className="mt-4 block text-[11px] font-black text-soa-muted" htmlFor="voice-api-url">
        1. API 주소
      </label>
      <input
        id="voice-api-url"
        value={baseUrl}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setBaseUrl(event.target.value)}
        inputMode="url"
        spellCheck={false}
        className="focus-ring mt-2 min-h-12 w-full rounded-2xl border border-soa-line bg-white px-4 text-sm font-bold"
        placeholder={LOCAL_API_EXAMPLE}
      />
      <p className="mt-2 text-[10px] font-semibold leading-4 text-soa-muted">
        PC 로컬: {LOCAL_API_EXAMPLE} · 휴대폰: PC의 LAN IP 또는 배포된 HTTPS API
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void testConnection()}
          disabled={checking}
          className="focus-ring min-h-12 rounded-2xl bg-soa-ink px-3 text-xs font-black text-white disabled:opacity-50"
        >
          {checking ? '전체 검사 중…' : '2. 전체 연결 검사'}
        </button>
        <button
          type="button"
          onClick={saveConnection}
          className="focus-ring min-h-12 rounded-2xl bg-soa-lime px-3 text-xs font-black"
        >
          3. 주소 저장
        </button>
      </div>
      <button
        type="button"
        onClick={restoreDefault}
        className="focus-ring mt-2 min-h-10 w-full rounded-xl text-[11px] font-black text-soa-muted"
      >
        저장된 주소 지우기
      </button>

      {error ? (
        <p className="mt-3 rounded-2xl bg-soa-coral/10 p-3 text-xs font-bold leading-5">{error}</p>
      ) : null}

      {report ? (
        <div className="mt-4 space-y-2" aria-label="API 연결 진단 결과">
          <div className="rounded-2xl border border-soa-line bg-white/75 p-3 text-[11px] font-bold">
            API v{report.version ?? '확인 실패'} · {report.environment ?? '환경 미확인'}
            <span className="mt-1 block break-all text-soa-muted">{normalizeApiBaseUrl(baseUrl)}</span>
          </div>
          {report.checks.map((check) => (
            <div key={check.id} className="rounded-2xl border border-soa-line bg-white/75 p-3">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-xs">{check.label}</strong>
                <StatusPill
                  label={check.status === 'ready' ? '정상' : check.status === 'warning' ? '선택' : '실패'}
                  tone={check.status === 'ready' ? 'good' : 'warning'}
                />
              </div>
              <p className="mt-1 text-[11px] font-semibold leading-5 text-soa-muted">
                {check.detail}{check.latencyMs !== null ? ` · ${check.latencyMs}ms` : ''}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  )
}
