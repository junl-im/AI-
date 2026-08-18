import { useEffect, useState } from 'react'
import {
  confirmFieldDeviceCertificationEvidence,
  downloadFieldDeviceCertificationEvidence,
  getFieldDeviceCertificationStatus,
  loadFieldDeviceCertificationEvidence,
  resetFieldDeviceCertificationEvidence,
  type FieldDeviceCertificationEvidence,
} from '../../quality/fieldDeviceCertification'
import { StatusPill } from '../ui/StatusPill'

const surfaceLabels: Record<FieldDeviceCertificationEvidence['surface'], string> = {
  'kakao-android': '카카오톡 Android',
  'kakao-ios': '카카오톡 iPhone/iPad',
  'android-browser': 'Android 브라우저',
  'ios-browser': 'iOS 브라우저',
  'desktop-browser': 'Desktop 브라우저',
}

function checkClass(passed: boolean) {
  return passed ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f4f2ec] text-soa-muted'
}

export function FieldDeviceCertificationCard() {
  const [evidence, setEvidence] = useState(() => loadFieldDeviceCertificationEvidence())

  useEffect(() => {
    const refresh = () => setEvidence(loadFieldDeviceCertificationEvidence())
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])

  const status = getFieldDeviceCertificationStatus(evidence)
  const fallbackObserved = evidence.checks.presetPreviewFailure !== 'none' && evidence.checks.externalBrowserRequested
  const previewObserved = evidence.checks.presetPreviewStarted || fallbackObserved

  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">FIELD DEVICE CERTIFICATION</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">카카오 실기기 동작 인증</h2>
        </div>
        <StatusPill label={status === 'ready' ? 'READY' : 'PENDING'} tone={status === 'ready' ? 'good' : 'warning'} />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
        실제 카카오톡 WebView에서 발생한 미리듣기·fallback·뒤로가기 동작만 로컬에 기록합니다. Chromium fixture나 synthetic 이벤트로 READY를 만들지 않습니다.
      </p>

      <div className="mt-4 rounded-2xl border border-soa-line bg-white p-4">
        <strong className="text-sm">{surfaceLabels[evidence.surface]}</strong>
        <p className="mt-1 text-[10px] font-bold text-soa-muted">전체 User-Agent, 음성 원본, 프로젝트 문장은 저장하지 않습니다.</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-black">
        <span className={`rounded-xl p-3 ${checkClass(evidence.checks.presetPreviewAttempted)}`}>미리듣기 탭 {evidence.checks.presetPreviewAttempted ? '관찰' : '대기'}</span>
        <span className={`rounded-xl p-3 ${checkClass(previewObserved)}`}>재생/Fallback {previewObserved ? '관찰' : '대기'}</span>
        <span className={`rounded-xl p-3 ${checkClass(evidence.checks.exitDialogOpened)}`}>뒤로가기 팝업 {evidence.checks.exitDialogOpened ? '관찰' : '대기'}</span>
        <span className={`rounded-xl p-3 ${checkClass(evidence.checks.exitStayClosed)}`}>계속 만들기 닫힘 {evidence.checks.exitStayClosed ? '관찰' : '대기'}</span>
      </div>

      {evidence.checks.presetPreviewFailure !== 'none' ? (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[10px] font-black text-amber-800">
          WebView 재생 결과: {evidence.checks.presetPreviewFailure} · 외부 브라우저 요청 {evidence.checks.externalBrowserRequested ? '관찰됨' : '아직 없음'}
        </p>
      ) : null}

      <label className="mt-3 flex items-start gap-2 rounded-2xl border border-soa-line bg-white p-3 text-xs font-bold leading-5">
        <input
          type="checkbox"
          checked={evidence.operatorConfirmed}
          onChange={(event) => setEvidence(confirmFieldDeviceCertificationEvidence(event.target.checked))}
          className="mt-1"
        />
        <span>이 기록이 실제 카카오톡 Android/iOS 기기에서 직접 수행한 결과임을 확인합니다.</span>
      </label>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setEvidence(resetFieldDeviceCertificationEvidence())} className="focus-ring min-h-11 rounded-2xl border border-soa-line bg-white text-xs font-black">기록 초기화</button>
        <button type="button" onClick={() => downloadFieldDeviceCertificationEvidence(evidence)} className="focus-ring min-h-11 rounded-2xl bg-soa-ink text-xs font-black text-white">인증 JSON 저장</button>
      </div>
    </section>
  )
}
