# NEXT UPDATE

현재 기준: `0.9.5 · Benchmark Baseline & Privacy-Safe Audit Bundle`

## 목표 버전

`0.9.6 · Distributed Writer Safety & Long-Run Reliability`

## 최우선 구현

- 단일 호스트 파일 잠금 범위를 넘어서는 다중 노드 writer 안전성 설계
- SQLite 또는 외부 lock backend를 통한 승인 apply·재서명·rollback 직렬화
- API·Worker 30·60분 자동 soak와 메모리·연결 누수 경보
- 절전 복귀, 네트워크 전환, Worker 재시작 후 자동 복구 시간 장기 추적
- 자동 기준선의 기간·표본 window 정책과 운영자 확정 snapshot 분리
- 감사 bundle을 JSON과 ZIP manifest 형태로 함께 내보내는 선택적 export
- 대형 `voice_preset_approval.py`를 trust·renewal·history 모듈로 분리

## 선행 조건과 위험

- 분산 잠금은 실제 배포 topology가 정해진 뒤 backend를 선택해야 합니다.
- Redis 같은 새 운영 의존성을 무조건 추가하지 않습니다.
- 장시간 soak는 CI 시간을 과도하게 늘리지 않도록 수동·scheduled workflow로 분리합니다.
- 기준선 snapshot은 충분한 실제 표본과 운영자 확인 없이 자동 확정하지 않습니다.
- 감사 ZIP에도 실제 WAV, 동의 원문, 비밀키와 사용자 식별자를 포함하지 않습니다.

## 0.9.5에서 넘기는 결정

- Worker 회귀는 같은 모델·digest·가속기·프리셋 그룹 안에서만 비교합니다.
- 최초 5건과 최근 5건의 비중첩 window를 사용하며 총 10건 미만은 판정하지 않습니다.
- 자동 회귀 경보는 실기기 인증과 장시간 soak를 대체하지 않습니다.
- 개인정보 제외 감사 JSON은 actor·reviewer·IP·GPU 원문·signature를 제거합니다.
- 감사 bundle SHA-256은 변조 탐지용이며 전자서명으로 표현하지 않습니다.
