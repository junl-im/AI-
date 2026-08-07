# Visual Baseline Approval & Recovery Provenance

기준 버전: `0.11.4`

## 1. 승인형 Visual Baseline

`npm run quality:visual-layout`은 1024x900, 1280x900, 1440x900 Chromium 캡처와 DOM 레이아웃 계약을 검사한다.

`npm run quality:visual-layout:approve`는 동일 runner에서 현재 캡처를 `visual-baselines/workspace`의 승인 기준선으로 저장한다. 승인 후 일반 검사는 기준 PNG와 현재 PNG를 Canvas pixel data로 비교한다.

기본 정책:

- 채널 차이 임계치: `24`
- 허용 diff pixel 비율: `0.005` (0.5%)
- 환경 변수: `SORION_VISUAL_CHANNEL_THRESHOLD`, `SORION_VISUAL_MAX_DIFF_RATIO`
- 기준선 누락을 실패로 만들려면 `--require-baseline` 또는 `SORION_VISUAL_BASELINE_REQUIRED=1`

기준선이 아직 승인되지 않은 저장소에서는 DOM layout 검사는 계속 수행하고 현재 PNG를 후보 evidence로 남긴다. 기준선 승인 전에는 픽셀 비교 통과를 주장하지 않는다.

## 2. Runtime Soak 비교 provenance

Quality Lab의 runtime soak 비교는 선택한 두 JSON을 다음 메타데이터와 함께 취급한다.

- 원본 파일명
- 실제 파일 내용 SHA-256
- report 내부 SHA-256
- 앱 버전
- soak 완료 시각
- UI 로드 시각
- 비교 실행 시각

`비교 증거 JSON 저장`은 `runtime-soak-comparison/1` schema로 위 provenance와 회귀 판정을 함께 내보낸다.

## 3. Batch 재시도 이력

Timeline Editor는 최근 일괄 작업 6건을 현재 편집 세션 동안 보존한다. 각 기록은 성공·실패·건너뜀 개수와 실패 원인 그룹을 보여준다. 빠른 재시도 3회 상한은 유지하며, 이력 자체는 서버 영구 기록이나 품질 인증 증거가 아니다.

## 4. Engine 성능 관찰창 리셋

Adaptive performance routing은 `performance_window_seconds`보다 오래 새 표본이 없었다면 다음 합성 성공/실패를 새 관찰 세션의 첫 표본으로 처리한다. 오래된 latency/reliability EWMA와 새 표본을 섞지 않으며, 최소 표본 수가 다시 채워지기 전에는 성능 기반 auto 감점을 적용하지 않는다.
