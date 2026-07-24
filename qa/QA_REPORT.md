# QA REPORT v1.6.1

## 범위

v1.6.1 Advanced Diagnostics Gate와 기존 미디어 분석·프로젝트·자막·렌더·캐시·세션·서비스워커·Local AI 기능을 함께 검증합니다.

## 자동 검사

- 등록 검사 수: **219개**
- 신규 검사:
  - `qa/storage_health_visibility_smoke.js`
  - `qa/run_storage_health_browser_audit.py`
  - `qa/storage_health_browser_audit_smoke.js`

신규 검사는 일반 화면 기술 용어 비노출, 고급 진단 기본 숨김, explicit open, 모바일 전체 화면 containment, 위험 작업 확인·취소·정확히 1회 실행, 문제 상태에서만 자동 정리 표시를 확인합니다.

## 일반 브라우저 감사

`qa/runtime-browser-audit-v1.6.1.json`

- desktop 1440×1000
- small laptop 1280×800
- tablet 900×1000
- mobile 390×844
- 런타임 오류, unhandled rejection, console error, 가로 overflow: **0**

## 저장소 진단 전용 감사

`qa/runtime-storage-health-browser-v1.6.1.json`

- desktop 1366×768, mobile 390×844
- 첫 화면 고급 진단 숨김과 기술 용어 비노출
- 정상 상태 자동 정리 숨김, 문제 상태에서만 표시
- 취소 시 분석 캐시 삭제 0회, 확인 시 정확히 1회
- 모바일 modal viewport 전체 사용, 가로 overflow 0
- Escape 종료와 배경 스크롤 복구

## CSS·구조 감사

- `qa/runtime-css-ownership-v1.6.1.json`
- CSS 48개 파일
- 충돌 0, 동일값 중복 0, shadowed declaration 0
- `!important` 593 유지
- 구조 priority probe: safe 165, unsafe 29, unproven 12, 오류 0
- interaction state 34개 상태, 오류 0

## 서비스워커

`qa/runtime-service-worker-lifecycle-v1.6.1.json`

- install: 현재 앱 셸 캐시 생성
- activate: 이전 캐시 정리·clients claim
- offline navigation: 캐시된 `index.html` 응답
- 앱 셸 123개 SHA-256 manifest 검증

## GPU·미디어 보조 감사

`qa/runtime-gpu-media-capability-v1.6.1.json`

- acceleration-requested / software-safe 비교
- 두 모드 미디어 디코딩 성공
- GPU process와 media utility process 관측
- 런타임 오류 0
- headless 환경에서는 물리 GPU 가속을 보장하지 않음

## 프로세스 메모리 보조 감사

`qa/runtime-process-memory-v1.6.1.json`

- renderer JS heap slope 약 0.0051MiB/cycle
- peak RSS 약 853.7MiB
- 런타임 오류 0
- RSS 증가는 Chromium warmup과 프로세스 구성을 포함하므로 누수 부재의 단독 근거로 사용하지 않음

## 장시간 영상

`qa/runtime-long-video-stability-v1.6.1.json`은 저장소 UI 격리가 미디어 디코드·분석·렌더·Object URL 경로를 변경하지 않아 검증된 15→30→15분 1080p 실측 근거를 명시적으로 상속합니다.

## 제한

- 실제 모바일 Safari·Samsung Internet과 보조기술 조합은 별도 실기기 검증 대상입니다.
- Local AI 모델 품질과 처리 속도는 설치 모델·하드웨어별 수동 검증 대상입니다.
- 물리 GPU·NPU와 실제 운영 CORS 설정은 자동 감사 범위가 아닙니다.
