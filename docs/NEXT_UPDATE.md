# NEXT UPDATE

현재 기준: `0.11.5 · Editor Command UX & Adaptive Engine Load Awareness`

## 목표 버전

`0.11.6 · Recovery Evidence Classification & Session Safety`

## 최우선 구현

- 실제 OS/Wi-Fi/visibility 관찰 증거와 synthetic Recovery Path Injection을 export schema와 UI에서 별도 evidence class로 고정
- 승인된 Chromium baseline PNG가 저장소에 들어온 뒤 CI에서 `SORION_VISUAL_BASELINE_REQUIRED=1` 전환 및 pixel diff 기준 운영
- batch 재시도 이력을 필요 시 프로젝트 세션 snapshot에 저장하되 원문·음원·민감 오류 문자열은 보존하지 않음
- keyboard command bar의 이동 Undo를 구조 변경에도 안전한 snapshot 기반 복원으로 확장할지 검증
- adaptive engine active-request 분산과 performance observation session을 장시간 soak에서 측정하고 과도한 엔진 전환 여부를 확인

## 0.11.5에서 고정한 결정

- 다중 선택 키보드 명령은 textarea/input/select/button/link/contenteditable 입력을 가로채지 않는다.
- 준비된 음원을 교체하는 일괄 재생성과 삭제는 실행 전 영향 미리보기를 거친다.
- 일괄 이동 Undo는 현재 직전 1회만 제공하며 다른 구조 변경 이후의 완전한 history undo로 가장하지 않는다.
- `active_request_count`는 auto 선택의 일시 부하 분산 신호이며 엔진 처리량 benchmark나 명시적 엔진 차단으로 해석하지 않는다.
- performance observation window가 만료되면 오래된 EWMA와 표본을 새 세션에 섞지 않는다.
- 실제/주입 복구 증거 분리, 승인 baseline CI 강제, 프로젝트 세션 retry snapshot은 0.11.5에서 완료한 것으로 주장하지 않는다.
