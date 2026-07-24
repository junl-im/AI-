# HANDOFF v1.6.4 Closed-loop Recovery Navigation

## 현재 상태

- 앱 버전: `1.6.4`
- runtime version: `v1.6.4`
- build key: `1.6.4-recovery-loop-impact-preview`
- 서비스워커 캐시: `ai-shorts-studio-shell-v1.6.4-recovery-loop-impact-preview`
- 분석 캐시 계약: `v3`
- 기준 릴리스: v1.6.3 `e51cbce`
- 등록 자동 검사: `224개`

## 이번 패치의 핵심

### 1. 문제 해결 네비게이션 폐쇄 루프

`src/ui/storage-health-panel.js`

- 저장 공간·오프라인 문제 발생 시 하단 상태 영역으로 한 번 자동 이동
- 사용자가 `문제 자동 해결`을 실행하고 실제 건강 상태가 정상으로 바뀐 경우에만 페이지 최상단으로 복귀
- 취소, 실패, 미해결 상태에서는 하단에 그대로 머물러 추가 조치 가능
- 하단 이동과 상단 복귀를 별도 이벤트로 기록해 중복 이동 방지
- 상단 복귀 시 기본 작업 시작 버튼으로 포커스를 옮기되 기존 키보드 탭 순서를 변경하지 않음

### 2. 저장소 정리 영향 미리보기

`src/storage/storage-manager.js`, `src/ui/storage-health-panel.js`

- 정리 실행 전에 오래된 세션·백업 선택 수와 예상 로컬 용량 표시
- 이전 오프라인 셸 캐시 수 표시
- 미리보기는 읽기 전용이며 실제 삭제를 수행하지 않음
- 현재 프로젝트, 최신 복구 데이터, 현재 오프라인 셸 보존 안내 유지
- 취소 시 저장소 변경과 상단 복귀 모두 발생하지 않음

### 3. 기존 작업실 계약 유지

- 저장 상태 영역은 계속 전체 작업실 최하단에 위치
- Local AI는 지연 적재와 작업 흐름형 접이식 배치를 유지
- 단계 집중 레이아웃과 하단 메뉴 실측 여백 유지
- 초기 직접 실행 스크립트 49개 유지
- CSS `!important` 활성 총량 593개 유지

## 운영 안전망

- `Update Sentinel`이 서비스워커 업데이트와 이전 셸 캐시 정리를 감시합니다.
- 자동 하단 이동 이벤트: `ai-shorts-storage-attention`
- 정상 복구 후 상단 복귀 이벤트: `ai-shorts-storage-recovery-complete`
- 자동 복귀는 자동 이동으로 시작된 문제 해결 흐름에서만 동작합니다.

## 검수 순서

1. `node tools/generate-integrity-manifest.js`
2. `node qa/storage_manager_quota_smoke.js`
3. `node qa/storage_health_visibility_smoke.js`
4. `python3 qa/run_storage_health_browser_audit.py`
5. `python3 qa/run_browser_audit.py`
6. `node qa/run_css_ownership_audit.js`
7. `node qa/run_service_worker_lifecycle.js`
8. `python3 qa/run_process_memory_audit.py --cycles 4`
9. `python3 qa/run_gpu_media_capability_audit.py`
10. 전체 224개 `qaChecks`
11. `git diff --check`
12. 전체·패치 ZIP `unzip -t`와 패치 적용 SHA-256 비교

## QA 근거

- 등록 자동 검사: **224/224 통과**
- 저장소 전용 Chromium 감사: 데스크톱·모바일 오류 0
- 취소: 삭제 0회, 상단 복귀 0회, 하단 위치 유지
- 성공: 삭제 1회, 건강 상태 정상화, 상단 복귀 1회
- 일반 Chromium 4개 viewport: 오류·Promise 거절·console error·가로 overflow 0
- CSS ownership: 49개 파일, 충돌·동일값 중복·shadow 0, `!important` 593
- 앱 셸 SHA-256 무결성 자산: 125개
- 서비스워커 install·activate·offline navigation 통과
- GPU/media 두 모드 H.264/AAC 디코딩 및 런타임 오류 0
- 프로세스 메모리: JS heap slope 약 0.0055MiB/cycle, peak RSS 약 819.4MiB
- 구조 우선순위와 15→30→15분 1080p 장시간 영상은 관련 코드 경로가 변경되지 않아 v1.6.3 검증 자료를 명시적으로 상속

## 알려진 제한

- 자동 상단 복귀는 문제 상태가 실제로 해제된 경우에만 동작합니다.
- 저장소 미리보기의 로컬 용량은 정리 대상 localStorage 항목 기준이며 Cache Storage 바이트는 브라우저 API 제한으로 항목 수만 표시합니다.
- 실제 모바일 Safari·Samsung Internet과 물리 GPU/NPU는 별도 실기기 검증이 필요합니다.
- headless Chromium의 프로세스 RSS는 실제 사용자 장치의 절대 메모리 수치와 동일하지 않습니다.
- Local AI 품질과 속도는 설치 모델과 하드웨어에 따라 달라집니다.

## 다음 우선순위

MediaPipe 기반 주 화자 스마트 리프레임, 고급 분석 캐시 작업별 영향·재분석 비용 미리보기, 브라우저 WASM/WebGPU 모델 팩 관리가 다음 독립 패치 후보입니다.
