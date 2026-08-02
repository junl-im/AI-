import { useEffect } from 'react'
import type { VoiceEmotion } from '../../ai/contracts'

interface VoiceSettingsSheetProps {
  open: boolean
  speed: number
  pitch: number
  emotion: VoiceEmotion
  normalizeText: boolean
  supportsSpeed: boolean
  supportsPitch: boolean
  supportsEmotion: boolean
  onClose: () => void
  onSpeedChange: (value: number) => void
  onPitchChange: (value: number) => void
  onEmotionChange: (value: VoiceEmotion) => void
  onNormalizeTextChange: (value: boolean) => void
  onPreview: () => void
}

const emotions: Array<{ value: VoiceEmotion; label: string }> = [
  { value: 'neutral', label: '기본' },
  { value: 'calm', label: '차분' },
  { value: 'happy', label: '밝게' },
  { value: 'commercial', label: '광고' },
]

export function VoiceSettingsSheet({
  open,
  speed,
  pitch,
  emotion,
  normalizeText,
  supportsSpeed,
  supportsPitch,
  supportsEmotion,
  onClose,
  onSpeedChange,
  onPitchChange,
  onEmotionChange,
  onNormalizeTextChange,
  onPreview,
}: VoiceSettingsSheetProps) {
  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="soa-sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="soa-bottom-sheet soa-voice-settings-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="soa-sheet-handle" aria-hidden="true" />
        <header className="soa-sheet-header">
          <button type="button" onClick={onClose} aria-label="음성 설정 닫기">‹</button>
          <h2 id="voice-settings-title">음성 설정</h2>
          <span />
        </header>

        <label>
          <span><b>속도</b><strong>{speed.toFixed(2)}× · {supportsSpeed ? '현재 엔진 적용' : '지원 엔진 자동 선택'}</strong></span>
          <input
            type="range"
            min="0.7"
            max="1.4"
            step="0.05"
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
          />
        </label>
        <label>
          <span><b>높낮이</b><strong>{pitch > 0 ? '+' : ''}{pitch} · {supportsPitch ? '현재 엔진 적용' : '지원 엔진 자동 선택'}</strong></span>
          <input
            type="range"
            min="-6"
            max="6"
            step="1"
            value={pitch}
            onChange={(event) => onPitchChange(Number(event.target.value))}
          />
        </label>

        <div className="soa-emotion-settings">
          <span><b>말투</b><strong>{supportsEmotion ? '현재 엔진 적용' : '지원 엔진 자동 선택'}</strong></span>
          <div>
            {emotions.map((item) => (
              <button
                key={item.value}
                type="button"
                className={emotion === item.value ? 'is-active' : ''}
                onClick={() => onEmotionChange(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <label className="soa-normalize-setting">
          <span><b>한국어 숫자·기호 읽기 보정</b><small>전화번호, 날짜, 단위의 발음을 자연스럽게 정리합니다.</small></span>
          <input
            type="checkbox"
            checked={normalizeText}
            onChange={(event) => onNormalizeTextChange(event.target.checked)}
          />
        </label>

        <div className="soa-sheet-actions is-single">
          <button type="button" className="is-primary" onClick={onPreview}>
            ▶ 현재 설정 적용 · 재생
          </button>
        </div>
      </section>
    </div>
  )
}
