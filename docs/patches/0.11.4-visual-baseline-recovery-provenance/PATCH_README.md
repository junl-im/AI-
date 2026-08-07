# SoriON AI 0.11.4 Visual Baseline Approval & Recovery Provenance

기준 버전은 **0.11.3 Failure-Guided Editing & Adaptive Performance Routing**입니다.

## 적용 내용

- Chromium 1024/1280/1440px 후보 PNG를 명시적 승인 baseline으로 저장하는 `quality:visual-layout:approve`
- 승인 baseline 존재 시 Canvas pixel data 기반 허용 오차 visual diff
- Timeline 일괄 음성 작업의 최근 6건 세션 재시도 이력
- Runtime soak 이전/현재 파일명·실제 SHA-256·수집/로드/비교 시각 provenance와 비교 JSON export
- Engine performance observation window 만료 뒤 오래된 EWMA 표본 reset

## 적용

기존 0.11.3 프로젝트 루트에 패치 ZIP 내용을 그대로 덮어쓴 뒤 `APPLY_PATCH.cmd` 또는 `APPLY_PATCH.sh`를 실행합니다.

승인 PNG가 아직 없는 저장소에서는 DOM layout과 후보 screenshot 증거만 검사합니다. 신뢰할 수 있는 동일 Chromium runner에서 `npm run quality:visual-layout:approve`를 실행하고 생성된 기준선을 검토·커밋한 뒤 `SORION_VISUAL_BASELINE_REQUIRED=1`을 활성화하세요.
