import { useState } from 'react'
import { injectRecoveryPath, type RecoveryInjectionResult } from '../../quality/recoveryInjection'
import { StatusPill } from '../ui/StatusPill'

export function RecoveryInjectionCard() {
  const [result, setResult] = useState<RecoveryInjectionResult | null>(null)
  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">RECOVERY PATH INJECTION</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">복귀 처리 경로 점검</h2>
        </div>
        <StatusPill label={result ? '주입 완료' : '대기'} tone={result ? 'good' : 'neutral'} />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
        실제 Wi-Fi를 끊거나 기기를 절전시키지 않습니다. 온라인 복귀·페이지 복귀·네트워크 종류 변경 때 앱이 실행하는 이벤트 경로만 안전하게 주입합니다.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button type="button" onClick={() => setResult(injectRecoveryPath('online-resume'))} className="focus-ring min-h-11 rounded-xl border border-soa-line bg-white px-3 text-xs font-black">온라인 복귀 경로</button>
        <button type="button" onClick={() => setResult(injectRecoveryPath('page-resume'))} className="focus-ring min-h-11 rounded-xl border border-soa-line bg-white px-3 text-xs font-black">절전·페이지 복귀 경로</button>
        <button type="button" onClick={() => setResult(injectRecoveryPath('network-change'))} className="focus-ring min-h-11 rounded-xl border border-soa-line bg-white px-3 text-xs font-black">네트워크 변경 경로</button>
      </div>
      {result ? (
        <div className="mt-3 rounded-xl bg-white p-3 text-xs font-bold leading-5">
          <p>{result.detail}</p>
          <p className="text-soa-muted">이벤트: {result.events.join(' → ') || '없음'} · {new Date(result.injectedAt).toLocaleString('ko-KR')}</p>
          {!result.supported ? <p className="text-soa-coral">Network Information API 자체는 이 브라우저에서 지원되지 않습니다.</p> : null}
        </div>
      ) : null}
    </section>
  )
}
