import { useAppStore } from '../store/useAppStore'

export function LandingHome() {
  const enterWorkspace = useAppStore((state) => state.enterWorkspace)

  return (
    <section className="soa-landing-overview" aria-labelledby="landing-title">
      <div>
        <span className="soa-landing-kicker">KOREAN FIRST · LONGFORM READY</span>
        <h1 id="landing-title">
          <strong>긴 내용도,</strong>
          <span>문장별 목소리로 완성합니다.</span>
        </h1>
        <p>
          대본·오디오북·강의 내용을 그대로 붙여 넣으세요. 소리온이 한국어 발음을 다듬고
          문장별 음성 블록으로 나누어 순서대로 제작합니다.
        </p>
        <button type="button" onClick={() => enterWorkspace('home')}>
          장문 음성 스튜디오 시작
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <ol aria-label="소리온 장문 작업 흐름">
        <li><b>01</b><span>긴 내용 붙여넣기</span></li>
        <li><b>02</b><span>문장 자동 분할</span></li>
        <li><b>03</b><span>순차 음성 생성</span></li>
        <li><b>04</b><span>타임라인 편집</span></li>
      </ol>
    </section>
  )
}
