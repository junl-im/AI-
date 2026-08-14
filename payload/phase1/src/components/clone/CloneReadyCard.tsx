import { calculateVoiceSampleScore, voiceSampleScoreLabel } from '../../voiceclone/sampleQualityScore'
import type { VoiceCloneProfile } from '../../voiceclone/voiceCloneTypes'

export function CloneReadyCard({
  profile,
  onDelete,
}: {
  profile: VoiceCloneProfile
  onDelete: () => void
}) {
  const score = calculateVoiceSampleScore(profile.analysis)
  const ready = profile.status === 'engine-ready'

  return (
    <section className="soa-clone-ready soa-myvoice-profile" aria-live="polite">
      <div className="soa-myvoice-profile__head">
        <div>
          <span>ACTIVE MY VOICE</span>
          <h2>{profile.displayName}</h2>
          <p>{profile.message}</p>
        </div>
        <div className={`soa-myvoice-profile__score is-${profile.analysis.status}`} aria-label={`원본 품질 점수 ${score}점`}>
          <strong>{score}</strong>
          <small>{voiceSampleScoreLabel(score)}</small>
        </div>
      </div>
      <dl>
        <div><dt>생성 상태</dt><dd>{ready ? '실제 생성 준비됨' : '샘플 준비됨'}</dd></div>
        <div><dt>원본 길이</dt><dd>{profile.analysis.durationSeconds.toFixed(1)}초</dd></div>
        <div><dt>보관</dt><dd>기기 우선</dd></div>
      </dl>
      <div className="soa-myvoice-profile__hint">
        <strong>{ready ? '이 목소리로 문장 테스트를 시작할 수 있습니다.' : '원본은 저장됐습니다.'}</strong>
        <span>{ready ? '오른쪽 Voice Test Lab에서 말투가 다른 문장들을 비교해 보세요.' : '실제 생성 엔진이 준비되면 동일 프로필로 테스트할 수 있습니다.'}</span>
      </div>
      <button type="button" className="soa-myvoice-danger" onClick={onDelete}>동의 철회 · 내 목소리 삭제</button>
    </section>
  )
}
