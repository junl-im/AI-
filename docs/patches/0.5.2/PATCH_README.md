# 0.5.1 → 0.5.2 패치

## 목적

- Push와 Pull Request가 같은 변경에서 중복 실행되는 CI 트리거를 정리한다.
- 별도 Pages 워크플로를 기본 CI에 통합해 Push당 프로젝트 워크플로 실행을 하나로 만든다.
- Python 3.10에서 사용할 수 없는 `datetime.UTC`를 제거한다.
- Vitest 전역 API 비활성 환경에서도 테스트 DOM을 매 테스트 후 정리한다.

## 적용

1. 현재 `package.json` 버전이 `0.5.1`인지 확인한다.
2. 작업 중인 변경을 커밋하거나 백업한다.
3. 패치 ZIP을 저장소 루트에 압축 해제해 덮어쓴다.
4. 다음 명령으로 이전 Pages 워크플로를 삭제한다.

```bash
node docs/patches/0.5.2/remove-obsolete-files.mjs
```

5. GitHub `Settings → Pages → Build and deployment → Source`를 `GitHub Actions`로 설정한다.
6. 검사 후 커밋하고 Push한다.

```bash
npm run quality:rules
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:api
```

## 정상 상태

- `.github/workflows`에는 `ci.yml` 하나만 남는다.
- `main` Push에서는 `SoriON CI & Pages` 실행 하나 안에서 Web, API, Deploy가 순서대로 진행된다.
- 기능 브랜치에 열린 PR이 있더라도 동일 커밋에 Push 이벤트와 PR 이벤트가 동시에 중복 실행되지 않는다.
