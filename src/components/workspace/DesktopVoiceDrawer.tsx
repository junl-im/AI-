import type { VoiceEmotion } from '../../ai/contracts'
import type { EngineInfo } from '../../ai/contracts'
import { voicePresets } from '../../tts/voicePresets'

interface DesktopVoiceDrawerProps {
  voiceId: string
  previewingId: string | null
  speed: number
  pitch: number
  emotion: VoiceEmotion
  normalizeText: boolean
  engine: EngineInfo | null
  onVoiceChange: (voiceId: string) => void
  onPreview: (voiceId: string) => void
  onSpeedChange: (value: number) => void
  onPitchChange: (value: number) => void
  onEmotionChange: (value: VoiceEmotion) => void
  onNormalizeTextChange: (value: boolean) => void
  onCreateVoice: () => void
}

const emotions: Array<{ id: VoiceEmotion; label: string }> = [
  { id: 'neutral', label: '기본' },
  { id: 'happy', label: '밝게' },
  { id: 'commercial', label: '광고' },
  { id: 'sad', label: '차분' },
]

export function DesktopVoiceDrawer({
  voiceId,
  previewingId,
  speed,
  pitch,
  emotion,
  normalizeText,
  engine,
  onVoiceChange,
  onPreview,
  onSpeedChange,
  onPitchChange,
  onEmotionChange,
  onNormalizeTextChange,
  onCreateVoice,
}: DesktopVoiceDrawerProps) {
  return (
    <aside className="soa-voice-drawer" aria-label="미니 보이스 라이브러리">
      <header>
        <span>VOICE DRAWER</span>
        <strong>목소리 라이브러리</strong>
        <p>▶를 누르면 선택값이 바로 적용되고 재생됩니다.</p>
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
              <button
                type="button"
                className="soa-voice-drawer__play"
                aria-label={`${voice.name} 목소리 적용 후 재생`}
                disabled={previewingId !== null}
                onClick={() => onPreview(voice.id)}
              >
                {previewingId === voice.id ? '…' : '▶'}
              </button>
            </article>
          )
        })}
      </div>

      <section className="soa-voice-drawer__settings" aria-label="음성 세부 설정">
        <label>
          <span><b>속도</b><strong>{speed.toFixed(2)}×</strong></span>
          <input
            type="range"
            min="0.75"
            max="1.25"
            step="0.05"
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
            aria-label="음성 속도"
          />
        </label>
        <label>
          <span><b>높낮이</b><strong>{pitch > 0 ? '+' : ''}{pitch.toFixed(1)}</strong></span>
          <input
            type="range"
            min="-4"
            max="4"
            step="0.5"
            value={pitch}
            onChange={(event) => onPitchChange(Number(event.target.value))}
            aria-label="음성 높낮이"
          />
        </label>
        <div className="soa-voice-drawer__emotion">
          <b>말투</b>
          <div>
            {emotions.map((item) => (
              <button
                key={item.id}
                type="button"
                className={emotion === item.id ? 'is-active' : ''}
                onClick={() => onEmotionChange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <label className="soa-voice-drawer__normalize">
          <span><b>숫자·기호 읽기 보정</b><small>{engine?.name ?? '지원 엔진 자동 선택'}</small></span>
          <input
            type="checkbox"
            checked={normalizeText}
            onChange={(event) => onNormalizeTextChange(event.target.checked)}
          />
        </label>
      </section>

      <button type="button" className="soa-voice-drawer__create" onClick={onCreateVoice}>＋ 새 보이스 만들기</button>
    </aside>
  )
}
