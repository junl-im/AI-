# QA REPORT v1.6.3

## 결과

등록 자동 검사 **224/224 통과**.

## 신규 검증

- `workflow_focus_layout_smoke.js`
- `run_workflow_focus_layout_audit.py`
- `workflow_focus_layout_browser_audit_smoke.js`

데스크톱 기본 집중, 주 패널·지원 카드 높이, 지원 카드 단계 승격, 전체 보기 복구, 미리보기·파형 모드 양보, 모바일 기존 흐름 유지, 실측 하단 메뉴 여백과 가로 overflow 0을 검증했습니다.

## 전체 회귀

- Chromium 데스크톱·소형 노트북·태블릿·모바일: window error, unhandled rejection, console error 0
- CSS ownership: 49개 파일, 활성 48개, selector-property conflict 0, same-value duplicate 0, shadow 0, `!important` 593
- 앱 셸 무결성: SHA-256 자산 125개
- 서비스워커 lifecycle과 offline navigation 통과
- GPU/media 두 비교 모드에서 H.264/AAC 디코딩 및 runtime error 0
- 프로세스 메모리 4회 반복: JS heap slope 약 0.0056MiB/cycle, peak RSS 약 835.1MiB
- 장시간 15→30→15분 1080p 실측은 미디어 경로 불변을 확인하고 v1.6.2 자료를 상속

## 감사 산출물

- `runtime-browser-audit-v1.6.3.json`
- `runtime-workflow-focus-layout-v1.6.3.json`
- `runtime-css-ownership-v1.6.3.json`
- `runtime-interaction-state-v1.6.3.json`
- `runtime-process-memory-v1.6.3.json`
- `runtime-gpu-media-capability-v1.6.3.json`
- `runtime-service-worker-lifecycle-v1.6.3.json`
