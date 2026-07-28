# PATCH REPORT v1.6.32

## 변경 범위

- `src/vision/smart-reframe-engine.js`: 페이지별 시간 정규화, 누적 cycle 계산, focus 시간 상태와 cache identity 확장
- `src/app.js`: 페이지 시간 입력, 페이지 내부 화자 정렬, 실시간 energy/hold 상태 UI
- `src/project/project-service.js`: `gridManualPageSeconds` allowlist 저장·복구
- `src/state/app-state.js`: 신규 speaker layout 기본값
- `index.html`, `assets/css/smart-reframe.css`: 에너지 진단·페이지 duration·subject chip UI
- 신규 QA: manual page duration/editor, v1.6.32 Chromium page timing audit, browser evidence consumer

## 안전성

- 페이지별 시간은 1~10초로 제한합니다.
- 시간 배열은 유효한 수동 페이지 길이에 맞춰 정렬합니다.
- 페이지와 시간을 함께 이동해 재정렬 후 시간 소유권이 바뀌지 않도록 합니다.
- 페이지당 subject ID를 최대 4개로 제한하고 중복·빈 값을 제거합니다.
- 에너지 UI는 기존 preview callback을 사용하며 신규 RAF·interval·Object URL을 추가하지 않습니다.
- 기존 v1.6.31 프로젝트는 신규 필드가 없으면 전역 `gridPageSeconds`를 기본값으로 사용합니다.

## 최종 검증

- 전체 QA: **307/307, 실패 0건**
- 구간: 100/100 + 100/100 + 40/40 + 43/43 + 24/24
- 실미디어 5회 JS heap: 5.385 → 5.581 → 5.692 → 5.783 → 5.880MiB
- 종료 후 Object URL 0개, operation·render queue 잔류 0건
- Chromium RSS: 770.180 → 836.062MiB
- Chromium USS: 243.481 → 266.637MiB
- JS heap 기울기: 0.0052MiB/cycle
- CSS 충돌·동일값 중복·shadow: 0건
- 구조 probe: 안전 166, 필수 27, 미확인 13
- 서비스워커 무결성 대상: 135개 자산
- manifest SHA-256: `29809a1637112e3db0fab5b825dcc75b418e186fdfeaba083f993d5a8a184c6f`

## 배포 범위

- v1.6.31 대비 변경·추가: **48개**
- 신규 파일: **26개**
- 수정 파일: **22개**
- 삭제 파일: **0개**
- 최종 프로젝트: **1224개 파일**
