# LOCKFILE BOOTSTRAP

`0.9.3-alpha.3`은 lock 파일을 임의로 작성하지 않는다. 실제 registry와 Python 3.10을 사용할 수
있는 GitHub Actions에서 의존성을 해석하고, 설치 경고와 전체 트리를 검사한 결과만 채택한다.

## 고정 런타임

- 프로젝트 Node: `22.18.0`
- 프로젝트 npm: `10.9.3`
- API·Worker Python: `3.10`
- uv: `0.11.32`

`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`는 GitHub Action 자체의 실행 런타임 설정이다. SoriON Web을
설치·빌드하는 Node 버전은 `actions/setup-node`와 `.nvmrc`의 `22.18.0`이다.

## 최초 생성 절차

1. 이 전환 패치를 기능 브랜치에 커밋하고 GitHub에 push한다.
2. Actions에서 `SoriON CI & Pages`를 수동 실행한다.
3. `generate_lockfiles`를 `true`로 선택한다.
4. `Lockfiles · generate or verify`가 다음 순서를 완료하는지 확인한다.
   - `npm install --package-lock-only`
   - `npm ci`
   - npm warning과 전체 `npm ls --all --json --long` 검사
   - API와 Worker의 `uv lock`, `uv lock --check`, `uv sync --locked`
5. 실행 artifact `sorion-verified-lockfiles`를 내려받는다.
6. 다음 세 파일을 같은 경로에 복사해 커밋한다.
   - `package-lock.json`
   - `services/api/uv.lock`
   - `services/worker/uv.lock`
7. `.sorion/lock-audit` 로그에서 `ERESOLVE`, `UNMET`, `invalid`, `missing`, `EBADENGINE`이 없는지 마지막으로 본다.
8. 다시 push한다. 이후 일반 CI는 `npm ci`와 `uv sync --locked`만 사용한다.

## 차단 기준

- lock 파일이 없거나 `package.json`·`pyproject.toml`과 맞지 않음
- npm install·ci 로그의 `ERESOLVE`, `UNMET`, `invalid`, `missing`, `EBADENGINE`
- 전체 트리에 Vite가 `8.2.0` 외 버전으로 중복 설치됨
- Vitest가 `4.1.10` 외 버전으로 설치됨
- `vite-plugin-pwa`가 Vite 8 peer 범위를 선언하지 않음
- API·Worker lock이 Python 3.10 환경에서 `uv lock --check` 또는 locked sync에 실패함

정상 lock이 커밋되기 전의 일반 push·PR CI 실패는 의도된 차단이다. 수동 lock 생성 실행은 생성된
lock을 Web·API·Worker 작업에 전달해 같은 실행에서 lint, typecheck, test, build까지 검증한다.
