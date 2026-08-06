# NEXT UPDATE

현재 기준: `0.10.1 · Approval Modularization & Operator Baselines`

## 목표 버전

`0.10.2 · Recovery Soak & Managed Lock Interface`

## 최우선 구현

- 절전 복귀·네트워크 전환·Worker 재시작 장애 주입과 자동 복구 시간 측정
- 30·60분 soak 결과의 이전 실행 비교와 회귀 표시
- SQLite writer lease와 관리형 DB advisory lock을 연결하는 backend interface
- 운영자 기준선 history 조회와 선택적 복원 preview
- Quality Lab 1024·1280·1440px 3분할 시각 회귀 검사
- 누적 HANDOVER 과거 기록을 `docs/archive`로 분리

## 0.10.1에서 넘기는 결정

- 자동 기준선과 운영자 확정 기준선은 별도 상태로 유지합니다.
- 운영자 기준선은 동일 조건 최근 5건과 source record SHA-256을 사용합니다.
- 승인 파일 쓰기 안전성은 모듈 분리 뒤에도 기존 잠금 순서를 유지합니다.
