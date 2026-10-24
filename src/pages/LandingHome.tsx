import { scheduleStudioEntryAlignment } from '../navigation/studioEntryNavigation'
import { useAppStore } from '../store/useAppStore'

const workflow = [
  { title: '대본을 담고', detail: '직접 쓰거나 파일을 가져오세요.' },
  { title: '목소리를 고르고', detail: '첫 문장으로 먼저 들어보세요.' },
  { title: '듣고, 다듬고', detail: '문장마다 원하는 만큼 편집하세요.' },
]

export function LandingHome() {
  const enterWorkspace = useAppStore((state) => state.enterWorkspace)

  function startLongformStudio() {
    enterWorkspace('home')
    scheduleStudioEntryAlignment()
  }

  return (
    <section className="soa-landing-overview" aria-labelledby="landing-title">
      <div className="soa-landing-copy">
        <span className="soa-landing-kicker">당신의 이야기가 목소리가 되는 곳</span>
        <h1 id="landing-title">
          <strong>긴 내용도,</strong>
          <span>가볍게. 나답게.</span>
        </h1>
        <p>한 편의 이야기부터 긴 강의까지.<br />대본을 넣고 목소리를 고르면, 문장별로 듣고 다듬을 수 있어요.</p>
        <button type="button" onClick={startLongformStudio}>
          장문 음성 스튜디오 시작 <span aria-hidden="true">↗</span>
        </button>
        <div className="soa-landing-note">한국어 중심 <span aria-hidden="true">·</span> 모바일에서도 편하게</div>
        <p className="soa-landing-device-note">별하는 기기에서 WAV 파일을 직접 만들며 첫 사용 시 음성 모델을 내려받습니다. 다른 기본 성우는 한국어 기기 음성 또는 연결된 음성 서버가 필요합니다. 작업과 재생 목록은 이 기기에 저장됩니다.</p>
      </div>
      <figure className="soa-studio-preview" aria-label="문장별 편집 작업공간 미리보기">
        <figcaption><span>SoriON Studio</span><span>작업공간 미리보기</span></figcaption>
        <div className="soa-studio-preview__voice"><span aria-hidden="true">혜</span><div><strong>혜린</strong><small>이야기에 어울리는 목소리</small></div><b>VOICE 01</b></div>
        <div className="soa-studio-preview__script"><span>나의 첫 번째 이야기</span><p>모든 이야기는<br />작은 한 문장에서 시작됩니다.</p><p>당신의 문장에,<br />당신만의 목소리를 더해보세요.</p></div>
        <div className="soa-studio-preview__timeline" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="soa-studio-preview__caption"><span>대본</span><span>목소리</span><span>문장별 편집</span></div>
      </figure>
      <ol className="soa-landing-workflow" aria-label="소리온 장문 작업 흐름">
        {workflow.map((step, index) => <li key={step.title}><b>0{index + 1}</b><div><strong>{step.title}</strong><span>{step.detail}</span></div></li>)}
      </ol>
    </section>
  )
}
