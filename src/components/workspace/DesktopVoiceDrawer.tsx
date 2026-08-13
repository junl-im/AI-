import type { VoiceEmotion } from '../../ai/contracts'
import { VoicePreviewButton } from '../voice/VoicePreviewButton'
import { voicePresets } from '../../tts/voicePresets'
import {
  formatPitch,
  VOICE_EMOTION_OPTIONS,
  VOICE_PITCH_CONTROL,
  VOICE_SPEED_CONTROL,
} from '../../voice/voiceControlOptions'

interface DesktopVoiceDrawerProps {
  voiceId: string
  previewingId: string | null
  activePreviewId: string | null
  previewPlaying: boolean
  speed: number
  pitch: number
  emotion: VoiceEmotion
  normalizeText: boolean
  onVoiceChange: (voiceId: string) => void
  onPreview: (voiceId: string) => void
  onSpeedChange: (value: number) => void
  onPitchChange: (value: number) => void
  onEmotionChange: (value: VoiceEmotion) => void
  onNormalizeTextChange: (value: boolean) => void
  onCreateVoice: () => void
  collapsed: boolean
  onToggleCollapsed: () => void
}

export function DesktopVoiceDrawer({
  voiceId,
  previewingId,
  activePreviewId,
  previewPlaying,
  speed,
  pitch,
  emotion,
  normalizeText,
  onVoiceChange,
  onPreview,
  onSpeedChange,
  onPitchChange,
  onEmotionChange,
  onNormalizeTextChange,
  onCreateVoice,
  collapsed,
  onToggleCollapsed,
}: DesktopVoiceDrawerProps) {
  return (
    <aside
      id="soa-voice-drawer"
      className={`soa-voice-drawer ${collapsed ? 'is-collapsed' : ''}`}
      aria-label="미니 보이스 라이브러리"
    >
      {collapsed ? (
        <>
          <button
            type="button"
            className="soa-studio-panel-toggle is-collapsed"
            aria-label="보이스 패널 펼치기"
            aria-expanded="false"
            aria-controls="soa-voice-drawer"
            onClick={onToggleCollapsed}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <span className="soa-studio-panel-monogram" aria-hidden="true">V</span>
        </>
      ) : (
        <>
          <header>
            <div className="soa-voice-drawer__heading-row">
              <span>VOICE DRAWER</span>
              <button type="button" className="soa-studio-panel-toggle" aria-label="보이스 패널 접기" aria-expanded="true" aria-controls="soa-voice-drawer" onClick={onToggleCollapsed}><b>접기</b> ›</button>
            </div>
            <strong>목소리 라이브러리</strong>
            <p>목소리와 말투를 고른 뒤 ▶를 누르면 현재 설정으로 미리듣습니다.</p>
          </header>

          <div className="soa-voice-drawer__presets" role="radiogroup" aria-label="프리셋 목소리">
            {voicePresets.map((voice) => {
              const selected = voice.id === voiceId
              return (
                <article key={voice.id} className={selected ? 'is-selected' : ''}>
                  <button
                    type="button"
                    className="soa-voice-drawer__select"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onVoiceChange(voice.id)}
                  >
                    <span className={`soa-voice-avatar ${voice.tone}`} aria-hidden="true">{voice.shortName}</span>
                    <span><strong>{voice.name}</strong><small>{voice.tags.join(' · ')}</small></span>
                  </button>
                  <VoicePreviewButton
                    className="soa-voice-drawer__play"
                    voiceId={voice.id}
                    voiceName={voice.name}
                    previewingId={previewingId}
                    activePreviewId={activePreviewId}
                    previewPlaying={previewPlaying}
                    onPreview={onPreview}
                    labelContext="보이스 라이브러리"
                  />
                </article>
              )
            })}
          </div>

          <section className="soa-voice-drawer__settings" aria-label="음성 세부 설정">
            <label>
              <span><b>속도</b><strong>{speed.toFixed(2)}×</strong></span>
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
              <span><b>높낮이</b><strong>{formatPitch(pitch)}</strong></span>
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
            <div className="soa-voice-drawer__emotion">
              <b>말투</b>
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
            <label className="soa-voice-drawer__normalize">
              <span><b>숫자·기호 읽기 보정</b><small>자동 최적화</small></span>
              <input
                type="checkbox"
                checked={normalizeText}
                onChange={(event) => onNormalizeTextChange(event.target.checked)}
                aria-label="숫자와 기호 읽기 보정"
              />
            </label>
          </section>

          <button type="button" className="soa-voice-drawer__create" onClick={onCreateVoice}>＋ 새 보이스 만들기</button>
        </>
      )}
    </aside>
  )
}
