# SoriON AI 0.11.6 Recovery Evidence Classification & Session Safety

기준 버전은 **0.11.5 Editor Command UX & Adaptive Engine Load Awareness + Web quality visual-runner hotfix**입니다.

## 적용 내용

- recovery evidence를 `observed-device` / `synthetic-injection` / `not-applicable`로 분리
- synthetic Recovery Path Injection의 실기기 certification/READY 대체 차단
- evidence bundle 신규 export schema v3 + 기존 schema v2 verifier 호환
- workspace session schema v3 + 개인정보 최소 batch retry snapshot
- 최근 6건·retry count 최대 3회의 집계만 복원하고 clip ID·원문·음원·상세 오류 문자열은 저장하지 않음
- recovery evidence/session safety dependency-free preflight 계약과 API 회귀 테스트

## 적용

최신 0.11.5 visual-runner hotfix 프로젝트 루트에 패치 ZIP 내용을 그대로 덮어쓴 뒤 `APPLY_PATCH.cmd` 또는 `APPLY_PATCH.sh`를 실행합니다.

삭제 파일은 없습니다. 승인 Chromium baseline PNG가 아직 없으므로 baseline-required CI는 강제로 켜지 않습니다. 전체 Web lint·Vitest·semantic typecheck·production build는 GitHub Actions Web quality가 최종 판정합니다.
