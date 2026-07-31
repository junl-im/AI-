import { useAppStore } from '../../store/useAppStore'
import { usePlayerStore } from '../../store/usePlayerStore'

export function DesktopContextFrame() {
  const setPage = useAppStore((state) => state.setPage)
  const audio = usePlayerStore((state) => state.audio)

  return (
    <aside className="soa-context-frame" aria-label="SoriON 보조 프레임">
      <div>
        <span>VOICE SESSION</span>
        <strong>{audio ? '최근 음성이 Dock에 연결됐어요.' : '문장을 입력하면 여기에 작업 상태가 연결됩니다.'}</strong>
      </div>
      <div className="soa-context-orb" aria-hidden="true"><i /><i /><i /></div>
      <dl>
        <div><dt>플랫폼</dt><dd>한국어 우선</dd></div>
        <div><dt>레이아웃</dt><dd>PC 2프레임</dd></div>
        <div><dt>재생</dt><dd>{audio ? '연결됨' : '대기 중'}</dd></div>
      </dl>
      <button type="button" onClick={() => setPage('projects')}>최근 프로젝트 보기</button>
    </aside>
  )
}
