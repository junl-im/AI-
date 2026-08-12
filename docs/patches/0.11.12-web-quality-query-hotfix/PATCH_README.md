# 0.11.12 Web quality duplicate-query hotfix

기준: GitHub commit `3fffe1e8531d79b984809d23859629f7212ceecc` / 제품 버전 0.11.12.

## 적용

1. 현재 작업을 commit 또는 백업합니다.
2. 이 ZIP을 저장소 루트에 그대로 압축 해제해 덮어씁니다.
3. `node scripts/run-preflight.mjs`를 실행합니다.
4. GitHub Desktop Changes에서 테스트 2파일과 hotfix 문서만 변경됐는지 확인합니다.
5. Commit / Push 후 새 GitHub Actions run의 Web quality를 확인합니다.

## 수정

- Timeline test: 중복 title 대신 clip article accessible name 사용.
- Voice picker test: 전역 `/도윤/` query 대신 추천 status 영역 scoped assertion 사용.
- 제품 런타임 코드 변경 없음.

## 삭제

없음.
