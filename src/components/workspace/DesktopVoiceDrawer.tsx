import type { VoiceEmotion } from '../../ai/contracts'
import { VoicePreviewButton } from '../voice/VoicePreviewButton'
import { VoiceRhythmSignature } from './VoiceRhythmSignature'
import type { VoiceChoice } from '../../voice/voiceChoices'
import {
  formatPitch,
  VOICE_EMOTION_OPTIONS,
  VOICE_PITCH_CONTROL,
  VOICE_SPEED_CONTROL,
} from '../../voice/voiceControlOptions'

interface DesktopVoiceDrawerProps {
  voiceId: string
  voiceChoices: VoiceChoice[]
  previewingId: string | null
  activePreviewId: string | null
  previewPlaying: boolean
  speed: number
  pitch: number
  emotion: VoiceEmotion
  normalizeText: boolean
  applyTargetCount?: number
  applyTargetLabel?: string | null
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
  voiceId, voiceChoices, previewingId, activePreviewId, previewPlaying,
  speed, pitch, emotion, normalizeText, applyTargetCount = 0, applyTargetLabel = null, onVoiceChange, onPreview,
  onSpeedChange, onPitchChange, onEmotionChange, onNormalizeTextChange,
  onCreateVoice, collapsed, onToggleCollapsed,
}: DesktopVoiceDrawerProps) {
  const customVoices = voiceChoices.filter((voice) => voice.kind === 'my-voice')
  const presetVoices = voiceChoices.filter((voice) => voice.kind === 'preset')
  const selected = voiceChoices.find((voice) => voice.id === voiceId)
  const customSelected = selected?.kind === 'my-voice'

  function previewAndSelect(nextVoiceId: string) {
    if (nextVoiceId !== voiceId) onVoiceChange(nextVoiceId)
    onPreview(nextVoiceId)
  }

  const renderChoice = (voice: VoiceChoice) => {
    const active = voice.id === voiceId
    return (
      <article key={voice.id} className={`${active ? 'is-selected' : ''} ${voice.kind === 'my-voice' ? 'is-my-voice' : ''} ${voice.ready ? '' : 'is-unavailable'}`.trim()}>
        <button
          type="button"
          className="soa-voice-drawer__select"
          role="radio"
          aria-checked={active}
          disabled={!voice.ready}
          onClick={() => onVoiceChange(voice.id)}
          data-voice-cadence={voice.cadence}
        >
          <span className={`soa-voice-avatar ${voice.tone}`} aria-hidden="true">{voice.shortName}</span>
          <span className="soa-voice-drawer__identity">
            <span className="soa-voice-drawer__name-row">
              <strong>{voice.name}{voice.kind === 'my-voice' ? <em>MY</em> : null}</strong>
              <b>{voice.personaLabel}</b>
            </span>
            <small>{voice.personaSummary}</small>
            <span className="soa-voice-drawer__character">
              <VoiceRhythmSignature cadence={voice.cadence} compact />
              <i>{voice.paceLabel}</i>
            </span>
          </span>
        </button>
        {voice.ready ? <VoicePreviewButton className="soa-voice-drawer__play" voiceId={voice.id} voiceName={voice.name} previewingId={previewingId} activePreviewId={activePreviewId} previewPlaying={previewPlaying} onPreview={previewAndSelect} labelContext="보이스 라이브러리" /> : <span className="soa-my-voice-engine-wait">준비</span>}
      </article>
    )
  }

  return (
    <aside id="soa-voice-drawer" className={`soa-voice-drawer ${collapsed ? 'is-collapsed' : ''}`} aria-label="미니 보이스 라이브러리">
      <button type="button" className="soa-studio-panel-toggle" aria-label={collapsed ? '보이스 패널 펼치기' : '보이스 패널 접기'} aria-expanded={!collapsed} aria-controls="soa-voice-drawer" onClick={onToggleCollapsed}>{collapsed ? '‹' : '›'}</button>
      {collapsed ? <span className="soa-studio-panel-monogram" aria-hidden="true">V</span> : (
        <>
          <header><span>VOICE DRAWER</span><strong>목소리 라이브러리</strong><p>성우마다 속도·호흡·문장 리듬이 다릅니다. ▶로 실제 차이를 바로 들어보세요.</p></header>
          {applyTargetCount > 0 ? (
            <div className="soa-voice-drawer__apply-target" role="note" aria-label="보이스 라이브러리 적용 대상">
              <strong>타임라인 선택 · {applyTargetLabel ?? `${applyTargetCount}개 대사`}</strong>
              <span>목소리를 누르면 선택된 대사에 즉시 적용됩니다.</span>
            </div>
          ) : null}
          {customVoices.length > 0 ? <section className="soa-voice-drawer__group" aria-label="MY VOICE"><div className="soa-voice-drawer__section-title"><strong>MY VOICE</strong><span>내 샘플</span></div><div className="soa-voice-drawer__presets" role="radiogroup" aria-label="내 목소리">{customVoices.map(renderChoice)}</div></section> : null}
          <section className="soa-voice-drawer__group" aria-label="SoriON Voice"><div className="soa-voice-drawer__section-title"><strong>SORION VOICE</strong><span>기본 성우</span></div><div className="soa-voice-drawer__presets" role="radiogroup" aria-label="프리셋 목소리">{presetVoices.map(renderChoice)}</div></section>

          {customSelected ? (
            <section className="soa-voice-drawer__settings is-my-voice" aria-label="내 목소리 설정">
              <div className="soa-my-voice-settings-note"><strong>MY VOICE 원본 음색 우선</strong><span>속도·높낮이·말투를 과하게 변형하지 않고 샘플 특성을 유지합니다.</span></div>
              <label className="soa-voice-drawer__normalize"><span><b>숫자·기호 읽기 보정</b><small>현재 clone 엔진 원문 처리</small></span><input type="checkbox" checked={normalizeText} onChange={(event) => onNormalizeTextChange(event.target.checked)} aria-label="숫자와 기호 읽기 보정" /></label>
            </section>
          ) : (
            <section className="soa-voice-drawer__settings" aria-label="음성 세부 설정">
              <label className="soa-voice-drawer__speed"><span><b>속도</b><strong>{speed.toFixed(2)}×</strong></span><small>{selected?.paceLabel ?? '성우 기본 페이스 적용'}</small><input type="range" min={VOICE_SPEED_CONTROL.min} max={VOICE_SPEED_CONTROL.max} step={VOICE_SPEED_CONTROL.step} value={speed} onChange={(event) => onSpeedChange(Number(event.target.value))} aria-label="음성 속도" aria-valuetext={`${speed.toFixed(2)}배`} /></label>
              <label><span><b>높낮이</b><strong>{formatPitch(pitch)}</strong></span><input type="range" min={VOICE_PITCH_CONTROL.min} max={VOICE_PITCH_CONTROL.max} step={VOICE_PITCH_CONTROL.step} value={pitch} onChange={(event) => onPitchChange(Number(event.target.value))} aria-label="음성 높낮이" aria-valuetext={formatPitch(pitch)} /></label>
              <div className="soa-voice-drawer__emotion"><b>말투</b><div role="radiogroup" aria-label="음성 말투">{VOICE_EMOTION_OPTIONS.map((item) => <button key={item.id} type="button" role="radio" aria-checked={emotion === item.id} className={emotion === item.id ? 'is-active' : ''} onClick={() => onEmotionChange(item.id)}>{item.label}</button>)}</div></div>
              <label className="soa-voice-drawer__normalize"><span><b>숫자·기호 읽기 보정</b><small>자동 최적화</small></span><input type="checkbox" checked={normalizeText} onChange={(event) => onNormalizeTextChange(event.target.checked)} aria-label="숫자와 기호 읽기 보정" /></label>
            </section>
          )}
          <button type="button" className="soa-voice-drawer__create" onClick={onCreateVoice}>＋ 새 보이스 만들기</button>
        </>
      )}
    </aside>
  )
}
