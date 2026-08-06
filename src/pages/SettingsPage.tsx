import { useEffect, useState } from 'react'
import { EngineBlueprintCard } from '../components/evaluation/EngineBlueprintCard'
import { AppUpdateStatusCard } from '../components/evaluation/AppUpdateStatusCard'
import { EngineDoctorCard } from '../components/evaluation/EngineDoctorCard'
import { WorkspacePageScaffold } from '../components/layout/WorkspacePageScaffold'
import { StatusPill } from '../components/ui/StatusPill'
import { consumeGoogleSignInResult, isFirebaseConfigured, startGoogleSignIn } from '../firebase/firebaseClient'
import { useEngineBlueprint } from '../hooks/useEngineBlueprint'
import { useEngineCatalog } from '../hooks/useEngineCatalog'
import { useAppStore } from '../store/useAppStore'

function AdvancedEngineDiagnostics() {
  const engineBlueprint = useEngineBlueprint()
  return (
    <div className="mt-4 space-y-3">
      <EngineDoctorCard />
      <EngineBlueprintCard
        blueprint={engineBlueprint.blueprint}
        loading={engineBlueprint.loading}
        error={engineBlueprint.error}
        onRefresh={() => void engineBlueprint.refresh()}
      />
    </div>
  )
}

export function SettingsPage() {
  const showNotice = useAppStore((state) => state.showNotice)
  const firebaseReady = isFirebaseConfigured()
  const engineCatalog = useEngineCatalog()
  const [advancedOpen, setAdvancedOpen] = useState(false)

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
    <WorkspacePageScaffold
      eyebrow="SETTINGS · SIMPLE BY DEFAULT"
      title="설정"
      description="음성 준비와 연결은 시스템이 자동으로 관리합니다. 여기에는 계정과 개인정보처럼 사용자가 결정해야 하는 항목만 둡니다."
    >
      <section className="space-y-3">
        <article className="rounded-[26px] border border-soa-line bg-soa-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black tracking-[-0.035em]">음성 자동 준비</h2>
            <StatusPill
              label={engineCatalog.selected ? '준비됨' : engineCatalog.loading ? '준비 중' : '자동 복구 중'}
              tone={engineCatalog.selected ? 'good' : 'warning'}
            />
          </div>
          <p className="mt-2 text-sm leading-6 text-soa-muted">
            가장 적합한 무료 음성 방식을 자동으로 선택하고 연결 상태를 계속 유지합니다. 사용자가 주소나 기술 방식을 직접 고를 필요가 없습니다.
          </p>
        </article>
        <AppUpdateStatusCard />
        <details
          className="rounded-[26px] border border-soa-line bg-soa-card p-5"
          onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
        >
          <summary className="cursor-pointer list-none font-black tracking-[-0.035em]">
            고급 진단 및 개발자 정보
          </summary>
          <p className="mt-2 text-xs leading-5 text-soa-muted">
            일반 사용에는 필요하지 않습니다. 배포·장치·모델 문제를 확인할 때만 열어 주세요.
          </p>
          {advancedOpen ? <AdvancedEngineDiagnostics /> : null}
        </details>
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
          <p className="mt-2 text-sm leading-6 text-soa-muted">생성된 WAV는 이 기기의 임시 폴더에만 보관되며 기본 30분 뒤 정리됩니다. 목소리 복제에는 소유권과 동의 확인 절차가 필수입니다.</p>
        </article>
      </section>
    </WorkspacePageScaffold>
  )
}
