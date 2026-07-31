import { useEffect } from 'react'
import { StatusPill } from '../components/ui/StatusPill'
import { consumeGoogleSignInResult, isFirebaseConfigured, startGoogleSignIn } from '../firebase/firebaseClient'
import { useEngineCatalog } from '../hooks/useEngineCatalog'
import { useAppStore } from '../store/useAppStore'
import { checkHealth } from '../tts/voiceApi'

export function SettingsPage() {
  const status = useAppStore((state) => state.backendStatus)
  const setStatus = useAppStore((state) => state.setBackendStatus)
  const showNotice = useAppStore((state) => state.showNotice)
  const firebaseReady = isFirebaseConfigured()
  const catalog = useEngineCatalog()

  useEffect(() => {
    setStatus('checking')
    void checkHealth()
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'))
    void consumeGoogleSignInResult().then((user) => {
      if (user) showNotice(`${user.displayName ?? '사용자'}님, 반갑습니다.`)
    })
  }, [setStatus, showNotice])

  async function handleLogin() {
    if (!firebaseReady) {
      showNotice('Firebase 환경 변수를 먼저 설정해 주세요.')
      return
    }
    try {
      await startGoogleSignIn()
    } catch {
      showNotice('Google 로그인을 완료하지 못했습니다.')
    }
  }

  const statusLabel = status === 'online' ? '정상' : status === 'checking' ? '확인 중' : status === 'offline' ? '연결 안 됨' : '미확인'

  return (
    <div className="pb-4 pt-7">
      <StatusPill label="SETTINGS" />
      <h1 className="mt-3 text-3xl font-black tracking-[-0.06em]">설정</h1>
      <p className="mt-2 text-sm leading-6 text-soa-muted">초보자에게 필요한 설정만 먼저 보여주고, 전문 설정은 기능 화면 안에 숨깁니다.</p>

      <section className="mt-6 space-y-3">
        <article className="rounded-[26px] border border-soa-line bg-soa-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-black tracking-[-0.035em]">Voice API</h2>
            <StatusPill label={statusLabel} tone={status === 'online' ? 'good' : status === 'offline' ? 'warning' : 'neutral'} />
          </div>
          <p className="mt-2 text-sm leading-6 text-soa-muted">FastAPI가 연결되면 사용 가능한 한국어 엔진을 자동 선택합니다. 연결되지 않으면 브라우저 데모 모드로 동작합니다.</p>
        </article>

        <article className="rounded-[26px] border border-soa-line bg-soa-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-black tracking-[-0.035em]">음성 엔진</h2>
            <StatusPill label={catalog.selected?.mode === 'local' ? 'LOCAL TTS' : catalog.selected?.mode === 'ai' ? 'AI' : 'DEMO'} tone={catalog.selected?.mode !== 'mock' ? 'good' : 'warning'} />
          </div>
          <div className="mt-3 space-y-2">
            {catalog.engines.length > 0 ? catalog.engines.map((engine) => (
              <div key={engine.id} className="rounded-2xl border border-soa-line bg-white/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm">{engine.name}</strong>
                  <StatusPill label={engine.ready ? '사용 가능' : '준비 필요'} tone={engine.ready ? 'good' : 'warning'} />
                </div>
                <p className="mt-1 text-xs font-semibold leading-5 text-soa-muted">{engine.reason ?? `${engine.provider} · ${engine.languages.join(', ')}`}</p>
              </div>
            )) : <p className="text-sm leading-6 text-soa-muted">엔진 목록을 가져오지 못했습니다. 로컬 API 실행 상태를 확인해 주세요.</p>}
          </div>
        </article>

        <article className="rounded-[26px] border border-soa-line bg-soa-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-black tracking-[-0.035em]">계정과 동기화</h2>
            <StatusPill label={firebaseReady ? '준비됨' : '설정 필요'} tone={firebaseReady ? 'good' : 'warning'} />
          </div>
          <p className="mt-2 text-sm leading-6 text-soa-muted">로그인 전에는 프로젝트가 이 기기에만 저장됩니다. Firebase 설정 후 Google 로그인을 연결할 수 있습니다.</p>
          <button type="button" onClick={handleLogin} className="focus-ring mt-4 min-h-12 w-full rounded-2xl border border-soa-line bg-white font-bold">Google로 계속</button>
        </article>

        <article className="rounded-[26px] border border-soa-line bg-soa-card p-5">
          <h2 className="font-black tracking-[-0.035em]">개인정보 원칙</h2>
          <p className="mt-2 text-sm leading-6 text-soa-muted">생성된 WAV는 로컬 API의 임시 폴더에만 보관되며 기본 30분 뒤 정리됩니다. 목소리 복제에는 소유권과 동의 확인 절차가 필수입니다.</p>
        </article>
      </section>
    </div>
  )
}
