import { useEffect } from 'react'
import { WorkspacePageHeader } from '../components/layout/WorkspacePageHeader'
import { StatusPill } from '../components/ui/StatusPill'
import { consumeGoogleSignInResult, isFirebaseConfigured, startGoogleSignIn } from '../firebase/firebaseClient'
import { useAppStore } from '../store/useAppStore'

export function SettingsPage() {
  const showNotice = useAppStore((state) => state.showNotice)
  const firebaseReady = isFirebaseConfigured()

  useEffect(() => {
    void consumeGoogleSignInResult().then((user) => {
      if (user) showNotice(`${user.displayName ?? '사용자'}님, 반갑습니다.`)
    })
  }, [showNotice])

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

  return (
    <div className="soa-secondary-page">
      <WorkspacePageHeader
        eyebrow="SETTINGS · SIMPLE BY DEFAULT"
        title="설정"
        description="연결과 엔진 선택은 시스템이 자동으로 관리합니다. 여기에는 계정과 개인정보처럼 사용자가 결정해야 하는 항목만 둡니다."
      />

      <section className="mt-6 space-y-3">
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
