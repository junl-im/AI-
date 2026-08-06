# NEXT UPDATE

현재 기준: `0.9.7 · Natural Playback Controls`

## 목표 버전

`0.9.8 · Approval Service Modularization & Operator Baselines`

## 최우선 구현

- 900줄을 넘은 `voice_preset_approval.py`를 trust·renewal·history·mutation 모듈로 분리
- 자동 성능 기준선과 운영자가 확정한 기준선 snapshot 분리
- 기준선 승인·교체·폐기 history와 명시적 confirmation
- 장시간 soak 결과의 Quality Lab 요약과 과거 실행 비교
- 절전 복귀, 네트워크 전환, Worker 재시작을 실제 시나리오로 주입하는 recovery soak
- SQLite writer lease backend interface를 유지하면서 관리형 DB advisory lock 확장점 정의
- 누적 HANDOVER 과거 기록을 `docs/archive`로 이동해 핵심 인수인계 길이 축소

## 선행 조건과 위험

- 승인 서비스 분리는 checksum·서명·원자 쓰기·fencing 계약을 바꾸지 않는 단계적 리팩터링으로 진행합니다.
- 운영자 기준선은 충분한 실제 장치 표본 없이 자동 확정하지 않습니다.
- 네트워크 장애 주입 soak는 일반 Push CI가 아니라 수동·예약 job에서만 실행합니다.
- SQLite를 일반 NFS 위의 진정한 분산 lock으로 사용하지 않습니다.

## 0.9.7에서 넘기는 결정

- 재생 버튼은 사용자 클릭 즉시 일시정지로 바뀌며 실제 재생 이벤트를 기다리지 않습니다.
- 준비 중 다시 누르면 pending 재생을 취소하고 늦은 Browser Speech callback을 무시합니다.
- 파일 음원과 Browser Speech는 같은 `재생 → 일시정지 → 재생` 상태 계약을 사용합니다.
- 0.9.8은 UX 변경과 분리해 승인 서비스 리팩터링을 진행합니다.
