# LOCKFILE BOOTSTRAP

SoriON CI는 세 lock 파일이 없다는 이유만으로 일반 push·PR을 즉시 실패시키지 않는다.
`Lockfiles · generate or verify` 작업이 먼저 존재 여부를 판별하고, 누락 시 **자동 bootstrap**,
모두 존재할 때는 엄격 검증을 수행한다.

## 고정 런타임

- 프로젝트 Node: `22.18.0`
- 프로젝트 npm: `10.9.3`
- API·Worker Python: `3.10`
- uv: `0.11.32`

GitHub Action 자체는 Node 24 런타임을 선언한 `actions/upload-artifact@v6`와
`actions/download-artifact@v7`을 사용한다. 강제 환경 변수로 구형 Action을 가리지 않으며,
SoriON Web 설치·빌드는 `actions/setup-node`, `.nvmrc`, `.node-version`의 Node `22.18.0`을 사용한다.

## 자동 bootstrap 흐름

1. `npm run locks:mode`가 다음 파일의 존재를 확인한다.
   - `package-lock.json`
   - `services/api/uv.lock`
   - `services/worker/uv.lock`
2. 하나라도 없으면 `generate` 모드가 선택된다.
3. CI가 다음 순서를 실행한다.
   - npm cache 복원과 lock network 재시도 계약 검사
   - `npm install --package-lock-only` 최대 4회 재시도
   - `npm ci` 최대 4회 재시도
   - npm warning과 전체 `npm ls --all --json --long` 검사
   - API·Worker `uv lock`, `uv lock --check`, `uv sync --locked`
4. 실패한 실행도 `~/.npm`의 부분 cache와 시도별 `.sorion/lock-audit` 로그를 보존한다.
5. 생성·검증된 세 lock과 `.sorion/lock-audit` 로그를
   `sorion-verified-lockfiles` artifact로 업로드한다.
6. 같은 workflow의 Web·API·Worker가 artifact를 내려받아 각각 `npm ci`와
   `uv sync --locked`로 품질 검사를 계속한다.

따라서 첫 push는 lock 누락만으로 멈추지 않는다. 다만 이후 실행을 완전히 재현 가능하게 만들려면
성공한 실행의 artifact에서 세 lock을 내려받아 동일 경로에 커밋해야 한다.

## 기존 lock 검증 흐름

세 lock이 모두 존재하면 CI는 자동 재생성하지 않는다. 다음 검증에서 하나라도 실패하면 원인을
숨기지 않고 즉시 중단한다.

- `npm run locks:check`
- API·Worker `uv lock --check`
- Web `npm ci`
- API·Worker `uv sync --locked`

manifest와 lock이 불일치한 상태는 자동 갱신으로 덮지 않는다. 의존성을 의도적으로 변경한 경우에만
Actions 수동 실행에서 `generate_lockfiles=true`를 선택해 강제 재생성한다.

## artifact 커밋 절차

1. 성공한 Actions 실행의 `sorion-verified-lockfiles` artifact를 내려받는다.
2. 다음 파일을 저장소의 같은 경로에 복사한다.
   - `package-lock.json`
   - `services/api/uv.lock`
   - `services/worker/uv.lock`
3. `.sorion/lock-audit`에서 `ERESOLVE`, `UNMET`, `invalid`, `missing`, `EBADENGINE`을 확인한다.
4. 세 lock만 검토해 커밋하고 push한다.
5. 다음 실행의 lock 작업이 `verify` 모드인지 확인한다.

## 차단 기준

- 기존 lock과 `package.json`·`pyproject.toml` 불일치
- npm install·ci 로그의 `ERESOLVE`, `UNMET`, `invalid`, `missing`, `EBADENGINE`
- 전체 트리에 Vite `8.2.0` 외 버전이 설치됨
- Vitest `4.1.10` 외 버전이 설치됨
- `vite-plugin-pwa`가 Vite 8 peer 범위를 선언하지 않음
- Python 3.10에서 `uv lock --check` 또는 locked sync 실패

lock 누락은 자동 bootstrap 대상이고, 존재하지만 잘못된 lock은 실패 대상이다.

## registry 일시 장애 처리

`ETIMEDOUT`, `EAI_AGAIN`, `ECONNRESET`, `ECONNREFUSED`, `ENETUNREACH`, HTTP 429·502·503·504는 최대 4회 재시도한다. 각 시도는 독립 로그로 남고 5·15·30초 간격 뒤 다시 실행한다. 모든 시도가 실패하면 오류를 성공으로 가리지 않고 job은 실패하지만, `sorion-lock-bootstrap-diagnostics-*` artifact와 npm cache를 먼저 보존한다. 같은 Actions 실행에서 **Re-run failed jobs**를 누르면 앞선 cache를 복원한다. 의존성 충돌인 ERESOLVE는 네트워크 오류로 재시도하지 않는다.
