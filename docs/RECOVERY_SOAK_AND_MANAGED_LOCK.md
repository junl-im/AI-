# Recovery Soak & Managed Lock Interface

적용 버전: **SoriON AI 0.10.2**

## Recovery Soak

API·Worker 장시간 검사는 현재 실행만 통과시키는 데서 끝나지 않고 이전 실행과 비교한다.
각 실행은 성공률, 응답 P95, 최장 중단, 복구 P95, 메모리 증가와 열린 파일·연결 증가를 기록한다.

이전 실행 비교는 다음 조건을 회귀로 표시한다.

- P95 응답이 이전보다 35% 이상이면서 75ms 이상 증가
- 성공률이 1%p 이상 하락
- 메모리 증가량이 이전보다 64MiB 초과 증가
- 열린 파일·연결 증가량이 이전보다 16개 초과 증가
- 복구 P95가 이전보다 50% 이상이면서 10초 이상 증가

회귀 비교는 경고로 남기고 현재 실행 자체의 성공률·중단·누수 기준이 실패한 경우에만 job을 실패시킨다.

## Worker 재시작 복구 훈련

수동 5·30·60분 검사와 주간 30분 검사에서 Worker를 한 번 실제로 종료하고 다시 시작한다.
복구 훈련은 시작 시각, 복구 시각, 복구 시간과 실패 원인을 `recovery-events.json`에 남긴다.
복구 시간이 45초를 넘거나 Worker가 다시 준비되지 않으면 soak 보고서를 실패로 판정한다.

## 이전 실행 보존

GitHub Actions cache의 `.sorion/soak-history/latest.json`을 이전 실행 기준으로 사용한다.
현재 실행이 끝나면 새 보고서를 다음 실행 기준으로 교체한다.
보고서 전체에는 SHA-256이 포함돼 비교 입력이 바뀌었는지 확인할 수 있다.

## WriterLeaseCoordinator

승인 파일 writer 잠금은 `WriterLeaseCoordinator` Protocol을 사용한다.
현재 기본 backend는 SQLite writer lease이며 기존 fencing token과 file lock 순서를 유지한다.

`SORION_VOICE_REVIEW_WRITER_LEASE_BACKEND=sqlite`가 기본값이다.
지원하지 않는 backend 이름은 조용히 우회하지 않고 API 시작 단계에서 거부한다.
관리형 DB advisory lock은 이 Protocol을 구현한 뒤 factory에 명시적으로 등록해야 한다.

## PC 3분할 폭 계약

의존성 없는 계약 검사와 Vitest에서 1024·1280·1440px의 기본 3분할 폭을 고정한다.

- 1024px: 왼쪽 224px / 중앙 502px / 오른쪽 286px
- 1280px: 왼쪽 224px / 중앙 758px / 오른쪽 286px
- 1440px: 왼쪽 224px / 중앙 918px / 오른쪽 286px

1024px 미만은 기존 단일 작업 폭을 유지한다.
