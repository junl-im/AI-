# AUDIT REPORT v1.6.40

## 시스템·기능·엔진

- 분석 pipeline, Smart Reframe, speaker grid, Local AI provider/coordinator, preview, render queue, 프로젝트 저장, 서비스워커, 진단 bundle 연결 계약을 재검증했습니다.
- Local AI 제공자별 endpoint를 이름 있는 profile로 저장하고 endpoint·선호 모델·최근 probe·model cache를 독립 운영하도록 확장했습니다.
- 기존 단일 endpoint settings는 provider별 기본 profile로 migration해 업데이트 호환성을 유지했습니다.
- profile 전환은 저장값만 복원하며 endpoint-bound runtime trust를 초기화해 새 probe 전 generation/transcription이 이전 확인 상태를 재사용하지 않습니다.

## 발견 문제·버그·개선

1. endpoint 주소를 매번 직접 입력해야 했습니다. 제공자별 named profile 선택·저장·삭제 UI와 API를 추가했습니다.
2. endpoint 설정은 저장됐지만 최근 확인 결과와 모델 목록을 함께 복원할 수 없었습니다. profile별 bounded probe/model cache를 추가했습니다.
3. 저장된 endpoint로 전환할 때 이전 runtime ready 상태가 재사용될 가능성을 차단해야 했습니다. activation 시 endpoint 상태를 무효화하고 재연결을 요구합니다.
4. profile 삭제 후 endpoint-scoped pin이 고아 상태로 남을 수 있었습니다. 삭제 endpoint token 범위 pin을 함께 정리합니다.
5. 동일 endpoint profile 중복과 모든 profile 삭제가 운영 혼선을 만들 수 있었습니다. duplicate와 final-profile 삭제를 차단했습니다.
6. 정적 `<body data-build>` 값이 v1.6.39에 남아 있었습니다. v1.6.40으로 동기화하고 품질 게이트를 재통과했습니다.

## 기술·보안·예외 처리

- profile endpoint는 기존과 동일하게 http/https loopback 주소만 허용하고 username/password·query·hash를 제거합니다.
- profile id/name/model/probe/model list는 길이·수량·숫자 범위를 제한해 저장합니다.
- model pin key에는 endpoint 원문 대신 비가역 endpoint token을 유지합니다.
- diagnostics snapshot은 endpoint profile count와 active profile token만 노출합니다.
- 실제 Node loopback HTTP transport의 redirect 차단·timeout·external abort·superseding probe·shared deadline 계약을 재검증했습니다.
- 실제 Ollama·llama.cpp·whisper.cpp 모델 추론은 실행하지 않았습니다.

## QA·브라우저·성능

- 전체 등록 QA: **318/318 통과**, 실패 0건
- 실행 방식: 등록 순서 분할 실행, 현재 버전 감사 산출물 생성, 순서 의존 검사 재실행
- 합산 실행 시간: **80.814초**
- 4개 viewport: page error·console error·unhandled rejection·runtime error·수평 overflow 모두 0건
- 실미디어 heap 5회: dispose 후 활성 URL 0, operation/queue 잔류 0, 마지막 window 증가 0 MiB, slope 0.103 MiB/cycle
- Chromium process-memory 8회: runtime error 0, JS heap slope 0.0089 MiB/cycle, RSS 771.575→869.177 MiB
- 실제 30분 1920×1080 Smart Reframe: 24개 bounded sample, 5.234초, crop·9:16·caption-safe 계약 통과
- CSS: 50개 파일, 공유 selector 192개, property conflict 0, same-value duplicate 0, shadowed declaration 0, `!important` 593개
- 구조 priority 후보 206개: safe 165, unsafe 29, unproven 12, 실행 오류 0

## 서비스워커·무결성

- 앱 셸 무결성 대상: 135개
- asset manifest SHA-256: `0edcb298f0484ab806af510f28326cbfc7e94cd1159f77418dcc759e0e0569a7`

## 알려진 제한

- endpoint profile은 현재 Local AI settings에 저장되며 별도 export/import UI는 없습니다.
- endpoint 원문은 diagnostics와 pin key에 저장되지 않지만 profile 자체에는 연결을 위해 localhost 주소가 저장됩니다.
- process-memory 감사에서 전체 RSS가 증가했습니다. JS heap은 안정적이지만 browser·GPU·utility native cache를 더 긴 주기로 분리 추적해야 합니다.
- headless 컨테이너에서는 물리 GPU 가속과 iOS Safari·Samsung Internet 실제 touch/drag를 검증하지 못했습니다.
- 15→30→15분 전체 장시간 시퀀스는 변경되지 않은 persistence·render cleanup·Object URL ownership 경로의 기존 완주 증빙을 승계하고, 현재 v1.6.40의 30분 Smart Reframe·heap·process-memory 감사를 새로 연결했습니다.
