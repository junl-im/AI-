const journey = [
  { label: 'TEXT', detail: '문장' },
  { label: 'VOICE', detail: '생성' },
  { label: 'CLONE', detail: '복제' },
  { label: 'EXPORT', detail: '저장' },
]

export function BrandMasthead() {
  return (
    <header className="soa-masthead" aria-label="곰같은여우 SoriON AI 소개">
      <div className="soa-masthead__inner">
        <div className="soa-meta-bar">
          <div className="soa-meta-group" aria-label="빌드와 호환 정보">
            <span className="soa-meta-label">BUILD</span>
            <strong>v0.4.0</strong>
            <span className="soa-meta-divider" aria-hidden="true" />
            <span className="soa-device-mark" aria-hidden="true">
              <i />
              <b />
            </span>
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
          <div className="min-w-0">
            <div className="soa-eyebrow">
              <span className="soa-eyebrow-mark" aria-hidden="true" />
              <span>AI VOICE WORKSPACE</span>
              <span className="soa-meta-divider" aria-hidden="true" />
              <span className="text-white/[0.35]">MOBILE FIRST</span>
            </div>

            <h1 className="soa-brand-title" aria-label="곰같은여우 SoriON AI">
              <span className="soa-brand-owner">곰같은여우</span>
              <span className="soa-brand-gradient">SoriON AI</span>
            </h1>

            <p className="soa-brand-copy">
              문장을 목소리로, 목소리를 새로운 가능성으로. 한국인을 위해 처음부터 설계한 차세대 AI Voice Platform입니다.
            </p>

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
              <span className="soa-live-dot">PILOT</span>
            </div>
            <div className="soa-sound-orb">
              <span>S</span>
            </div>
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
