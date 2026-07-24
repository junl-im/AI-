# HANDOFF v1.6.3 Stage Focus & Progressive Disclosure

## 현재 상태

- 앱 버전: `1.6.3`
- runtime version: `v1.6.3`
- build key: `1.6.3-stage-focus-progressive-disclosure`
- 서비스워커 캐시: `ai-shorts-studio-shell-v1.6.3-stage-focus-progressive-disclosure`
- 분석 캐시 계약: `v3`
- 기준 릴리스: v1.6.2 `66e5b42`
- 등록 자동 검사: `224개`

v1.6.2의 하단 저장소 상태와 작업 흐름형 Local AI 배치를 유지하면서, 데스크톱 균형 작업실에 단계별 점진 공개를 추가했습니다.

## 이번 패치의 핵심

### 1. 단계 집중 레이아웃

`src/ui/workflow-focus-layout.js`, `assets/css/workflow-focus-layout.css`

- 현재 탭과 같은 패널을 주 작업으로 확장
- 명시적 다음 단계만 86px 지원 카드로 유지
- 이후 단계와 선택형 보조 도구는 현재 흐름에서 제외
- 지원 카드 버튼으로 다음 단계를 즉시 주 작업으로 승격
- 전체 보기 토글로 기존 8개 패널과 유틸리티를 복원
- 미리보기·파형 전용 모드에서는 단계 집중을 자동 일시 중지
- 모바일은 기존 단일 탭 흐름을 그대로 유지

### 2. 실제 상태 기반 단계 표시

`src/ui/ux-controls.js`

- 파일 없음: 불러오기
- 파일 있음·추천 없음: 자동 분석
- 추천 있음: 편집
- 내보내기 결과 있음: 내보내기
- 동일 상태 쓰기는 microtask로 합쳐 불필요한 observer 왕복을 줄임

### 3. 하단 메뉴 안전 여백

- `ResizeObserver`로 실제 하단 메뉴 높이를 측정
- `--hyperflow-dock-height`, `--workflow-dock-clearance` 갱신
- 콘텐츠와 스크롤 대상의 하단 겹침 방지

### 4. CSS 소유권 유지

- 새 스타일시트의 추가 `!important` 0개
- 전체 활성 `!important` 593개 유지
- selector-property 충돌·동일값 중복·shadow 선언 0
- 필요한 동적 강제 우선순위는 컨트롤러가 상태 변경 시에만 소유하고 원래 inline 값을 복원

## 검수 순서

1. `node tools/generate-integrity-manifest.js`
2. `node qa/workflow_focus_layout_smoke.js`
3. `python3 qa/run_workflow_focus_layout_audit.py`
4. `python3 qa/run_browser_audit.py`
5. `node qa/run_css_ownership_audit.js`
6. `python3 qa/run_interaction_state_audit.py`
7. `node qa/run_service_worker_lifecycle.js`
8. `python3 qa/run_process_memory_audit.py --cycles 4`
9. `python3 qa/run_gpu_media_capability_audit.py`
10. 전체 224개 `qaChecks`
11. `git diff --check`
12. 전체·패치 ZIP `unzip -t`와 패치 적용 SHA-256 비교

## QA 근거

- 등록 자동 검사: **224/224 통과**
- 일반 Chromium 4개 viewport: 오류·Promise 거절·console error·가로 overflow 0
- 단계 집중 전용 감사: 기본 집중, 지원 카드 승격, 전체 보기 복구, 전용 모드 양보, 모바일 비개입 통과
- 초기 직접 실행 스크립트: 49개 유지
- CSS ownership: 49개 파일, 활성 48개, 충돌·동일값 중복·shadow 0, `!important` 593
- 앱 셸 SHA-256 무결성 자산: 125개
- 서비스워커 install·activate·offline navigation 통과
- GPU/media 비교: 두 모드 H.264/AAC 디코딩 및 런타임 오류 0
- 프로세스 메모리: JS heap slope 약 0.0056MiB/cycle, peak RSS 약 835.1MiB. RSS는 Chromium warmup을 포함한 보조 지표
- 15→30→15분 1080p 장시간 영상은 미디어 경로가 변경되지 않아 v1.6.2의 검증된 실측 자료를 상속

## 알려진 제한

- 단계 집중은 1180px 이상 데스크톱의 균형 보기에서만 활성화됩니다.
- 사용자가 전체 보기를 선택하면 모든 작업 패널이 다시 표시됩니다.
- 실제 모바일 Safari·Samsung Internet과 물리 GPU/NPU는 별도 실기기 검증이 필요합니다.
- headless Chromium의 프로세스 RSS는 실제 사용자 장치의 절대 메모리 수치와 동일하지 않습니다.
- Local AI 품질과 속도는 설치 모델과 하드웨어에 따라 달라집니다.

## 다음 우선순위

MediaPipe 기반 주 화자 스마트 리프레임, 정리 작업 영향·확보 용량 미리보기, 브라우저 WASM/WebGPU 모델 팩 관리가 다음 독립 패치 후보입니다.
