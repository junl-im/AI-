import { useState, type ChangeEvent } from 'react'
import {
  getApiBaseUrl,
  normalizeApiBaseUrl,
  resetApiBaseUrl,
  saveApiBaseUrl,
} from '../../api/httpClient'
import { getSetupStatus } from '../../settings/setupApi'
import type { SetupStatus } from '../../settings/setupTypes'
import { useAppStore } from '../../store/useAppStore'
import { checkHealth } from '../../tts/voiceApi'
import { StatusPill } from '../ui/StatusPill'

export function ApiSetupWizard() {
  const setBackendStatus = useAppStore((state) => state.setBackendStatus)
  const showNotice = useAppStore((state) => state.showNotice)
  const [baseUrl, setBaseUrl] = useState(getApiBaseUrl())
  const [setup, setSetup] = useState<SetupStatus | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function testConnection() {
    setChecking(true)
    setError(null)
    setSetup(null)
    const candidate = normalizeApiBaseUrl(baseUrl)
    try {
      await checkHealth(candidate)
      const result = await getSetupStatus(candidate)
      setSetup(result)
      setBackendStatus('online')
      showNotice(result.ready ? '실제 한국어 음성 생성 준비가 완료됐습니다.' : 'API는 연결됐지만 필수 설치 항목이 남아 있습니다.')
    } catch (caught) {
      setBackendStatus('offline')
      setError(caught instanceof Error ? caught.message : 'Voice API에 연결하지 못했습니다.')
    } finally {
      setChecking(false)
    }
  }

  function saveConnection() {
    const saved = saveApiBaseUrl(baseUrl)
    setBaseUrl(saved)
    showNotice('Voice API 주소를 이 기기에 저장했습니다.')
  }

  function restoreDefault() {
    resetApiBaseUrl()
    setBaseUrl('/api/v1')
    setSetup(null)
    setError(null)
    showNotice('Voice API 주소를 기본값으로 되돌렸습니다.')
  }

  return (
    <article className="rounded-[26px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.14em] text-soa-muted">3-STEP SETUP</span>
          <h2 className="mt-1 font-black tracking-[-0.035em]">Voice API 연결 마법사</h2>
        </div>
        <StatusPill label={setup?.ready ? '생성 준비됨' : setup ? '설치 확인' : '연결 필요'} tone={setup?.ready ? 'good' : 'warning'} />
      </div>
      <p className="mt-2 text-sm leading-6 text-soa-muted">주소 입력, 연결 검사, 저장까지 한 화면에서 끝냅니다. 로컬 기본 주소는 <strong>http://127.0.0.1:8000</strong>입니다.</p>
      <label className="mt-4 block text-[11px] font-black text-soa-muted" htmlFor="voice-api-url">1. API 주소</label>
      <input
        id="voice-api-url"
        value={baseUrl}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setBaseUrl(event.target.value)}
        inputMode="url"
        spellCheck={false}
        className="focus-ring mt-2 min-h-12 w-full rounded-2xl border border-soa-line bg-white px-4 text-sm font-bold"
        placeholder="http://127.0.0.1:8000"
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => void testConnection()} disabled={checking} className="focus-ring min-h-12 rounded-2xl bg-soa-ink px-3 text-xs font-black text-white disabled:opacity-50">{checking ? '확인 중…' : '2. 연결 검사'}</button>
        <button type="button" onClick={saveConnection} className="focus-ring min-h-12 rounded-2xl bg-soa-lime px-3 text-xs font-black">3. 주소 저장</button>
      </div>
      <button type="button" onClick={restoreDefault} className="focus-ring mt-2 min-h-10 w-full rounded-xl text-[11px] font-black text-soa-muted">기본 주소로 되돌리기</button>

      {error ? <p className="mt-3 rounded-2xl bg-soa-coral/10 p-3 text-xs font-bold leading-5">{error}</p> : null}
      {setup ? (
        <div className="mt-4 space-y-2">
          {setup.steps.map((step) => (
            <div key={step.id} className="rounded-2xl border border-soa-line bg-white/75 p-3">
              <div className="flex items-center justify-between gap-2"><strong className="text-xs">{step.label}</strong><StatusPill label={step.status === 'ready' ? '완료' : step.status === 'warning' ? '선택' : '필요'} tone={step.status === 'ready' ? 'good' : 'warning'} /></div>
              <p className="mt-1 text-[11px] font-semibold leading-5 text-soa-muted">{step.detail}</p>
              {step.action && step.status !== 'ready' ? <p className="mt-1 text-[10px] font-black leading-4 text-soa-ink">다음: {step.action}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  )
}
