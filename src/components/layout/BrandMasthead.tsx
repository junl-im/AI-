import type { CSSProperties } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { currentBuildInfo } from '../../update/buildInfo'
import { BrandIcon } from '../ui/BrandIcon'

const subtitles = [
  '장문 내용을 문장별 음성으로 빠르게.',
  '한국어의 감정과 호흡을 더 자연스럽게.',
  '생성부터 내 목소리와 편집까지 한 작업공간에서.',
]

const waveformBars = [18, 32, 48, 70, 42, 86, 54, 34, 66, 92, 58, 38, 74, 44, 28, 52]

export function BrandMasthead() {
  const enterWorkspace = useAppStore((state) => state.enterWorkspace)
  const exitWorkspace = useAppStore((state) => state.exitWorkspace)

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

          <section className="soa-signature-visual" aria-label="SoriON 음성 브랜드 비주얼">
            <div className="soa-signature-visual__aurora" aria-hidden="true" />
            <div className="soa-signature-visual__copy">
              <span>SORI ON · VOICE / EMOTION / RHYTHM</span>
              <strong>목소리에<br />감정을 입히다.</strong>
              <small>자연스러운 한국어 AI Voice를 위한 SoriON Signature.</small>
            </div>
            <div className="soa-signature-visual__signal" aria-hidden="true">
              <span className="soa-signature-orbit is-outer" />
              <span className="soa-signature-orbit is-inner" />
              <span className="soa-signature-core"><i /></span>
              <div className="soa-signature-wave">
                {waveformBars.map((height, index) => (
                  <i key={`${height}-${index}`} style={{ '--signal-height': `${height}%` } as CSSProperties} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </header>
  )
}
