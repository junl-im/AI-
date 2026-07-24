# HANDOFF v1.6.1 Advanced Diagnostics Gate

## 현재 상태

- 앱 버전: `1.6.1`
- runtime version: `v1.6.1`
- build key: `1.6.1-advanced-diagnostics-gate`
- 서비스워커 캐시: `ai-shorts-studio-shell-v1.6.1-advanced-diagnostics-gate`
- 분석 캐시 계약: `v3`
- 기준 릴리스: v1.6.0 `a8c95f7`
- 최종 릴리스 커밋: 이 문서와 배포물을 고정한 `git log -1` 참조

v1.6.0 Local AI 기반을 유지하면서 일반 화면에 직접 노출되던 저장소·오프라인 내부 진단을 사용자용 요약과 별도 고급 진단 창으로 분리했습니다.

## 이번 패치의 핵심

### 1. 일반 사용자용 저장소 요약

`src/ui/storage-health-panel.js`, `assets/css/storage-health-panel.css`

- 정상·주의·문제 상태와 사용량만 기본 표시
- `namespace`, `signature`, 셸 감사, 캐시 삭제 같은 내부 용어와 도구를 기본 DOM 영역에서 제거
- 실제 조치가 필요한 상태에서만 자동 정리 버튼 표시
- 데스크톱은 한 줄 요약, 모바일은 짧은 카드형 요약으로 제한

### 2. 고급 진단 격리

- 사용자가 `고급 진단`을 눌렀을 때만 별도 modal을 표시
- 모바일에서는 viewport 전체 화면으로 표시
- Escape·닫기 버튼·포커스 복귀·포커스 trap·배경 스크롤 잠금 지원
- 분석 캐시 상세 목록과 namespace·signature 스냅샷은 고급 진단을 열기 전에는 조회하지 않음

### 3. 파괴적 작업 보호

- 선택 캐시, 조건 캐시, signature, namespace, 전체 분석 캐시, 오래된 저장소, 감사 이력 정리에 2단계 확인 적용
- 확인 창에서 현재 프로젝트 원본과 편집 데이터는 삭제되지 않음을 명시
- 취소하면 삭제 API를 호출하지 않음
- 확인한 경우에만 작업을 정확히 한 번 실행

### 4. 초기 성능 계약 복구

- 작업 트리에 다시 들어와 있던 Local AI 직접 실행 스크립트 3개를 제거
- coordinator → provider registry → UI의 기존 staged loading 소유권 복구
- 직접 실행 스크립트 49개 예산 유지

### 5. Update Sentinel과 모듈형 엔진

기존 `src/boot/update-sentinel.js`와 모듈형 엔진 소유권을 유지합니다. 고급 진단 분리는 서비스워커·분석 캐시·세션·렌더 엔진의 데이터 계약을 변경하지 않습니다.

## 검수 순서

1. `node tools/generate-integrity-manifest.js`
2. `node qa/storage_health_visibility_smoke.js`
3. `node qa/storage_health_panel_smoke.js`
4. `python3 qa/run_storage_health_browser_audit.py`
5. `node qa/storage_health_browser_audit_smoke.js`
6. `node qa/staged_ui_loading_smoke.js`
7. `python3 qa/run_browser_audit.py && node qa/runtime_browser_audit_smoke.js`
8. `node qa/run_css_ownership_audit.js && node qa/css_ownership_smoke.js`
9. `node qa/run_service_worker_lifecycle.js && node qa/service_worker_lifecycle_smoke.js`
10. 전체 `qaChecks` 구간 실행
11. `git diff --check`
12. 전체·패치 ZIP `unzip -t`와 패치 적용 SHA-256 비교

## QA 근거

- 등록 자동 검사: **219개**
- 일반 Chromium 4개 viewport: 오류·Promise 거절·console error·가로 overflow 0
- 저장소 전용 감사: 데스크톱·모바일 기본 숨김, 기술 용어 비노출, 위험 작업 취소/확인, 모바일 전체 화면 통과
- CSS ownership: 48개 파일, 충돌·동일값 중복·shadowed declaration 0, `!important` 593 유지
- 서비스워커 install·activate·offline navigation 통과
- 구조 우선순위 probe: safe 165, unsafe 29, unproven 12, 오류 0
- 프로세스 메모리: JS heap slope 약 0.0051MiB/cycle, 런타임 오류 0. RSS 증가는 warmup을 포함하므로 누수 부재의 단독 근거로 사용하지 않음
- GPU/media 두 모드에서 디코딩 성공, 런타임 오류 0
- 장시간 15→30→15분 1080p 경로는 미디어 코드가 변경되지 않아 검증된 실측 자료를 명시적으로 상속

## 알려진 제한

- 실제 모바일 Safari·Samsung Internet의 보조기술 조합은 별도 실기기 확인이 필요합니다.
- headless Chromium의 GPU·프로세스 메모리 결과는 실제 물리 장치와 동일하지 않습니다.
- 고급 진단의 캐시 정리 뒤에는 동일 미디어 분석이 다시 필요할 수 있습니다.

## 운영 시 주의

- 일반 사용자는 기본 요약에서 상태만 확인하면 됩니다.
- 고급 진단은 장애 분석·선택 정리가 필요한 경우에만 엽니다.
- 캐시 정리는 프로젝트 원본과 편집 상태를 지우지 않지만, 이후 동일 미디어 분석은 다시 수행될 수 있습니다.
- Local AI 서버는 loopback bind와 명시적 CORS로 운영하십시오.

## 다음 우선순위

고급 진단의 각 복구 작업에 영향 범위와 예상 재처리 비용을 더 명확히 보여주는 작업 전 미리보기, 또는 MediaPipe 기반 주 화자 스마트 리프레임이 다음 독립 패치 후보입니다.
