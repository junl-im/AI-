import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  discoverApiBaseUrl,
  getApiBaseWarnings,
  getApiConnectionContext,
  normalizeApiBaseUrl,
  saveApiBaseUrl,
} from '../../api/httpClient'
import { getMobileNetworkSnapshot, mobileNetworkLabel } from '../../network/mobileNetwork'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { runApiConnectivityAudit } from '../../settings/connectivityApi'
import type {
  ApiConnectivityReport,
  ConnectionLayerState,
} from '../../settings/connectivityTypes'
import { useAppStore } from '../../store/useAppStore'

interface HealthDotProps {
  label: string
  state: ConnectionLayerState
  detail: string
}

function HealthDot({ label, state, detail }: HealthDotProps) {
  return (
    <div className={`soa-health-dot is-${state}`} title={detail}>
      <i aria-hidden="true" />
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
    </div>
  )
}

function defaultLayers(checking: boolean): ApiConnectivityReport['layers'] {
  const state = checking ? 'checking' : 'unknown'
  return {
    api: { state, detail: checking ? '확인 중' : '확인 전' },
    tts: { state, detail: checking ? '확인 중' : '확인 전' },
    worker: { state, detail: checking ? '확인 중' : '확인 전' },
    gpu: { state, detail: checking ? '확인 중' : '확인 전' },
  }
}

export function ConnectionBottomSheet() {
  const open = useAppStore((state) => state.connectionSheetOpen)
  const close = useAppStore((state) => state.closeConnectionSheet)
  const setBackendStatus = useAppStore((state) => state.setBackendStatus)
  const setEngineHealth = useAppStore((state) => state.setEngineHealth)
  const showNotice = useAppStore((state) => state.showNotice)
  const [baseUrl, setBaseUrl] = useState('http://127.0.0.1:8000')
  const [history, setHistory] = useState<string[]>([])
  const [report, setReport] = useState<ApiConnectivityReport | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useOnlineStatus()
  const network = getMobileNetworkSnapshot()
  const warnings = useMemo(() => getApiBaseWarnings(baseUrl), [baseUrl])

  useEffect(() => {
    if (!open) return
    const context = getApiConnectionContext()
    const initial = context.baseUrl || context.lastGoodUrl || 'http://127.0.0.1:8000'
    setBaseUrl(initial)
    setHistory([context.lastGoodUrl, ...context.history].filter(Boolean))
    setReport(null)
    setError(null)
  }, [open])

  if (!open) return null

  async function inspect(value: string, save: boolean, mode: 'quick' | 'deep' = 'deep') {
    setChecking(true)
    setError(null)
    try {
      const result = await runApiConnectivityAudit(value, { mode })
      setReport(result)
      setBaseUrl(result.baseUrl)
      if (save && result.apiReady) saveApiBaseUrl(result.baseUrl)
      setEngineHealth({
        api: result.layers.api.state,
        tts: result.layers.tts.state,
        worker: result.layers.worker.state,
        gpu: result.layers.gpu.state,
        baseUrl: result.baseUrl,
        latencyMs: result.latencyMs,
        lastCheckedAt: result.lastCheckedAt,
        requestId: result.requestId,
      })
      const status = result.ttsReady ? 'online' : result.apiReady ? 'degraded' : 'offline'
      setBackendStatus(status, result.ttsReady
        ? `실제 TTS 준비 · ${result.latencyMs}ms`
        : result.apiReady
          ? result.layers.tts.detail
          : result.layers.api.detail)
      showNotice(result.ttsReady
        ? '모바일 Voice API와 실제 음성 엔진 연결을 확인했습니다.'
        : result.apiReady
          ? 'API는 연결됐습니다. 엔진 상태를 아래에서 확인해 주세요.'
          : '입력한 주소에서 SoriON API를 찾지 못했습니다.')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '연결 검사에 실패했습니다.'
      setBackendStatus('offline', message)
      setEngineHealth({ api: 'offline', tts: 'unknown', worker: 'unknown', gpu: 'unknown' })
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
      await inspect(found.baseUrl, true, 'deep')
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
      setError('클립보드 권한이 없어 입력창을 길게 눌러 붙여넣어야 합니다.')
    }
  }

  const normalizedPreview = normalizeApiBaseUrl(baseUrl)
  const layers = report?.layers ?? defaultLayers(checking)

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
            <span>MOBILE ENGINE CONNECTION</span>
            <h2 id="connection-sheet-title">음성 엔진 연결</h2>
          </div>
          <button type="button" onClick={close} aria-label="연결 창 닫기">×</button>
        </header>

        <div className="soa-mobile-network-summary">
          <strong>{mobileNetworkLabel(network)}</strong>
          <span>{network.standalone ? 'PWA 모드' : '브라우저 모드'}</span>
        </div>

        <div className="soa-health-grid" aria-label="엔진 계층 상태">
          <HealthDot label="API" {...layers.api} />
          <HealthDot label="TTS" {...layers.tts} />
          <HealthDot label="Worker" {...layers.worker} />
          <HealthDot label="GPU" {...layers.gpu} />
        </div>

        <p className="soa-sheet-description">
          휴대폰에서 localhost는 PC가 아닙니다. 같은 Wi-Fi에서는 PC의 LAN 주소를,
          GitHub Pages에서는 공개 HTTPS API를 사용해야 합니다.
        </p>

        <label htmlFor="connection-url">Voice API 주소</label>
        <div className="soa-connection-input">
          <input
            id="connection-url"
            value={baseUrl}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setBaseUrl(event.target.value)}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="go"
            spellCheck={false}
            placeholder="http://192.168.0.10:8000"
          />
          <button type="button" onClick={() => void pasteAddress()}>붙여넣기</button>
        </div>
        <small>
          {normalizedPreview
            ? `검사 주소: ${normalizedPreview}`
            : 'IP만 입력해도 자동으로 /api/v1 경로를 붙입니다.'}
        </small>

        {history.length ? (
          <div className="soa-connection-history" aria-label="최근 연결 주소">
            {history.slice(0, 3).map((item) => (
              <button key={item} type="button" onClick={() => setBaseUrl(item)}>
                {item.replace('/api/v1', '')}
              </button>
            ))}
          </div>
        ) : null}

        {warnings.map((warning) => (
          <p key={warning} className="soa-connection-warning">{warning}</p>
        ))}

        <div className="soa-connection-actions">
          <button type="button" onClick={() => void autoDiscover()} disabled={checking}>
            {checking ? '확인 중…' : '이 기기에서 찾기'}
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={() => void inspect(baseUrl, true)}
            disabled={checking || !baseUrl.trim() || warnings.length > 0}
          >
            연결·저장·전체 점검
          </button>
        </div>

        {error ? <p className="soa-connection-error">{error}</p> : null}
        {report ? (
          <div className="soa-connection-result" aria-label="연결 검사 결과">
            <div className="soa-connection-result__meta">
              <strong>{report.latencyMs}ms</strong>
              <small>{report.requestId ? `요청 ${report.requestId.slice(0, 8)}` : '요청 ID 없음'}</small>
            </div>
            {report.checks.map((check) => (
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
