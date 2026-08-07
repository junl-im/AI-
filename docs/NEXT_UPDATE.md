# NEXT UPDATE

현재 기준: `0.11.4 · Visual Baseline Approval & Recovery Provenance`

## 목표 버전

`0.11.5 · Recovery Evidence Classification & Editor Command UX`

## 최우선 구현

- 실제 OS/Wi-Fi/visibility 관찰 증거와 synthetic Recovery Path Injection을 export schema와 UI에서 별도 evidence class로 고정
- 승인된 Chromium baseline PNG가 저장소에 들어온 뒤 CI에서 `SORION_VISUAL_BASELINE_REQUIRED=1` 전환 및 pixel diff 기준 운영
- 타임라인 다중 선택에 키보드 command bar와 Undo-safe 일괄 작업 preview를 추가해 반복 클릭을 줄임
- batch 재시도 이력을 필요 시 프로젝트 세션 snapshot에 저장하되 원문·음원·민감 오류 문자열은 보존하지 않음
- adaptive engine routing의 새 성능 관찰 세션 시작/만료를 Engine Doctor에서 더 명확히 표시하고 장시간 soak로 확인

## 0.11.4에서 고정한 결정

- visual baseline은 신뢰할 수 있는 동일 Chromium runner에서 명시적으로 approve한 PNG만 기준선으로 사용한다.
- 기준선이 없으면 DOM layout과 후보 PNG는 만들되 pixel baseline 통과를 주장하지 않는다.
- runtime soak 비교 증거는 원본 파일명·실제 파일 SHA-256·수집/로드/비교 시각 provenance를 함께 보존한다.
- batch 재시도 이력은 현재 편집 세션 최근 6건만 유지하며 빠른 재시도 상한 3회는 유지한다.
- performance observation window가 만료되면 오래된 EWMA는 새 표본과 섞지 않는다.
