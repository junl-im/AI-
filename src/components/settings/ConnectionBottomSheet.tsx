import { useEffect, useState, type ChangeEvent } from 'react'
import {
  discoverApiBaseUrl,
  getApiConnectionContext,
  normalizeApiBaseUrl,
  saveApiBaseUrl,
} from '../../api/httpClient'
import { runApiConnectivityAudit } from '../../settings/connectivityApi'
import type { ApiConnectivityReport } from '../../settings/connectivityTypes'
import { useAppStore } from '../../store/useAppStore'

interface HealthDotProps {
  label: string
  ready: boolean
  pending?: boolean
}

function HealthDot({ label, ready, pending = false }: HealthDotProps) {
  const state = pending ? 'is-pending' : ready ? 'is-ready' : 'is-offline'
  return (
    <div className={`soa-health-dot ${state}`}>
      <i aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

function workerHealth(report: ApiConnectivityReport | null): boolean {
  return report?.checks.some((check) => (
    check.id === 'clone-worker-health' && check.status === 'ready'
  )) ?? false
}

function hasDemoEngine(report: ApiConnectivityReport): boolean {
  return report.ttsEngines.some((engine) => engine.ready && engine.mode === 'mock')
}

export function ConnectionBottomSheet() {
  const open = useAppStore((state) => state.connectionSheetOpen)
  const close = useAppStore((state) => state.closeConnectionSheet)
  const setBackendStatus = useAppStore((state) => state.setBackendStatus)
  const showNotice = useAppStore((state) => state.showNotice)
  const [baseUrl, setBaseUrl] = useState('http://127.0.0.1:8000')
  const [report, setReport] = useState<ApiConnectivityReport | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const context = getApiConnectionContext()
    setBaseUrl(context.baseUrl || 'http://127.0.0.1:8000')
    setReport(null)
    setError(null)
  }, [open])

  if (!open) return null

  async function inspect(value: string, save: boolean) {
    setChecking(true)
    setError(null)
    try {
      const result = await runApiConnectivityAudit(value)
      const demoReady = hasDemoEngine(result)
      setReport(result)
      setBaseUrl(result.baseUrl)
      if (save && result.apiReady) saveApiBaseUrl(result.baseUrl)
      setBackendStatus(
        result.ttsReady ? 'online' : result.apiReady && demoReady ? 'degraded' : 'offline',
        result.ttsReady
          ? `Voice API v${result.version ?? 'unknown'} · 실제 TTS 준비됨`
          : result.apiReady && demoReady
            ? 'API는 연결됐지만 실제 TTS가 없어 Demo 엔진만 사용할 수 있습니다.'
            : result.apiReady
              ? 'API는 연결됐지만 실행 가능한 한국어 TTS 엔진이 없습니다.'
              : '입력한 주소에서 Voice API를 찾지 못했습니다.',
      )
      showNotice(
        result.ttsReady
          ? 'Voice API와 실제 음성 엔진 연결을 확인했습니다.'
          : result.apiReady
            ? 'API 주소는 저장했습니다. 엔진 준비 상태를 확인해 주세요.'
            : '입력한 주소에서 SoriON API를 찾지 못했습니다.',
      )
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '연결 검사에 실패했습니다.'
      setBackendStatus('offline', message)
      setError(message)
    } finally {
      setChecking(false)
    }
  }

  async function autoDiscover() {
    setChecking(true)
    setError(null)
    try {
      const found = await discoverApiBaseUrl()
      setBaseUrl(found.baseUrl)
      await inspect(found.baseUrl, true)
    } catch (caught) {
      setChecking(false)
      setError(caught instanceof Error ? caught.message : '자동 검색에 실패했습니다.')
    }
  }

  async function pasteAddress() {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) setBaseUrl(text.trim())
    } catch {
      setError('클립보드 권한이 없어 직접 붙여넣어야 합니다.')
    }
  }

  const normalizedPreview = normalizeApiBaseUrl(baseUrl)

  return (
    <div className="soa-sheet-layer" role="presentation" onMouseDown={close}>
      <section
        className="soa-connection-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="connection-sheet-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="soa-sheet-handle" aria-hidden="true" />
        <header>
          <div>
            <span>VOICE MODEL CONNECTION</span>
            <h2 id="connection-sheet-title">음성 엔진 연결</h2>
          </div>
          <button type="button" onClick={close} aria-label="연결 창 닫기">×</button>
        </header>

        <div className="soa-health-row" aria-label="엔진 상태">
          <HealthDot label="API" ready={report?.apiReady ?? false} pending={checking} />
          <HealthDot label="Worker" ready={workerHealth(report)} pending={checking} />
          <HealthDot label="GPU" ready={report?.voiceCloneReady ?? false} pending={checking} />
        </div>

        <p className="soa-sheet-description">
          현재 기기에서 실행 중인 API를 찾거나 배포된 HTTPS 주소를 붙여넣으세요.
          브라우저 보안상 전체 192.168.x.x 대역을 무단 검색하지 않고,
          저장된 주소·현재 호스트·localhost 후보만 안전하게 확인합니다.
        </p>

        <label htmlFor="connection-url">Voice API 주소</label>
        <div className="soa-connection-input">
          <input
            id="connection-url"
            value={baseUrl}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setBaseUrl(event.target.value)}
            inputMode="url"
            spellCheck={false}
            placeholder="http://192.168.0.10:8000"
          />
          <button type="button" onClick={() => void pasteAddress()}>붙여넣기</button>
        </div>
        <small>
          {normalizedPreview
            ? `저장 주소: ${normalizedPreview}`
            : '예: http://192.168.0.10:8000 또는 https://voice.example.com'}
        </small>

        <div className="soa-connection-actions">
          <button type="button" onClick={() => void autoDiscover()} disabled={checking}>
            {checking ? '찾는 중…' : '이 기기에서 찾기'}
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={() => void inspect(baseUrl, true)}
            disabled={checking || !baseUrl.trim()}
          >
            연결하고 저장
          </button>
        </div>

        {error ? <p className="soa-connection-error">{error}</p> : null}
        {report ? (
          <div className="soa-connection-result" aria-label="연결 검사 결과">
            {report.checks.slice(0, 7).map((check) => (
              <div key={check.id}>
                <i className={`is-${check.status}`} aria-hidden="true" />
                <span>
                  <strong>{check.label}</strong>
                  <small>{check.detail}</small>
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
