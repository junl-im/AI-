# NEXT UPDATE

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.4 · Signed Audio Rehydration & Device Certification`

## 목표 버전

`0.9.3-beta.3 · Engine Heartbeat 6.5 · Device Soak Recorder & Audio Archive Policy`

## 핵심 기능

1. Android Chrome·iOS Safari·설치형 PWA에서 10·30·60분 시나리오를 입력·검증·내보내는 전용 soak recorder를 추가한다.
2. 네트워크 전환과 백그라운드 복귀의 SSE 재연결 시간, 음원 fetch 복구 시간, 재생 중단 시간을 개별 필드로 기록한다.
3. seam P95를 엔진·프리셋·기기별로 집계하고 생성 대기 포함/미포함을 분리한다.
4. 30분 임시 음원과 사용자가 명시적으로 보존한 Export 파일의 수명·삭제 정책을 분리한다.
5. 실제 CosyVoice 모델과 동의받은 프리셋 5종에서 first audio, seam P95, handoff error, RTF, 실패율을 측정한다.
6. 검증된 npm lock을 생성해 ESLint, Vitest, semantic typecheck와 Vite production build를 확정한다.

## 선행 조건과 위험

- 실제 Android·iPhone/iPad와 설치형 PWA, 공개 HTTPS Voice API가 필요합니다.
- 모바일 OS의 백그라운드 정지와 메모리 회수는 브라우저 API만으로 통제할 수 없습니다.
- 작업 결과와 임시 음원 TTL이 지난 뒤에는 URL 재발급만으로 파일을 복구할 수 없습니다.
- 장기 보존 기능은 사용자 동의, 저장 용량, 삭제 UI와 개인정보 정책이 함께 설계돼야 합니다.
- gapless 주장은 실제 파형 또는 오디오 출력 측정 기준을 통과하기 전 금지합니다.

## 넘기는 결정

- Heartbeat 6.4의 재발급은 30분 임시 보관 창 안의 최종 TTS 음원만 대상으로 합니다.
- 실기기 인증표는 READY 기록을 표시하는 계약이며 저장소나 CI가 인증 값을 자동 생성하지 않습니다.
- seam P95는 `ended → playing` 이벤트 값이며 생성 대기와 decode 지연을 포함할 수 있습니다.
- 부분 음원과 Blob URL은 계속 세션 복원 대상에서 제외합니다.
