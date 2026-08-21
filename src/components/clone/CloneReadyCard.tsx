import type { VoiceCloneProfile } from '../../voiceclone/voiceCloneTypes'

export function CloneReadyCard({
  profile,
  syncing,
  onSync,
  onDelete,
}: {
  profile: VoiceCloneProfile
  syncing: boolean
  onSync: () => void
  onDelete: () => void
}) {
  const needsSync = profile.remoteSynced === false || profile.remoteSynced === null
  const syncUncertain = profile.remoteSynced === null
  const qualityBlocked = profile.analysis.status === 'blocked'
  return (
    <section className="soa-clone-ready" aria-live="polite">
      <span>VOICE PROFILE READY</span>
      <h2>{profile.displayName}</h2>
      <p>{profile.message}</p>
      <dl>
        <div><dt>상태</dt><dd>{qualityBlocked ? '재녹음 필요' : profile.status === 'engine-ready' && !needsSync ? '실제 생성 가능' : '샘플 준비 완료'}</dd></div>
        <div><dt>품질 확인</dt><dd>{qualityBlocked ? '품질 차단' : profile.analysis.status === 'good' ? '서버/기기 검사 통과' : '주의사항 확인됨'}</dd></div>
        <div><dt>원본</dt><dd>로컬 우선 보관</dd></div>
      </dl>
      {needsSync ? (
        <button type="button" onClick={onSync} disabled={syncing}>
          {syncing ? '서버 재검증 중…' : syncUncertain ? '서버 등록 확인' : '서버에 다시 준비'}
        </button>
      ) : null}
      <button type="button" onClick={onDelete}>동의 철회 및 샘플 삭제</button>
    </section>
  )
}
