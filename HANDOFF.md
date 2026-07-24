# HANDOFF v1.6.2 Layout Harmony & Footer Health

## 현재 상태

- 앱 버전: `1.6.2`
- runtime version: `v1.6.2`
- build key: `1.6.2-layout-harmony-footer-health`
- 서비스워커 캐시: `ai-shorts-studio-shell-v1.6.2-layout-harmony-footer-health`
- 분석 캐시 계약: `v3`
- 기준 릴리스: v1.6.1 `e7c9016`
- 최종 릴리스 커밋: 이 문서와 배포물을 고정한 `git log -1` 참조

v1.6.1의 고급 진단 격리를 유지하면서 저장소 상태를 페이지 최하단 지원 영역으로 이동하고, Local AI를 제작 흐름에 맞는 접이식 행으로 통합했습니다.

## 이번 패치의 핵심

### 1. 페이지 최하단 저장소 상태

`src/ui/storage-health-panel.js`, `assets/css/storage-health-panel.css`

- 저장소·오프라인 요약을 전체 작업실 뒤 `.app-shell` 최하단에 배치
- 정상 상태에서는 낮은 대비와 compact 높이로 제작 흐름 방해 최소화
- 정리 또는 복구 action이 새로 발생할 때만 한 번 자동 스크롤·포커스·강조
- 동일 문제의 반복 렌더에서는 자동 이동을 반복하지 않음
- 고급 진단·확인 창이 열린 동안에는 자동 이동하지 않음

### 2. Local AI 작업 흐름 통합

`index.html`, `assets/css/local-ai-studio.css`, `assets/css/workspace-layout-controls.css`

- 독립 대형 section을 기본 닫힘 `<details>` 작업대로 전환
- 프로젝트·카피 유틸리티와 핵심 제작 단계 사이의 전체 폭 `ai` grid row에 배치
- summary에서 로컬 AI 카피·전사 역할과 localhost 정책만 간단히 표시
- 사용자가 펼칠 때 기존 연결·모델·생성·전사 UI를 그대로 제공
- 미리보기·파형 집중 모드에서는 선택형 AI 영역을 숨김
- 모바일에서는 compact summary와 단일 열 workbench로 정렬

### 3. 성능·안전 계약 유지

- Local AI는 staged loader를 통한 첫 사용 시 적재를 유지
- 저장소 상세 목록은 고급 진단을 열기 전에는 조회하지 않음
- 자동 이동은 정리·복구가 필요한 actionable 상태에만 실행
- 새 외부 네트워크 요청, 원격 코드, 데이터 계약 변경 없음
- Update Sentinel과 기존 **모듈형 엔진** 소유권 유지

## 검수 순서

1. `node tools/generate-integrity-manifest.js`
2. `node qa/storage_health_visibility_smoke.js`
3. `python3 qa/run_storage_health_browser_audit.py`
4. `python3 qa/run_layout_harmony_browser_audit.py`
5. `python3 qa/run_browser_audit.py`
6. `node qa/run_css_ownership_audit.js`
7. `python3 qa/run_interaction_state_audit.py`
8. `python3 qa/run_structure_priority_probe.py`
9. `node qa/run_service_worker_lifecycle.js`
10. 전체 221개 `qaChecks`
11. `git diff --check`
12. 전체·패치 ZIP `unzip -t`와 패치 적용 SHA-256 비교

## QA 근거

- 등록 자동 검사: **221개**
- 일반 Chromium 4개 viewport: 오류·Promise 거절·console error·가로 overflow 0
- 저장소 전용 감사: 페이지 최하단 배치, actionable 상태 1회 자동 이동·강조, 정상 상태 비개입 통과
- Layout Harmony 감사: 데스크톱·모바일 Local AI 기본 접힘, 명시적 펼침, 전체 폭 정렬, 집중 모드 숨김, overflow 0
- CSS ownership: 48개 파일, 충돌·동일값 중복·shadowed declaration 0, `!important` 593
- 구조 우선순위 probe: safe 166, unsafe 27, unproven 13, 오류 0
- 서비스워커 install·activate·offline navigation과 앱 셸 123개 SHA-256 검증
- GPU/media 두 모드 디코딩 성공, 런타임 오류 0
- 프로세스 메모리: JS heap slope 약 0.0061MiB/cycle, peak RSS 약 857.2MiB; RSS는 Chromium warmup 포함 보조 지표
- 장시간 15→30→15분 1080p 경로는 미디어 코드가 변경되지 않아 검증된 실측 자료를 명시적으로 상속

## 알려진 제한

- 실제 모바일 Safari·Samsung Internet의 보조기술 조합은 별도 실기기 확인이 필요합니다.
- headless Chromium의 GPU·프로세스 메모리 결과는 실제 물리 장치와 동일하지 않습니다.
- 저장소 자동 이동은 브라우저의 스크롤·포커스 정책에 따라 애니메이션 표현이 달라질 수 있습니다.
- Local AI 처리 품질과 속도는 설치 모델·하드웨어에 따라 달라집니다.

## 운영 시 주의

- 정상 사용자는 페이지 하단 상태 영역을 별도로 조작할 필요가 없습니다.
- 저장 공간 정리나 오프라인 복구가 필요할 때 앱이 해당 영역으로 한 번 안내합니다.
- 고급 진단은 장애 분석·선택 정리가 필요한 경우에만 엽니다.
- Local AI 서버는 loopback bind와 명시적 CORS로 운영하십시오.

## 다음 우선순위

MediaPipe 기반 주 화자 스마트 리프레임, 위험 작업 영향·확보 용량 미리보기, 브라우저 WASM/WebGPU 모델 팩 관리가 다음 독립 패치 후보입니다.
