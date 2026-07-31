const journey = [
  { label: 'TEXT', detail: '문장' },
  { label: 'VOICE', detail: '생성' },
  { label: 'CLONE', detail: '복제' },
  { label: 'EXPORT', detail: '저장' },
]

const rotatingMessages = [
  '문장을 목소리로.',
  '목소리를 새로운 가능성으로.',
  '한국어의 감정까지 자연스럽게.',
]

function TitleMicrophone({ testId }: { testId?: string }) {
  return (
    <span className="soa-title-mic" aria-hidden="true" data-testid={testId}>
      <i className="soa-title-mic__capsule" />
      <i className="soa-title-mic__yoke" />
      <i className="soa-title-mic__stem" />
      <i className="soa-title-mic__base" />
    </span>
  )
}

function StudioMicrophone() {
  return (
    <div className="soa-studio-mic" aria-hidden="true" data-testid="voice-core-microphone">
      <span className="soa-studio-mic__halo" />
      <span className="soa-studio-mic__body">
        <i className="soa-studio-mic__mesh" />
        <i className="soa-studio-mic__shine" />
      </span>
      <span className="soa-studio-mic__yoke" />
      <span className="soa-studio-mic__stem" />
      <span className="soa-studio-mic__base" />
    </div>
  )
}

export function BrandMasthead() {
  return (
    <header className="soa-masthead" aria-label="곰같은여우 SoriON AI 소개">
      <div className="soa-masthead__inner">
        <div className="soa-meta-bar">
          <div className="soa-meta-group" aria-label="빌드와 호환 정보">
            <span className="soa-meta-label">BUILD</span>
            <strong>v0.5.5</strong>
            <span className="soa-meta-divider" aria-hidden="true" />
            <span className="soa-device-mark" aria-hidden="true"><i /><b /></span>
            <span>모바일 · PC 호환</span>
            <span className="soa-meta-divider hidden sm:block" aria-hidden="true" />
            <span className="hidden tracking-[0.16em] text-white/[0.38] sm:inline">KOREAN-FIRST VOICE PLATFORM</span>
          </div>
          <div className="soa-meta-group shrink-0">
            <span className="soa-meta-label hidden sm:inline">DESIGNED BY</span>
            <strong className="text-white/[0.88]">곰같은여우</strong>
          </div>
        </div>

        <div className="soa-hero-grid">
          <div className="soa-banner-copy">
            <div className="soa-eyebrow">
              <span className="soa-eyebrow-mark" aria-hidden="true" />
              <span>AI VOICE WORKSPACE</span>
              <span className="soa-meta-divider" aria-hidden="true" />
              <span className="text-white/[0.35]">MOBILE FIRST</span>
            </div>

            <h1 className="soa-brand-heading" aria-label="곰같은여우 SoriON AI">
              <span className="sr-only">곰같은여우 SoriON AI</span>
              <span className="soa-message-stage" aria-hidden="true">
                <span className="soa-message-slide soa-message-slide--brand">
                  <span className="soa-brand-owner">곰같은여우</span>
                  <span className="soa-brand-gradient">
                    <span>SoriON A</span><TitleMicrophone testId="brand-title-microphone" />
                  </span>
                </span>
                {rotatingMessages.map((message) => (
                  <span key={message} className="soa-message-slide soa-message-slide--copy">{message}</span>
                ))}
              </span>
            </h1>

            <div className="soa-journey" aria-label="핵심 작업 흐름">
              {journey.map((item, index) => (
                <div key={item.label} className="soa-journey__item">
                  <span className="soa-journey__line" aria-hidden="true" />
                  <span className="soa-journey__time">00:{String(index * 3).padStart(2, '0')}</span>
                  <span className="soa-journey__label">{item.label}</span>
                  <span className="soa-journey__detail">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="soa-voice-console" aria-hidden="true">
            <div className="soa-voice-console__glow" />
            <div className="soa-voice-console__topline">
              <span>VOICE CORE</span>
              <span className="soa-live-dot">ONLINE</span>
            </div>
            <StudioMicrophone />
            <div className="soa-voice-console__copy">
              <strong>소리의 가능성을 켜다.</strong>
              <span>SoriON Voice Engine</span>
            </div>
            <div className="soa-wave-bars">
              {[18, 30, 48, 26, 56, 38, 62, 34, 52, 24, 44, 20].map((height, index) => (
                <i key={`${height}-${index}`} style={{ height }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
