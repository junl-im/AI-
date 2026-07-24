# QA REPORT v1.6.2

## 범위

v1.6.2 Layout Harmony & Footer Health와 기존 미디어 분석·프로젝트·자막·렌더·캐시·세션·서비스워커·Local AI 기능을 함께 검증합니다.

## 자동 검사

- 등록 검사 수: **221개**
- 신규·확장 검사:
  - `qa/run_storage_health_browser_audit.py`
  - `qa/storage_health_browser_audit_smoke.js`
  - `qa/run_layout_harmony_browser_audit.py`
  - `qa/layout_harmony_browser_audit_smoke.js`

저장소 검사는 페이지 최하단 배치, 정상 상태 비개입, actionable 상태 1회 자동 이동·강조를 확인합니다. Layout Harmony 검사는 Local AI 기본 접힘, 명시적 펼침, 데스크톱 전체 폭 행, 모바일 정렬, focus mode 숨김, 가로 overflow 0을 확인합니다.

## 일반 브라우저 감사

`qa/runtime-browser-audit-v1.6.2.json`

- desktop 1440×1000
- small laptop 1280×800
- tablet 900×1000
- mobile 390×844
- 런타임 오류, unhandled rejection, console error, 가로 overflow: **0**

## 저장소·배치 전용 감사

- `qa/runtime-storage-health-browser-v1.6.2.json`
- `qa/runtime-layout-harmony-browser-v1.6.2.json`
- 저장소 패널이 전체 workspace 뒤에 위치
- 정리·복구 필요 상태에서만 1회 자동 이동·강조
- Local AI desktop 전체 폭 정렬, mobile compact summary
- 접힘·펼침 모두 가로 overflow 0
- 미리보기·파형 집중 모드에서 optional AI 숨김

## CSS·구조 감사

- `qa/runtime-css-ownership-v1.6.2.json`
- CSS 48개 파일, 충돌·동일값 중복·shadowed declaration 0, `!important` 593
- 구조 priority probe: safe 166, unsafe 27, unproven 13, 오류 0
- interaction state 34개 상태, 오류 0

## 서비스워커

`qa/runtime-service-worker-lifecycle-v1.6.2.json`

- install: 현재 앱 셸 캐시 생성
- activate: 이전 캐시 정리·clients claim
- offline navigation: 캐시된 `index.html` 응답
- 앱 셸 123개 SHA-256 manifest 검증

## GPU·미디어·메모리 보조 감사

- `qa/runtime-gpu-media-capability-v1.6.2.json`
- `qa/runtime-process-memory-v1.6.2.json`
- GPU/software-safe 두 모드 미디어 디코딩 성공, GPU·media utility process 관측, 런타임 오류 0
- JS heap slope 약 0.0061MiB/cycle, peak RSS 약 857.2MiB
- RSS 결과는 headless Chromium warmup을 포함하므로 누수 부재의 단독 근거로 사용하지 않습니다.

## 장시간 영상

`qa/runtime-long-video-stability-v1.6.2.json`은 이번 변경이 미디어 디코드·분석·렌더·Object URL 경로를 변경하지 않는지 확인하고 검증된 15→30→15분 1080p 실측 근거의 상속 여부를 명시합니다.

## 제한

- 실제 모바일 Safari·Samsung Internet의 스크롤·포커스와 보조기술 조합은 별도 실기기 검증 대상입니다.
- Local AI 모델 품질과 처리 속도는 설치 모델·하드웨어별 수동 검증 대상입니다.
- 물리 GPU·NPU와 실제 운영 CORS 설정은 자동 감사 범위가 아닙니다.
