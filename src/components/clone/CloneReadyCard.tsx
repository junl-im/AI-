import type { VoiceCloneProfile } from '../../voiceclone/voiceCloneTypes'

export function CloneReadyCard({
  profile,
  onDelete,
}: {
  profile: VoiceCloneProfile
  onDelete: () => void
}) {
  return (
    <section className="soa-clone-ready" aria-live="polite">
      <span>VOICE PROFILE READY</span>
      <h2>{profile.displayName}</h2>
      <p>{profile.message}</p>
      <dl>
        <div><dt>상태</dt><dd>{profile.status === 'engine-ready' ? '실제 생성 가능' : '샘플 준비 완료'}</dd></div>
        <div><dt>준비 방식</dt><dd>자동 최적화</dd></div>
        <div><dt>원본</dt><dd>로컬 우선 보관</dd></div>
      </dl>
      <button type="button" onClick={onDelete}>동의 철회 및 샘플 삭제</button>
    </section>
  )
}
