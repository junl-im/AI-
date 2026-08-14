import type { ChangeEvent } from 'react'
import type { VoiceCloneConsent } from '../../voiceclone/voiceCloneTypes'

interface CloneConsentCardProps {
  displayName: string
  consent: VoiceCloneConsent
  disabled: boolean
  onDisplayName: (value: string) => void
  onConsent: (value: VoiceCloneConsent) => void
  onSubmit: () => void
}

export function CloneConsentCard({
  displayName,
  consent,
  disabled,
  onDisplayName,
  onConsent,
  onSubmit,
}: CloneConsentCardProps) {
  function toggle(key: keyof Pick<VoiceCloneConsent,
    'rightsConfirmed' | 'disclosureConfirmed' | 'prohibitedUseConfirmed'>) {
    onConsent({ ...consent, [key]: !consent[key] })
  }

  const confirmedCount = [
    consent.rightsConfirmed,
    consent.disclosureConfirmed,
    consent.prohibitedUseConfirmed,
  ].filter(Boolean).length

  return (
    <section className="soa-clone-card soa-myvoice-consent" aria-labelledby="clone-consent-title">
      <div className="soa-clone-card__head">
        <div><span>STEP 03</span><h2 id="clone-consent-title">이름 지정 · 권한 확인</h2></div>
        <strong className="soa-myvoice-consent__count">{confirmedCount}/3 확인</strong>
      </div>
      <p className="soa-myvoice-section-copy">내가 직접 만들었거나 명시적으로 사용할 권리가 있는 목소리만 저장할 수 있습니다.</p>
      <label className="soa-clone-name">
        내 목소리 이름
        <input
          value={displayName}
          maxLength={40}
          placeholder="예: 따뜻한 내레이션 · 메인"
          onChange={(event: ChangeEvent<HTMLInputElement>) => onDisplayName(event.target.value)}
        />
      </label>
      <div className="soa-consent-list">
        <label><input type="checkbox" checked={consent.rightsConfirmed} onChange={() => toggle('rightsConfirmed')} />본인 목소리이거나 명시적인 사용 권한을 받았습니다.</label>
        <label><input type="checkbox" checked={consent.disclosureConfirmed} onChange={() => toggle('disclosureConfirmed')} />필요한 경우 AI 합성 음성임을 이용자에게 알리겠습니다.</label>
        <label><input type="checkbox" checked={consent.prohibitedUseConfirmed} onChange={() => toggle('prohibitedUseConfirmed')} />사칭·사기·기만·동의 없는 복제에 사용하지 않겠습니다.</label>
      </div>
      <label className="soa-myvoice-purpose">
        사용 목적
        <select
          aria-label="사용 목적"
          value={consent.allowedPurpose}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onConsent({
            ...consent,
            allowedPurpose: event.target.value as VoiceCloneConsent['allowedPurpose'],
          })}
        >
          <option value="personal">개인 창작</option>
          <option value="content">콘텐츠 제작</option>
          <option value="accessibility">접근성·보조 의사소통</option>
        </select>
      </label>
      <button type="button" className="soa-clone-submit" disabled={disabled} onClick={onSubmit}>
        내 목소리 저장하고 테스트하기
      </button>
      <small>원본은 기본적으로 이 기기의 IndexedDB에 우선 저장됩니다. 서버에 실제 생성 엔진이 준비되지 않은 경우에도 샘플 프로필은 로컬에서 관리할 수 있습니다.</small>
    </section>
  )
}
