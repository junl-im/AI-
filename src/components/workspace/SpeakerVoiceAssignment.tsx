import { voicePresets } from '../../tts/voicePresets'
import type { SpeakerVoiceAssignment } from '../../workspace/multiSpeaker'

interface SpeakerVoiceAssignmentProps {
  speakers: string[]
  assignments: SpeakerVoiceAssignment[]
  confirmed: boolean
  sampleBySpeaker: Record<string, string>
  onAssignmentChange: (speaker: string, voiceId: string) => void
  onConfirm: () => void
  onPreview?: (voiceId: string, text: string) => void
}

export function SpeakerVoiceAssignmentPanel({
  speakers,
  assignments,
  confirmed,
  sampleBySpeaker,
  onAssignmentChange,
  onConfirm,
  onPreview,
}: SpeakerVoiceAssignmentProps) {
  if (speakers.length < 2) return null
  const assignmentMap = new Map(assignments.map((item) => [item.speaker, item.voiceId]))

  return (
    <section className={`soa-speaker-assist ${confirmed ? 'is-confirmed' : ''}`} aria-label="화자별 목소리 배정">
      <div className="soa-speaker-assist__heading">
        <div>
          <span>MULTI-SPEAKER ASSIST</span>
          <strong>{speakers.length}명 화자를 찾았습니다</strong>
          <p>목소리는 제안만 합니다. 아래 배정을 확인하고 적용해야 실제 생성에 사용됩니다.</p>
        </div>
        <span className="soa-speaker-assist__status">{confirmed ? '✓ 배정 적용됨' : '확인 필요'}</span>
      </div>

      <div className="soa-speaker-assist__list">
        {speakers.map((speaker) => {
          const voiceId = assignmentMap.get(speaker) ?? voicePresets[0].id
          return (
            <div key={speaker} className="soa-speaker-assist__row">
              <strong title={speaker}>{speaker}</strong>
              <select
                aria-label={`${speaker} 목소리`}
                value={voiceId}
                onChange={(event) => onAssignmentChange(speaker, event.target.value)}
              >
                {voicePresets.map((voice) => (
                  <option key={voice.id} value={voice.id}>{voice.name} · {voice.badge}</option>
                ))}
              </select>
              {onPreview ? (
                <button
                  type="button"
                  onClick={() => onPreview(voiceId, sampleBySpeaker[speaker] ?? '')}
                  disabled={!sampleBySpeaker[speaker]}
                  aria-label={`${speaker} 배정 목소리 미리듣기`}
                >
                  ▶ 듣기
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      <button type="button" className="soa-speaker-assist__confirm" onClick={onConfirm} disabled={confirmed}>
        {confirmed ? '✓ 이 화자 배정 사용 중' : '이 화자 배정으로 만들기'}
      </button>
    </section>
  )
}
