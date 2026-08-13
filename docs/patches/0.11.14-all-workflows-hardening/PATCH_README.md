# SoriON AI 0.11.13 -> 0.11.14 Patch

## 적용 대상

- 기준 버전: `0.11.13 · Focused Creation Surface`
- 결과 버전: `0.11.14 · All Workflows Reliability Hardening`

## 적용 방법

1. 현재 프로젝트가 0.11.13인지 확인합니다.
2. 작업 중 변경 사항을 commit 또는 별도 백업합니다.
3. 패치 ZIP을 저장소 루트에 풀어 덮어씁니다.
4. `.git` 폴더는 건드리지 않습니다.
5. `npm run quality:preflight`를 실행합니다.
6. Push 후 GitHub Actions에서 Web/API/Worker/Pages 결과를 확인합니다.

## 핵심 변경

- GitHub Actions major 갱신
- ref-safe manual concurrency와 maintenance run 보호
- npm lock-hash cache 안정화
- API/Worker committed uv lock gate
- Dependabot API/Worker uv + GitHub Actions 추적
- 조기 실패 evidence 보존 및 recovery drill 불필요 대기 제거
- 0.11.13 CHANGELOG/HANDOVER 누락 보강

## 삭제 파일

없음.
