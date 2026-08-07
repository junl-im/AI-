# SoriON AI 0.10.8 CI Test Contract Stability Hotfix

기준 버전은 **0.10.7 · Recovery Evidence & Voice Inventory Diagnostics**입니다.
패치 ZIP을 기존 0.10.7 저장소 루트에 바로 압축 해제해 덮어쓴 뒤 품질 검사를 실행합니다.

## 핵심 변경

- `browserPlaybackEvidence.test.ts`의 `afterEach()` 내부에 중복 삽입된 `it()` 블록을 제거해 Vitest의 중첩 테스트 정의 오류를 해소합니다.
- HomePage 장문 통합 테스트를 선택 클립 빠른 편집기 + 타임라인 카드 텍스트 구조와 동기화합니다.
- dependency-free 프로젝트 규칙에서 위 두 CI 회귀 형태를 사전 차단합니다.
- 제품 버전과 API 버전 fixture를 0.10.8로 동기화합니다.

## 적용 후 권장 검사

```bash
node scripts/check-version-sync.mjs
node scripts/run-preflight.mjs
python -m pytest -q services/api/tests
python -m pytest -q services/worker/tests
```

현재 전달 환경에서는 내부 npm registry가 `zustand@5.0.8`을 404로 반환해 Web 의존성 설치가 중단됩니다. 따라서 실제 ESLint·semantic typecheck·Vitest·Vite build는 GitHub Actions에서 최종 확인합니다.

## 삭제 파일

없습니다. 이 패치는 기존 프로젝트 파일을 삭제하지 않습니다.
