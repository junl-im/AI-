# NEXT UPDATE

현재 기준: `0.11.0 · Adaptive Engine Resilience & Recovery`

## 목표 버전

`0.11.1 · Visual Regression & Safe Batch Voice Editing`

## 최우선 구현

- 실제 Chromium 환경의 1024·1280·1440px Compact Dock·3분할·빠른 편집기 screenshot 기준선과 시각 회귀
- 다중 선택 클립의 일괄 재생성·voice 변경·실행 전 영향 preview와 실패 부분만 재시도
- Engine Doctor에서 브라우저 음성 inventory 변경 전후 프리셋별 배정 diff 표시
- 실제 OS 절전·Wi-Fi 전환 실기기 증거를 synthetic Recovery Path Injection과 명확히 분리
- runtime soak 비교 결과에 파일명·SHA-256·비교 시각 provenance 내보내기
- 필요하면 엔진 runtime 지표의 프로세스 재시작 간 persistence 여부를 별도 설계하되, 장애 상태를 오래 고착시키지 않는 정책을 먼저 정의

## 0.11.0에서 고정한 결정

- circuit cooldown 종료 뒤 복구 시도는 한 번에 한 요청만 half-open probe를 획득합니다.
- 명시적 엔진 선택도 circuit breaker를 우회하지 않습니다.
- 프리셋 호환 불가 `SOA-4022`는 엔진 장애 카운터에 포함하지 않습니다.
- 반복 probe 실패는 bounded exponential cooldown, 성공은 backoff reset을 사용합니다.
- 수동 runtime reset은 엔진별 rediscovery/refresh가 성공한 뒤에만 circuit을 초기화합니다.
- Browser Speech fallback, System TTS eSpeak 보조 경로, 반대 성별 강제 대체 금지는 유지합니다.
- 카드별 textarea는 다시 도입하지 않고 단일 빠른 편집기 + 다중 선택 일괄 패널 구조를 유지합니다.
- 운영자 benchmark baseline 복원은 append-only history를 유지합니다.
