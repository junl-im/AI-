# SoriON AI 0.9.3-beta.3 CI Hardening 2 Patch

이 패치는 `0.9.3-beta.3` 기준 저장소의 CI 진단과 lock bootstrap을 안정화합니다.

## 핵심 변경

- preflight의 모든 검사를 끝까지 실행하고 실패 보고서 artifact를 남깁니다.
- preflight 실패가 API·Worker 품질 결과를 가리지 않도록 failure domain을 분리합니다.
- npm lock 생성은 cache-only 시도 후 npm 공식 registry 두 endpoint를 순차 사용합니다.
- npm lock 갱신 실패 시 기존 lock을 원상 복구합니다.
- 성공한 API·Worker lock은 npm 실패와 무관하게 main에 자동 반영합니다.
- lock audit 디렉터리를 작업 시작 시 생성해 빈 artifact 경고를 제거합니다.

## 적용

ZIP을 덮어쓴 뒤 `APPLY_PATCH.cmd` 또는 `APPLY_PATCH.sh`를 한 번 실행하고 GitHub Desktop에서 Commit·Push합니다.
