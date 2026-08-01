import { useAppStore } from '../store/useAppStore'

export function LandingHome() {
  const enterWorkspace = useAppStore((state) => state.enterWorkspace)

  return (
    <section className="soa-landing-overview" aria-labelledby="landing-title">
      <div>
        <span className="soa-landing-kicker">KOREAN FIRST · MOBILE FIRST</span>
        <h1 id="landing-title">
          <strong>문장 하나면,</strong>
          <span>목소리는 바로 시작됩니다.</span>
        </h1>
        <p>
          채팅하듯 요청하면 소리온이 한국어 발음을 다듬고 문장별 음성 블록으로 나눕니다.
          초보자는 대화만 하고, 전문가는 타임라인에서 순서·쉼·문장을 편집합니다.
        </p>
        <button type="button" onClick={() => enterWorkspace('home')}>
          AI 음성 스튜디오 시작
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <ol aria-label="소리온 작업 흐름">
        <li><b>01</b><span>채팅으로 요청</span></li>
        <li><b>02</b><span>문장별 생성</span></li>
        <li><b>03</b><span>타임라인 편집</span></li>
        <li><b>04</b><span>WAV 내보내기</span></li>
      </ol>
    </section>
  )
}
