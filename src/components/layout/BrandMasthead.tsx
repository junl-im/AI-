import { useAppStore } from '../../store/useAppStore'

const subtitles = [
  '문장을 목소리로, 목소리를 새로운 가능성으로.',
  '한국어의 감정과 호흡을 더 자연스럽게.',
  '생성부터 복제와 변환까지, 모바일에서 빠르게.',
]

function TitleMicrophone() {
  return <span className="soa-title-mic" aria-hidden="true" data-testid="brand-title-microphone"><i /><i /><i /><i /></span>
}

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

  return (
    <header className="soa-masthead" aria-label="곰같은여우 SoriON AI 소개">
      <div className="soa-masthead__inner">
        <div className="soa-meta-bar">
          <div className="soa-meta-group">
            <span className="soa-meta-label">BUILD</span><strong>v0.8.1</strong>
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
            <div className="soa-eyebrow"><span className="soa-eyebrow-mark" aria-hidden="true" />AI VOICE WORKSPACE</div>
            <h1 className="soa-brand-heading" aria-label="곰같은여우 SoriON AI">
              <span className="soa-brand-owner">곰같은여우</span>
              <span className="soa-brand-gradient">SoriON A<TitleMicrophone /></span>
            </h1>
            <div className="soa-subtitle-stage" aria-label="SoriON 소개 문장">
              {subtitles.map((text) => <p key={text}>{text}</p>)}
            </div>
          </div>

          <div className="soa-voice-console" aria-hidden="true">
            <div className="soa-voice-console__topline"><span>VOICE CORE</span><span className="soa-live-dot">ONLINE</span></div>
            <div className="soa-console-mic" data-testid="voice-core-microphone"><i /><i /><i /><i /></div>
            <div className="soa-voice-console__copy"><strong>소리의 가능성을 켜다.</strong><span>SoriON Voice Engine</span></div>
            <LightningWave />
          </div>
        </div>
      </div>
    </header>
  )
}
