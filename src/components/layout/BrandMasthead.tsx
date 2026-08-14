import { useAppStore, type LiveVoiceReadiness } from '../../store/useAppStore'
import { currentBuildInfo } from '../../update/buildInfo'
import { BrandIcon } from '../ui/BrandIcon'

const subtitles = [
  '장문 내용을 문장별 음성으로 빠르게.',
  '한국어의 감정과 호흡을 더 자연스럽게.',
  '생성부터 내 목소리와 편집까지 한 작업공간에서.',
]

const readinessLabels: Record<LiveVoiceReadiness, string> = {
  checking: 'CHECKING',
  ready: 'READY',
  limited: 'LIMITED',
  offline: 'OFFLINE',
  generating: 'LIVE',
}

function LightningWave({ active }: { active: boolean }) {
  return (
    <div className={`soa-core-wave ${active ? 'is-active' : ''}`} aria-hidden="true">
      <span />
      <b />
      {[18, 38, 68, 30, 88, 44, 74, 26, 94, 48, 66, 22, 58, 34, 82, 28, 62, 40].map((height, index) => (
        <i key={`${height}-${index}`} style={{ height: `${height}%` }} />
      ))}
    </div>
  )
}

export function BrandMasthead() {
  const enterWorkspace = useAppStore((state) => state.enterWorkspace)
  const exitWorkspace = useAppStore((state) => state.exitWorkspace)
  const liveVoice = useAppStore((state) => state.liveVoice)
  const live = liveVoice.readiness === 'generating'
  const ready = liveVoice.readiness === 'ready' || live

  return (
    <header className="soa-masthead" aria-label="곰같은여우 SoriON AI 소개">
      <div className="soa-masthead__inner">
        <div className="soa-meta-bar">
          <div className="soa-meta-group">
            <span className="soa-meta-label">VERSION</span><strong>v{currentBuildInfo.appVersion}</strong>
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

          <section
            className={`soa-voice-console is-${liveVoice.readiness}`}
            aria-label={`현재 목소리 ${liveVoice.voiceName}, ${liveVoice.engineName}, ${readinessLabels[liveVoice.readiness]}`}
          >
            <div className="soa-live-voice-glow" aria-hidden="true" />
            <div className="soa-voice-console__topline">
              <span className="soa-live-voice-signature"><i aria-hidden="true" /> SORION · LIVE VOICE</span>
              <span className="soa-live-dot" data-ready={ready ? 'true' : 'false'}>{readinessLabels[liveVoice.readiness]}</span>
            </div>

            <div className="soa-live-voice-main">
              <div className={`soa-live-voice-avatar ${liveVoice.voiceKind === 'my-voice' ? 'is-mine' : ''}`} aria-hidden="true">
                <span className="soa-live-voice-avatar__ring" />
                {liveVoice.voiceKind === 'my-voice'
                  ? <strong>{liveVoice.voiceName.trim().slice(0, 1) || 'V'}</strong>
                  : <BrandIcon className="soa-console-brand-icon" />}
              </div>

              <div className="soa-voice-console__copy">
                <span className="soa-live-voice-kind">{liveVoice.voiceKind === 'my-voice' ? 'MY VOICE' : 'SoriON VOICE'}</span>
                <strong>{liveVoice.voiceName}</strong>
                <span>{liveVoice.detail}</span>
              </div>
            </div>

            <div className="soa-live-voice-signal" aria-hidden="true">
              <span className="soa-live-voice-signal__label">VOICE SIGNAL</span>
              <LightningWave active={ready} />
            </div>

            <div className="soa-live-engine">
              <span>ENGINE</span>
              <strong>{liveVoice.engineName}</strong>
              <small>{liveVoice.engineId ?? 'auto routing'}</small>
            </div>

            <button type="button" className="soa-live-voice-open" onClick={() => enterWorkspace('home')}>
              <span>텍스트를 음성으로</span>
              <b aria-hidden="true">→</b>
            </button>
          </section>
        </div>
      </div>
    </header>
  )
}
