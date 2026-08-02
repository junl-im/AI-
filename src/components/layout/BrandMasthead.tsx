import { useAppStore } from '../../store/useAppStore'
import { BrandIcon } from '../ui/BrandIcon'

const subtitles = [
  '장문 원고를 문장별 음성으로 빠르게.',
  '한국어의 감정과 호흡을 더 자연스럽게.',
  '생성부터 복제와 편집까지 한 작업공간에서.',
]

function LightningWave() {
  return (
    <div className="soa-core-wave" aria-hidden="true">
      <span />
      <b />
      {[22, 42, 78, 34, 92, 46, 70, 28, 84, 38, 62, 24].map((height, index) => (
        <i key={`${height}-${index}`} style={{ height: `${height}%` }} />
      ))}
    </div>
  )
}

export function BrandMasthead() {
  const enterWorkspace = useAppStore((state) => state.enterWorkspace)
  const exitWorkspace = useAppStore((state) => state.exitWorkspace)

  return (
    <header className="soa-masthead" aria-label="곰같은여우 SoriON AI 소개">
      <div className="soa-masthead__inner">
        <div className="soa-meta-bar">
          <div className="soa-meta-group">
            <span className="soa-meta-label">BUILD</span><strong>v0.9.3-alpha.1</strong>
            <span className="soa-meta-divider" aria-hidden="true" />
            <span className="soa-device-mark" aria-hidden="true"><i /><b /></span>
            <span>모바일 · PC 호환</span>
          </div>
          <div className="soa-meta-group shrink-0">
            <span className="soa-meta-label hidden sm:inline">DESIGNED BY</span>
            <strong>곰같은여우</strong>
            <button type="button" className="soa-settings-button" onClick={() => enterWorkspace('settings')} aria-label="설정 열기">⚙</button>
          </div>
        </div>

        <div className="soa-hero-grid">
          <div className="soa-banner-copy">
            <button
              type="button"
              className="soa-main-brand"
              onClick={exitWorkspace}
              aria-label="SoriON AI 첫 페이지"
            >
              <BrandIcon className="soa-main-brand__icon" />
              <span>
                <small>AI VOICE WORKSPACE</small>
                <strong role="heading" aria-level={1} aria-label="곰같은여우 SoriON AI">
                  <i>곰같은여우</i>
                  SoriON AI
                </strong>
              </span>
            </button>
            <div className="soa-subtitle-stage" aria-label="SoriON 소개 문장">
              {subtitles.map((text) => <p key={text}>{text}</p>)}
            </div>
          </div>

          <div className="soa-voice-console" aria-hidden="true">
            <div className="soa-voice-console__topline"><span>VOICE CORE</span><span className="soa-live-dot">AUTO</span></div>
            <BrandIcon className="soa-console-brand-icon" />
            <div className="soa-voice-console__copy"><strong>목소리의 가능성을 켜다.</strong><span>SoriON Voice Engine</span></div>
            <LightningWave />
          </div>
        </div>
      </div>
    </header>
  )
}
