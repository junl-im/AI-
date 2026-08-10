# SoriON AI 0.11.7 CI Chain Integrity Hotfix

대상은 GitHub 커밋 `b5cd5cb`처럼 **0.11.5 기준선 위에 0.11.7 One-Flow 패치만 적용되어 0.11.6 누적 recovery/session 파일이 빠진 상태**입니다.

## 수정 내용

- 누락된 recovery evidence/session safety preflight checker 복원
- evidence bundle schema v3 및 legacy v2 verifier 호환 구현 복원
- verification recovery provenance API/schema 복원
- workspace session schema v3와 개인정보 최소 batch retry snapshot 복원
- Recovery Injection/Device Soak provenance UI·타입·API wiring 복원
- preflight script 누락 시 raw `MODULE_NOT_FOUND` 대신 누락 경로와 패치 기준 문제를 명시

제품 버전은 `0.11.7`을 유지하며 One-Flow UX 기능은 변경하지 않습니다.

## 적용

현재 GitHub `b5cd5cb` 기준 저장소 루트에 이 ZIP을 그대로 덮어쓴 뒤 `APPLY_PATCH.cmd` 또는 `APPLY_PATCH.sh`를 실행합니다.

이 hotfix는 빠진 0.11.6 누적 파일을 self-contained 형태로 포함하므로 0.11.6 패치를 별도로 다시 적용할 필요가 없습니다.
