import type { DeviceBenchmarkSummary, DeviceCertificationScenario } from '../../quality/qualityTypes'
import { StatusPill } from '../ui/StatusPill'

interface DeviceEvidenceCardProps {
  summary: DeviceBenchmarkSummary | null
  loading: boolean
  onRefresh: () => void
}

const labels = {
  cuda: 'Windows CUDA',
  'apple-silicon': 'Apple Silicon',
  cpu: 'CPU 저속 모드',
  android: 'Android Chrome',
  ios: 'iOS Safari',
}

const certificationLabels: Record<DeviceCertificationScenario, string> = {
  baseline: '기본 재생',
  'network-switch': '네트워크 전환',
  'background-resume': '백그라운드 복귀',
  'installed-pwa': '설치형 PWA',
}

export function DeviceEvidenceCard({ summary, loading, onRefresh }: DeviceEvidenceCardProps) {
  const completed = summary?.coverage.filter((item) => item.recorded).length ?? 0
  const total = summary?.coverage.length ?? 15
  const certified = summary?.certificationCoverage.filter((item) => item.latestStatus === 'ready').length ?? 0
  const certificationTotal = summary?.certificationCoverage.length ?? 24
  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">REAL DEVICE EVIDENCE</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">실기기 측정·인증표</h2>
        </div>
        <StatusPill
          label={loading ? '확인 중' : `${completed}/${total}`}
          tone={completed === total ? 'good' : 'warning'}
        />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
        10·30·60분 생성 측정과 모바일의 재생·SSE·음원 복구 시나리오를 분리합니다. 기록만 존재하는 항목은 인증 완료로 계산하지 않습니다.
      </p>
      {summary ? (
        <div className="mt-4 space-y-3">
          {Object.entries(labels).map(([profile, label]) => {
            const rows = summary.coverage.filter((item) => item.profile === profile)
            return (
              <div key={profile} className="rounded-2xl border border-soa-line bg-white p-3">
                <strong className="text-xs">{label}</strong>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] font-black">
                  {rows.map((item) => (
                    <span
                      key={`${profile}-${item.sampleMinutes}`}
                      className={`rounded-xl p-2 text-center ${item.recorded ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f4f2ec] text-soa-muted'}`}
                    >
                      {item.sampleMinutes}분 {item.recorded ? '✓' : '대기'}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
          <div className="rounded-2xl border border-soa-line bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-xs">모바일 시나리오 인증</strong>
              <span className="text-[10px] font-black text-soa-muted">READY {certified}/{certificationTotal}</span>
            </div>
            <div className="mt-3 space-y-2">
              {(['android', 'ios'] as const).map((profile) => (
                <div key={profile}>
                  <span className="text-[10px] font-black text-soa-muted">{labels[profile]}</span>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {(Object.keys(certificationLabels) as DeviceCertificationScenario[]).map((scenario) => {
                      const rows = summary.certificationCoverage.filter((item) => item.profile === profile && item.scenario === scenario)
                      const ready = rows.filter((item) => item.latestStatus === 'ready').length
                      const recorded = rows.filter((item) => item.recorded).length
                      return (
                        <span key={`${profile}-${scenario}`} className={`rounded-xl p-2 text-[10px] font-black ${ready === 3 ? 'bg-emerald-50 text-emerald-700' : recorded ? 'bg-amber-50 text-amber-700' : 'bg-[#f4f2ec] text-soa-muted'}`}>
                          {certificationLabels[scenario]} · {ready}/3
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] font-bold text-soa-muted">
            기록 {summary.totalRecords} · 통과 {summary.readyRecords} · 경고 {summary.warningRecords} · 실패 {summary.failedRecords}
          </p>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-[#f4f2ec] p-4 text-sm font-semibold text-soa-muted">
          로컬 API가 연결되면 실기기 측정 진행률을 불러옵니다.
        </p>
      )}
      <button type="button" onClick={onRefresh} disabled={loading} className="focus-ring mt-4 min-h-11 w-full rounded-2xl border border-soa-line bg-white text-xs font-black disabled:opacity-50">
        측정표 다시 불러오기
      </button>
    </section>
  )
}
