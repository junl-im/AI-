# NEXT UPDATE

현재 기준: `0.9.9 · CI Quality Hotfix`

## 목표 버전

`0.10.0 · Approval Service Modularization & Operator Baselines`

## 최우선 구현

- 900줄을 넘은 `voice_preset_approval.py`를 trust·renewal·history·mutation 모듈로 분리
- 자동 성능 기준선과 운영자가 확정한 기준선 snapshot 분리
- 기준선 승인·교체·폐기 history와 명시적 confirmation
- 장시간 soak 결과의 Quality Lab 요약과 과거 실행 비교
- 절전 복귀, 네트워크 전환, Worker 재시작 recovery soak
- SQLite writer lease backend interface와 관리형 DB advisory lock 확장점 정의
- 누적 HANDOVER 과거 기록을 `docs/archive`로 이동

## 선행 조건과 위험

- 승인 서비스 분리는 checksum·서명·원자 쓰기·fencing 계약을 바꾸지 않는 단계적 리팩터링으로 진행합니다.
- 운영자 기준선은 충분한 실제 장치 표본 없이 자동 확정하지 않습니다.
- 네트워크 장애 주입 soak는 일반 Push CI가 아니라 수동·예약 job에서만 실행합니다.

## 0.9.9에서 넘기는 결정

- first-party Python import는 Ruff isort의 모듈명 오름차순을 따릅니다.
- media element 렌더 초기화 호출과 사용자 조작 호출은 테스트 mock 기준점을 분리합니다.
- 품질 게이트 Hotfix는 제품 동작을 바꾸지 않고 실패 원인만 최소 수정합니다.
