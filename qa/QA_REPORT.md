# QA REPORT v1.6.0

## 범위

v1.6.0 Local AI Provider Foundation과 기존 미디어 분석·프로젝트·자막·렌더·캐시·세션·서비스워커 기능을 함께 검증합니다.

## 자동 검사

- 등록 검사 수: **216개**
- 최종 결과: **216/216 통과**
- 신규 검사:
  - `qa/local_ai_provider_registry_smoke.js`
  - `qa/ai_job_coordinator_smoke.js`
  - `qa/local_ai_studio_smoke.js`

신규 검사는 loopback 강제, URL 인증 정보 차단, 무통신 초기 상태, Ollama 모델 목록·digest 고정·변경 차단, llama.cpp native schema, whisper.cpp multipart `response_format`, OpenAI 호환 fallback, SRT 경계, 직렬 큐·취소·timeout·진행률·이력 제한, 단계 적재 UI를 확인합니다.

## 브라우저 감사

`qa/runtime-browser-audit-v1.6.0.json`

- desktop 1440×1000
- small laptop 1280×800
- tablet 900×1000
- mobile 390×844
- 각 화면의 런타임 오류, unhandled rejection, console error, 가로 overflow: **0**
- 앱 버전·활성 flow·핵심 runtime health 수집

## CSS 감사

`qa/runtime-css-ownership-v1.6.0.json`

- CSS 파일: 48개
- 활성 CSS 파일: 47개
- 충돌: 0
- 동일값 중복: 0
- shadowed declaration: 0
- `!important`: 593개로 기존 구조 우선순위 계약 유지

## 서비스워커

`qa/runtime-service-worker-lifecycle-v1.6.0.json`

- install: 현재 앱 셸 캐시 생성
- activate: 이전 캐시 정리·clients claim
- offline navigation: 캐시된 `index.html` 응답
- 신규 Local AI 자산을 SHA-256 manifest에 포함

## GPU·미디어 보조 감사

`qa/runtime-gpu-media-capability-v1.6.0.json`

- acceleration-requested / software-safe 두 모드 실행
- MP4/H.264/AAC 1280×720 샘플
- 각 모드 총 62프레임, dropped frame 0
- 런타임 오류 0
- headless 환경에서는 물리 GPU 가속을 보장하지 않음

## 프로세스 메모리 보조 감사

`qa/runtime-process-memory-v1.6.0.json`

- 4회 UI 순환
- renderer JS heap slope 약 0.0053MiB/cycle
- 런타임 오류 0
- 프로세스 RSS는 warmup을 포함해 증가했으므로 이 자료만으로 누수 부재를 주장하지 않음

## 구조·장시간 영상

- `runtime-structure-priority-probe-v1.6.0.json`: safe 165, unsafe 29, unproven 12
- `runtime-structure-priority-v1.6.0.json`: 검증된 구조 우선순위 감축 결과와 현재 probe 연결
- `runtime-long-video-stability-v1.6.0.json`: AI 패치가 미디어 디코드·분석·렌더·Object URL 경로를 변경하지 않아 검증된 15→30→15분 1080p 실측 근거를 명시적으로 상속

## 제한

- 실제 Ollama·llama.cpp·whisper.cpp 모델의 품질과 처리 속도는 설치 모델·하드웨어별 수동 검증 대상입니다.
- 로컬 서버 CORS와 loopback bind 설정은 자동 구성하지 않습니다.
- 모바일 실기기와 물리 GPU·NPU 테스트는 포함되지 않습니다.
- 브라우저 내부 WASM 전사는 이번 릴리스 범위가 아닙니다.
