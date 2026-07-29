# AUDIT REPORT v1.6.39

## 시스템·기능·엔진

- 분석 pipeline, Smart Reframe, speaker grid, Local AI provider/coordinator, preview, render queue, 프로젝트 저장, 서비스워커, 진단 bundle 연결 계약을 재검증했습니다.
- Local AI 모델 digest pin을 `provider + endpoint token + model id` 범위로 분리해 서로 다른 localhost 서버의 동일 모델명이 신뢰 상태를 공유하던 문제를 제거했습니다.
- 기존 `provider:model` pin은 저장된 현재 endpoint 범위로 자동 이관해 업데이트 호환성을 유지했습니다.
- generation·transcription 실패도 bounded provider history에 기록해 HTTP 오류·timeout·취소·검증 실패의 사후 진단이 가능해졌습니다.

## 발견 문제·버그·개선

1. 여러 endpoint의 동일 모델명이 하나의 digest pin을 공유했습니다. endpoint token을 포함한 v2 key로 분리했습니다.
2. endpoint B를 pin하면 endpoint A의 pin이 덮어써졌습니다. 서버별 pin을 독립 보존하도록 수정했습니다.
3. 다른 endpoint에 pin이 있는 상태에서 새 endpoint를 확인하기 전 신뢰 상태가 모호했습니다. probe 전 `stale`로 차단하고 probe 후 독립 `unpinned/verified/mismatch` 상태를 계산합니다.
4. generation·transcription 실패가 진단 이력에 남지 않았습니다. prompt·schema·endpoint·미디어 내용을 제외한 privacy-safe 실패 이력을 추가했습니다.
5. 전사 입력의 `file.size`가 `NaN`, `Infinity`, 음수이면 제한 검사를 우회할 수 있었습니다. transport 전에 finite·0 이상 여부를 검증합니다.
6. UI pin·unpin 호출이 endpoint를 명시하지 않아 향후 설정 전환 중 잘못된 범위가 선택될 가능성이 있었습니다. 현재 endpoint를 명시적으로 전달하고 정적 회귀를 추가했습니다.

## 기술·보안·예외 처리

- pin key에는 endpoint 원문 대신 정규화 endpoint의 비가역 16자리 token만 저장합니다.
- 저장된 v2 pin은 provider·endpoint token·model id 형식을 검증한 뒤 수용합니다.
- provider history는 type, providerId, capability, modelToken, errorCode, bounded error, elapsedMs만 유지합니다.
- 실제 Node loopback HTTP transport의 redirect 차단·timeout·external abort·superseding probe·shared deadline 계약을 재검증했습니다.
- 실제 Ollama·llama.cpp·whisper.cpp 모델 추론은 실행하지 않았습니다.

## QA·브라우저·성능

- 전체 등록 QA: **317/317 통과**, 실패 0건
- 실행 방식: 등록 순서 분할 실행, 현재 버전 감사 산출물 생성, 순서 의존 검사 독립 재실행
- 합산 실행 시간: 88.495초
- 4개 viewport: page error·console error·unhandled rejection·runtime error·수평 overflow 모두 0건
- 실미디어 heap 5회: Object URL 생성/해제 10/10, dispose 후 활성 URL 0, operation/queue 잔류 0, 마지막 window 증가 0 MiB, slope 0.104 MiB/cycle
- Chromium process-memory 8회: runtime error 0, JS heap slope 0.009 MiB/cycle, RSS 773.262→881.855 MiB
- 실제 30분 1920×1080 Smart Reframe: 24개 bounded sample, 2.977초, crop·9:16·caption-safe 계약 통과
- CSS: 50개 파일, 공유 selector 192개, property conflict 0, same-value duplicate 0, shadowed declaration 0, `!important` 593개
- 구조 priority 후보 206개: safe 167, unsafe 26, unproven 13, 실행 오류 0

## 서비스워커·무결성

- 앱 셸 무결성 대상: 135개
- asset manifest SHA-256: `9bbb075f71d8ab75bd67fdcc161e34320d510ebc53ee7f1361725c42e7232d44`

## 알려진 제한

- endpoint profile 이름·목록을 관리하는 별도 UI는 아직 없습니다.
- endpoint 원문은 pin key에 저장되지 않지만 사용자가 입력한 localhost 주소는 Local AI 설정에 저장됩니다.
- process-memory 감사에서 전체 RSS가 증가했습니다. JS heap은 안정적이지만 browser·GPU·utility native cache를 더 긴 주기로 분리 추적해야 합니다.
- headless 컨테이너에서는 물리 GPU 가속과 iOS Safari·Samsung Internet 실제 touch/drag를 검증하지 못했습니다.
- 15→30→15분 전체 장시간 시퀀스는 변경되지 않은 IndexedDB persistence·render cleanup·Object URL ownership 경로의 기존 완주 증빙을 승계하고, 현재 v1.6.39의 30분 Smart Reframe·heap·process-memory 감사를 새로 연결했습니다.
