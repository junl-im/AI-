import type { VoiceEmotion } from '../../ai/contracts'
import { useModalDialog } from '../../hooks/useModalDialog'
import {
  formatPitch,
  VOICE_EMOTION_OPTIONS,
  VOICE_PITCH_CONTROL,
  VOICE_SPEED_CONTROL,
} from '../../voice/voiceControlOptions'

interface VoiceSettingsSheetProps {
  open: boolean
  speed: number
  pitch: number
  emotion: VoiceEmotion
  normalizeText: boolean
  supportsSpeed: boolean
  supportsPitch: boolean
  supportsEmotion: boolean
  previewing: boolean
  onClose: () => void
  onSpeedChange: (value: number) => void
  onPitchChange: (value: number) => void
  onEmotionChange: (value: VoiceEmotion) => void
  onNormalizeTextChange: (value: boolean) => void
  onPreview: () => void
}

export function VoiceSettingsSheet({
  open,
  speed,
  pitch,
  emotion,
  normalizeText,
  supportsSpeed,
  supportsPitch,
  supportsEmotion,
  previewing,
  onClose,
  onSpeedChange,
  onPitchChange,
  onEmotionChange,
  onNormalizeTextChange,
  onPreview,
}: VoiceSettingsSheetProps) {
  const dialogRef = useModalDialog<HTMLElement>(open, onClose)

  if (!open) return null

  return (
    <div className="soa-sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="soa-bottom-sheet soa-voice-settings-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-settings-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="soa-sheet-handle" aria-hidden="true" />
        <header className="soa-sheet-header">
          <button
            type="button"
            onClick={onClose}
            aria-label="음성 설정 닫기"
            data-dialog-autofocus
          >
            ‹
          </button>
          <h2 id="voice-settings-title">음성 설정</h2>
          <span />
        </header>

        <label>
          <span><b>속도</b><strong>{speed.toFixed(2)}× · {supportsSpeed ? '현재 설정 적용' : '자동 최적화'}</strong></span>
          <input
            type="range"
            min={VOICE_SPEED_CONTROL.min}
            max={VOICE_SPEED_CONTROL.max}
            step={VOICE_SPEED_CONTROL.step}
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
            aria-label="음성 속도"
            aria-valuetext={`${speed.toFixed(2)}배`}
          />
        </label>
        <label>
          <span><b>높낮이</b><strong>{formatPitch(pitch)} · {supportsPitch ? '현재 설정 적용' : '자동 최적화'}</strong></span>
          <input
            type="range"
            min={VOICE_PITCH_CONTROL.min}
            max={VOICE_PITCH_CONTROL.max}
            step={VOICE_PITCH_CONTROL.step}
            value={pitch}
            onChange={(event) => onPitchChange(Number(event.target.value))}
            aria-label="음성 높낮이"
            aria-valuetext={formatPitch(pitch)}
          />
        </label>

        <div className="soa-emotion-settings">
          <span><b>말투</b><strong>{supportsEmotion ? '현재 설정 적용' : '자동 최적화'}</strong></span>
          <div role="radiogroup" aria-label="음성 말투">
            {VOICE_EMOTION_OPTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={emotion === item.id}
                className={emotion === item.id ? 'is-active' : ''}
                onClick={() => onEmotionChange(item.id)}
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
            aria-label="한국어 숫자와 기호 읽기 보정"
          />
        </label>

        <div className="soa-sheet-actions is-single">
          <button
            type="button"
            className="is-primary"
            onClick={onPreview}
            disabled={previewing}
            aria-busy={previewing}
          >
            {previewing ? '현재 설정으로 재생 준비 중…' : '▶ 현재 설정 적용 · 재생'}
          </button>
        </div>
      </section>
    </div>
  )
}
