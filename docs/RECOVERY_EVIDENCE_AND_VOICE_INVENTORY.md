# Recovery Evidence & Voice Inventory Diagnostics

기준 버전: `0.10.7`

## Runtime soak 비교

Quality Lab의 `RUNTIME SOAK COMPARE` 카드는 `services/api/scripts/run_runtime_soak.py`가 만든
`runtime-soak/2` JSON 두 개를 브라우저에서 직접 비교합니다.

- 이전/현재 보고서를 사용자가 직접 선택합니다.
- API·Worker target별 P95 응답, 성공률, 메모리 증가, 열린 파일·연결 증가, P95 복구 시간을 비교합니다.
- 회귀 임계치는 API `compare_runtime_soak_reports()`와 같은 기준을 사용합니다.
- 보고서를 업로드하거나 서버에 저장하지 않고 현재 브라우저 메모리에서만 읽습니다.

## 복구 경로 주입

`RECOVERY PATH INJECTION`은 실제 네트워크나 OS 절전을 변경하지 않습니다.

- 온라인 복귀: `online` → `sorion-engine-refresh`
- 페이지 복귀: `pageshow` → `focus` → `sorion-engine-refresh`
- 네트워크 종류 변경: 지원 기기에서 `navigator.connection.change` → `sorion-engine-refresh`

이 기능은 이벤트 처리 코드가 다시 실행되는지 확인하는 개발·운영 진단입니다. 실제 Wi-Fi 전환,
모바일 백그라운드 복귀, OS 절전 복귀의 실기기 인증을 대신하지 않습니다.

## 브라우저 음성 inventory

Engine Doctor는 Web Speech API의 현재 음성 목록을 정렬한 뒤 이름, URI, 언어, local/default 여부를
기반으로 진단용 FNV-1a fingerprint를 계산합니다.

- 저장소에는 fingerprint와 개수만 남기며 음성 원문 목록을 별도 수집하지 않습니다.
- 이전 실행과 fingerprint가 바뀌면 `목록 변경 감지`를 표시합니다.
- `voiceschanged`가 발생하면 프리셋 배정을 다시 계산하고 엔진 카탈로그 cache를 무효화합니다.
- 운영자가 현재 목록을 확인하면 새 fingerprint를 기준으로 승인할 수 있습니다.
- fingerprint는 보안 서명이나 무결성 증명이 아니라 변화 감지용 진단 값입니다.

## Worker telemetry group key

운영자 기준선 이력은 기준선이 아직 없는 Worker 그룹에서도 동작해야 하므로
`WorkerTelemetryAggregate.group_key`를 API 응답의 필수 필드로 승격했습니다. Web은 이를 `groupKey`로
매핑해 History 조회에 사용합니다.
