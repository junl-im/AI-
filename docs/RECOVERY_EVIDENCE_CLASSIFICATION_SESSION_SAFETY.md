# Recovery Evidence Classification & Session Safety

기준 버전: `0.11.6`

## 목적

복구 경로를 안전하게 주입한 진단 결과와 실제 Android/iOS 기기에서 관찰한 복구 결과를 같은 인증 증거로 취급하지 않습니다. 동시에 batch 재시도 편의성을 프로젝트 세션에 복원하되 대사나 음원, 상세 오류처럼 민감할 수 있는 내용을 세션 snapshot에 남기지 않습니다.

## Recovery evidence class

- `observed-device`: 실제 기기에서 네트워크 전환·백그라운드 복귀·설치형 PWA 등의 복구를 관찰한 기록입니다. recovery certification coverage에 사용할 수 있습니다.
- `synthetic-injection`: 실제 Wi-Fi나 OS 상태를 바꾸지 않고 앱 내부 recovery handler를 주입 실행한 진단 기록입니다. 기능 경로 점검에는 유용하지만 실기기 READY 인증을 충족하지 않습니다.
- `not-applicable`: baseline처럼 recovery provenance가 필요하지 않은 기록입니다.

실기기 Device Soak Recorder는 recovery scenario를 `observed-device`로 기록합니다. Recovery Path Injection은 항상 `synthetic-injection`으로 고정되며 JSON export에도 이 분류를 포함합니다. API는 recovery scenario에서 `observed-device`가 아닌 기록을 warning으로 남기고 certification coverage에서 제외합니다.

## Evidence bundle compatibility

신규 evidence bundle은 schema v3를 사용합니다. 레코드에 추가된 `recovery_evidence_class`가 manifest/hash 범위에 포함되므로 provenance 변경도 checksum 검증 대상입니다. 기존 schema v2 bundle은 verifier가 v2 schema version으로 manifest를 재계산하여 계속 검증합니다.

## Workspace session v3

프로젝트 세션에 보존하는 batch retry 정보는 다음으로 제한합니다.

- 최근 history 최대 6건
- retry count 최대 3회
- 완료 시각
- retry 여부
- requested/succeeded/failed/skipped 집계
- `engine`, `preset`, `network`, `cancelled`, `unknown` 실패 분류

저장하지 않는 항목은 clip ID, 대사 원문, 생성 음원/URL, job ID, 상세 오류 문자열입니다. codec은 허용된 필드만 새 객체로 다시 구성하므로 snapshot에 임의 필드를 넣어도 복원 과정에서 제거됩니다. schema v1/v2 session은 빈 batch snapshot을 적용해 v3로 안전하게 복원합니다.

## 미완료 항목

- 승인된 Chromium 1024/1280/1440 baseline PNG가 저장소에 들어오기 전에는 `SORION_VISUAL_BASELINE_REQUIRED=1`을 강제하지 않습니다.
- `active_request_count` 기반 자동 엔진 분산은 장시간 soak에서 엔진 전환 churn을 추가 측정해야 합니다.
- 현재 이동 Undo는 직전 1회 경량 복원입니다. 구조 변경까지 포함한 snapshot/history Undo는 별도 안전성 검증 뒤 결정합니다.
