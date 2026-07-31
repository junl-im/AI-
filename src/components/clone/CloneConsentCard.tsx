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

  return (
    <section className="soa-clone-card" aria-labelledby="clone-consent-title">
      <div className="soa-clone-card__head">
        <div><span>STEP 03</span><h2 id="clone-consent-title">권한과 사용 목적 확인</h2></div>
      </div>
      <label className="soa-clone-name">
        목소리 이름
        <input
          value={displayName}
          maxLength={40}
          placeholder="예: 내 내레이션 목소리"
          onChange={(event: ChangeEvent<HTMLInputElement>) => onDisplayName(event.target.value)}
        />
      </label>
      <div className="soa-consent-list">
        <label><input type="checkbox" checked={consent.rightsConfirmed} onChange={() => toggle('rightsConfirmed')} />본인 목소리이거나 명시적인 사용 권한을 받았습니다.</label>
        <label><input type="checkbox" checked={consent.disclosureConfirmed} onChange={() => toggle('disclosureConfirmed')} />필요한 경우 AI 합성 음성임을 이용자에게 알리겠습니다.</label>
        <label><input type="checkbox" checked={consent.prohibitedUseConfirmed} onChange={() => toggle('prohibitedUseConfirmed')} />사칭·사기·기만·동의 없는 복제에 사용하지 않겠습니다.</label>
      </div>
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
      <button type="button" className="soa-clone-submit" disabled={disabled} onClick={onSubmit}>
        목소리 샘플 준비하기
      </button>
      <small>원본 음성은 기본적으로 이 기기의 IndexedDB에 저장됩니다. 서버 연결 시에도 실제 복제 모델이 준비되지 않았다면 샘플 준비 상태로만 표시합니다.</small>
    </section>
  )
}
