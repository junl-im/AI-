# LOCKFILE BOOTSTRAP

SoriON CI는 npm, API uv, Worker uv를 **독립 lock 작업**으로 처리한다. npm registry가 멈춰도
API·Worker 품질 결과가 함께 가려지지 않으며, 각 품질 작업은 자신에게 필요한 lock만 기다린다.

## 고정 런타임

- Node `22.18.0`, npm `10.9.3`
- Python `3.10`, uv `0.11.32`
- `package-lock.json`, `services/api/uv.lock`, `services/worker/uv.lock`

## 독립 생성과 검증

- 일반 push·PR은 커밋된 `package-lock.json`, `services/api/uv.lock`, `services/worker/uv.lock`을 verify-only로 검사한다. 어느 lock이든 없거나 stale이면 해당 component가 즉시 실패한다.
- CI는 소스를 수정하거나 lock을 자동 커밋하지 않는다.
- 수동 Actions의 `generate_lockfiles=true`는 의도적인 전체 갱신에만 사용한다.
- `GENERATE_WEB_LOCK.cmd`·`.sh`는 registry 장애 시 선택적으로 사용하는 로컬 복구 수단이다.
- lock이 있으면 manifest 일치, `npm ci`, 전체 dependency tree를 검증한다.
- API와 Worker는 일반 실행에서 `uv lock --check`, `uv sync --locked`만 사용하며, `uv lock` 생성은 수동 `generate_lockfiles=true`에서만 수행한다.

## lock 증명

각 lock 작업은 설치·트리 검증이 끝난 뒤 `.sorion/lock-proof/*.json`을 만든다. 증명에는 lock과
`package.json` 또는 `pyproject.toml`의 SHA-256이 들어간다. Web·API·Worker는 이 **lock 증명**이
현재 파일과 일치할 때만 lock을 사용한다. 생성만 됐고 검증을 통과하지 못한 lock은 artifact나
저장소 반영 대상으로 사용하지 않는다.

## artifact와 재실행

- `sorion-npm-lock`, `sorion-api-lock`, `sorion-worker-lock`은 component별 고정 이름을 사용한다.
- 재실행에서는 같은 이름을 안전하게 교체하므로 run attempt 번호 불일치로 다운로드가 깨지지 않는다.
- diagnostics artifact와 registry cache는 실패 시에도 보존된다.
- npm registry 장애는 Web lock만 실패시키며 repository preflight, API, Worker 경로는 독립적으로 진행된다.

## 수동 검토와 커밋

`workflow_dispatch`에서 `generate_lockfiles=true`로 생성한 lock은 artifact로만 제공한다. 담당자가
변경된 의존성과 lock 증명을 **수동 검토**한 뒤 저장소에 커밋해야 한다. CI는 `contents: write`,
`git commit`, `git push`를 사용하지 않으며 일반 push·PR에서 lock을 만들거나 소스를 바꾸지 않는다.

## 차단 기준

- lock과 manifest 불일치
- `npm ci`, `uv sync --locked`, `uv lock --check` 실패
- npm tree의 invalid, missing, extraneous, peerMissing
- Vite `8.2.0` 또는 Vitest `4.1.10` 외 중복 버전
- lock 증명 SHA-256 불일치
- 네트워크 오류가 아닌 ERESOLVE·구문·품질 오류를 재시도로 숨기는 경우

장시간 registry 장애는 성공으로 가장하지 않는다. 대신 실패 범위를 해당 component로 제한하고,
이미 검증된 다른 품질 결과와 진단 자료를 보존한다.


## CI Hardening 2

- preflight 실패는 보고서로 보존되며 API·Worker 품질 실행을 가리지 않는다.
- npm lock은 cache-only 우선 후 `registry.npmjs.org`, `registry.npmjs.com`을 순차 사용한다.
- npm 갱신이 실패하면 시작 전 package-lock을 복원한다.
- API·Worker lock이 먼저 성공하면 npm 결과와 무관하게 각 품질 결과와 검증 artifact를 보존한다.
- 각 lock job은 시작 즉시 audit status 파일을 만들어 artifact 경로를 보장한다.

## CI Hardening 3

- lock 생성 전 registry 후보를 병렬 probe해 응답 가능한 endpoint부터 사용합니다.
- 공식 npm endpoint가 모두 불안정할 때만 Yarn 호환 registry를 마지막 fallback으로 사용합니다.
- `omit-lockfile-registry-resolved=true`로 lock을 특정 registry tarball URL에 묶지 않습니다.
- 누적 ZIP에서 남은 이전 selector 파일은 호환 shim으로 덮어쓰므로 GitHub Desktop 복사만으로 preflight가 복구됩니다.


## CI Hardening 4

- package-lock 부재를 즉시 실패시키는 운영을 시험했지만 사용자 PC의 별도 생성 단계가 누락되어 반복 실패했습니다.

## CI Hardening 5 · 과거 정책

- 과거에는 package-lock이 없으면 CI가 자동 bootstrap했습니다. Heartbeat 6.6에서 이 정책을 폐기했습니다.
- Firebase Auth는 고정 버전 gstatic browser ESM을 로그인 시점에 로드해 npm lock 그래프에서 Firebase SDK를 제외합니다.
- 현재 일반 Push·PR은 커밋된 lock만 검증하고, 갱신은 수동 검토 후 커밋합니다.

## Heartbeat 6.7 distribution note

Repository preflight는 npm lock 검사를 필수 단계로 실행한다. 6.7 덮어쓰기 패치는 저장소에 이미 있는 검증 `package-lock.json`을 변경하거나 삭제하지 않는다. 기반 6.6 전체 ZIP에는 lock이 없었으므로 그 ZIP에서 만든 독립 snapshot은 저장소의 검증 lock을 먼저 추가해야 한다. 검증되지 않은 최소 lock이나 네트워크 실패 중 생성된 lock을 릴리스에 넣지 않는다.

