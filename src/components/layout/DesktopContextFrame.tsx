import { useAppStore } from '../../store/useAppStore'
import { getCurrentTrack, usePlayerStore } from '../../store/usePlayerStore'

export function DesktopContextFrame() {
  const setPage = useAppStore((state) => state.setPage)
  const queueLength = usePlayerStore((state) => state.queue.length)
  const track = usePlayerStore(getCurrentTrack)

  return (
    <aside className="soa-context-frame" aria-label="SoriON 보조 프레임">
      <div>
        <span>VOICE SESSION</span>
        <strong>{track ? '현재 음성과 대기열이 Dock에 연결됐어요.' : '음성을 만들거나 복제 샘플을 준비해 보세요.'}</strong>
      </div>
      <div className="soa-context-orb" aria-hidden="true"><i /><i /><i /></div>
      <dl>
        <div><dt>플랫폼</dt><dd>한국어 우선</dd></div>
        <div><dt>복제</dt><dd>동의·로컬 우선</dd></div>
        <div><dt>대기열</dt><dd>{queueLength}개</dd></div>
        <div><dt>재생</dt><dd>{track ? track.title : '대기 중'}</dd></div>
      </dl>
      <button type="button" onClick={() => setPage(track ? 'projects' : 'clone')}>
        {track ? '최근 프로젝트 보기' : '목소리 샘플 준비하기'}
      </button>
    </aside>
  )
}
