# Engine Resilience & Recovery

SoriON AI 0.11.0은 음성 엔진의 단순 fallback보다 **장애 격리, 단일 복구 probe, 재탐지, 운영 진단**을 하나의 런타임 계약으로 다룹니다.

## 핵심 계약

- 같은 엔진의 연속 실패가 임계치에 도달하면 circuit을 열고 cooldown 동안 새 요청을 즉시 다른 호환 엔진으로 우회합니다.
- cooldown이 끝나면 여러 요청을 동시에 장애 엔진으로 보내지 않습니다. **오직 한 요청만 half-open probe**를 획득하고 나머지 요청은 backup 엔진으로 진행합니다.
- half-open probe가 다시 실패하면 cooldown을 지수적으로 늘리되 `SORION_ENGINE_MAX_COOLDOWN_SECONDS` 상한을 넘지 않습니다. 기본값은 240초입니다.
- 복구 probe가 성공하면 연속 실패와 backoff 단계는 초기화합니다. 누적 circuit open 횟수는 운영 진단 이력으로 유지합니다.
- 사용자가 특정 엔진을 명시적으로 선택해도 열린 circuit을 우회하지 않고 계속 두드리지 않습니다. 격리 중인 선택 엔진은 즉시 런타임 사용 불가로 처리합니다.
- 프리셋 호환 불가(`SOA-4022`)는 엔진 자체 장애가 아니므로 circuit 실패 횟수에 포함하지 않습니다.
- 취소된 half-open 요청은 probe 점유를 반드시 해제해 영구적인 `probe_in_flight` 상태를 만들지 않습니다.

## 런타임 관측 지표

Engine API, Quality Lab, Engine Doctor는 엔진별로 다음 지표를 같은 계약으로 표시합니다.

- 총 시도 수, 성공 수, 실패 수, 연속 실패 수
- 성공률
- 최근 지연시간과 평균 지연시간
- 누적 circuit open 횟수
- 현재 cooldown 남은 시간
- half-open probe 진행 여부
- 최근 성공·실패 시각과 최근 오류

이 지표는 성능 benchmark를 대신하지 않습니다. 런타임 장애 격리와 복구 상태를 빠르게 판단하기 위한 운영 지표입니다.

## 수동 런타임 초기화

`POST /api/v1/engines/{engine_id}/runtime/reset`은 단순 카운터 삭제가 아닙니다. 엔진별 runtime refresh를 먼저 수행한 뒤 circuit 상태를 초기화합니다.

- System TTS: Windows/macOS/eSpeak 및 설치 음성을 다시 탐지합니다.
- MeloTTS: 로드된 모델 인스턴스를 비우고 다음 합성에서 깨끗하게 다시 로드합니다.
- CosyVoice Worker: Worker를 즉시 probe해 연결 가능성을 다시 확인합니다.

복구 probe 또는 일반 합성이 이미 실행 중이면 수동 초기화는 409로 거절합니다. 재탐지 중에는 해당 엔진으로 새 합성을 진입시키지 않고 backup 엔진으로 우회합니다. 재탐지 자체가 실패하면 circuit 상태를 무조건 지우지 않고 503으로 실패를 드러냅니다.

## Web 엔진 카탈로그

Web은 `cooldown`과 `probing` 엔진을 현재 사용 가능한 서버 엔진으로 선택하지 않습니다. cooldown 종료 예상 시점 또는 probe 중에는 엔진 카탈로그 캐시를 자동 무효화하고 다시 조회해 서버 상태가 UI에 오래 남지 않게 합니다.

Browser Speech fallback, System TTS의 eSpeak 보조 경로, 프리셋 성별 안전 규칙은 기존 계약을 유지합니다.

## 제한

- circuit breaker는 프로세스 메모리 상태입니다. API 프로세스 재시작 뒤 누적 런타임 지표는 초기화됩니다.
- 실제 CosyVoice 5개 프리셋 WAV·동의/권리 자료·모델 가중치는 릴리스 ZIP에 포함하지 않습니다.
- 시스템에 호환 한국어 음성·eSpeak·Melo/CosyVoice runtime이 없다면 소프트웨어가 존재하지 않는 음색을 생성하지 않습니다.
- 수동 초기화는 운영자가 엔진 설치나 Worker 상태를 수정한 뒤 재탐지할 때 사용하는 복구 도구이며, 반복적인 강제 reset으로 장애를 숨기는 용도가 아닙니다.
