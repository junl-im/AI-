# Long-Run Reliability & Writer Safety

SoriON AI 0.9.6은 승인 파일 쓰기 경합과 API·Worker 장시간 실행 상태를 별도 안전 경계로 관리합니다.

## Writer 안전성

프리셋 승인, 현재 키 재서명, 승인 롤백은 다음 순서로 보호됩니다.

1. 프로세스 내부 thread lock
2. SQLite `BEGIN IMMEDIATE` writer lease
3. 매 lease 획득마다 증가하는 fencing token
4. 기존 운영체제 file lock
5. 적용 직전 manifest·WAV 재검증
6. fencing token 현재성 재확인
7. 임시 파일 작성, flush·fsync, 원자 교체
8. history append와 디렉터리 fsync

lease가 만료되거나 다른 API 프로세스가 더 높은 fencing token을 획득하면 이전 writer는 실제 파일 쓰기 직전에 중단됩니다.

기본 설정은 다음과 같습니다.

```env
SORION_VOICE_REVIEW_WRITER_LEASE_PATH=.sorion/quality/voice-review-writer.sqlite3
SORION_VOICE_REVIEW_WRITER_LEASE_SECONDS=30
SORION_VOICE_REVIEW_LOCK_TIMEOUT_SECONDS=10
```

SQLite lease는 **같은 SQLite 파일을 안전하게 공유하는 프로세스**를 위한 구조입니다. 서로 다른 서버의 일반 네트워크 파일시스템을 진정한 분산 lock으로 표현하지 않습니다. 다중 노드 배포에서는 관리형 데이터베이스 advisory lock 또는 전용 분산 lock backend를 별도로 선택해야 합니다.

## API·Worker 장시간 soak

기존 `.github/workflows/ci.yml`의 수동 실행에서 `runtime_soak_minutes`를 5, 30, 60분 중 선택할 수 있습니다. 매주 예약 실행은 30분으로 수행됩니다. 일반 Push·PR에서는 장시간 job을 실행하지 않습니다.

보고서는 다음을 기록합니다.

- API·Worker probe 표본 수와 성공률
- 응답 시간 P50·P95
- 연속 실패에 따른 최장 중단 시간
- 실패 뒤 복구 횟수와 복구 시간 P95
- API 메모리 시작·종료·최대·증가량
- 열린 파일·소켓 descriptor 시작·종료·최대·증가량
- 임계값, 판정 사유, 전체 report SHA-256

결과 파일은 `.sorion/soak/runtime-soak.json`에 생성되고 workflow artifact로 보존됩니다.

## 개인정보 제외 감사 ZIP

Quality Lab의 `개인정보 제외 감사 ZIP`은 서버에서 감사 JSON을 다시 검증한 뒤 다음 파일만 묶습니다.

- `audit.json`: redacted 감사 자료
- `MANIFEST.json`: 파일별 크기와 SHA-256, 감사 bundle SHA-256
- `README.txt`: 포함·제외 범위

실제 WAV, 동의·권리 원문, 사용자 식별자, GPU 원문, 비밀키와 서명 원문은 포함하지 않습니다. SHA-256은 변조 탐지용이며 전자서명이나 법적 권리 증명으로 표현하지 않습니다.
