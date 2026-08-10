# SoriON AI 0.11.5 Editor Command UX & Adaptive Engine Load Awareness

기준 버전은 **0.11.4 Visual Baseline Approval & Recovery Provenance**입니다.

## 적용 내용

- Timeline 다중 선택 keyboard command bar (`Ctrl/Cmd+A`, `R`, `Shift+R`, `Alt+←/→`, `Delete`, `Esc`, `?`)
- 준비된 음원 재생성·삭제의 안전 실행 미리보기와 일괄 이동 직전 1회 Undo
- auto engine routing의 현재 실행 요청 수 기반 병렬 부하 분산
- performance observation session 상태·표본·남은 관찰창·EWMA 진단
- 새 editor command / engine observation dependency-free preflight 계약과 회귀 테스트

## 적용

기존 0.11.4 프로젝트 루트에 패치 ZIP 내용을 그대로 덮어쓴 뒤 `APPLY_PATCH.cmd` 또는 `APPLY_PATCH.sh`를 실행합니다.

삭제 파일은 없습니다. Web 전체 ESLint·Vitest·semantic typecheck·Vite build는 검증된 npm registry/lock 환경의 GitHub Actions에서 최종 확인합니다.
