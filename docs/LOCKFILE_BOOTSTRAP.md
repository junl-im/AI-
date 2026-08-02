# LOCKFILE BOOTSTRAP

SoriON CI는 npm, API uv, Worker uv를 **독립 lock 작업**으로 처리한다. npm registry가 멈춰도
API·Worker 품질 결과가 함께 가려지지 않으며, 각 품질 작업은 자신에게 필요한 lock만 기다린다.

## 고정 런타임

- Node `22.18.0`, npm `10.9.3`
- Python `3.10`, uv `0.11.32`
- `package-lock.json`, `services/api/uv.lock`, `services/worker/uv.lock`

## 독립 생성과 검증

- lock이 없거나 수동 `generate_lockfiles=true`이면 해당 component만 생성한다.
- lock이 있으면 자동 갱신하지 않고 manifest 일치와 locked install을 검증한다.
- npm은 cache-only 시도를 먼저 하고, 부족할 때만 bounded online retry를 수행한다.
- npm 내부 재시도와 외부 재시도를 중첩하지 않으며 각 명령에는 hard timeout이 있다.
- API와 Worker는 별도 `uv lock`, `uv lock --check`, `uv sync --locked` 경로를 사용한다.

## lock 증명

각 lock 작업은 설치·트리 검증이 끝난 뒤 `.sorion/lock-proof/*.json`을 만든다. 증명에는 lock과
`package.json` 또는 `pyproject.toml`의 SHA-256이 들어간다. Web·API·Worker와 자동 커밋 작업은
이 **lock 증명**이 현재 파일과 일치할 때만 lock을 사용한다. 생성만 됐고 검증을 통과하지 못한
lock은 artifact나 저장소에 반영되지 않는다.

## artifact와 재실행

- `sorion-npm-lock`, `sorion-api-lock`, `sorion-worker-lock`은 component별 고정 이름을 사용한다.
- 재실행에서는 같은 이름을 안전하게 교체하므로 run attempt 번호 불일치로 다운로드가 깨지지 않는다.
- diagnostics artifact와 registry cache는 실패 시에도 보존된다.
- npm registry 장애는 Web lock만 실패시키며 repository preflight, API, Worker 경로는 독립적으로 진행된다.

## 자동 커밋

main push에서 검증된 세 component lock이 모두 준비되면 별도 `Commit verified lockfiles · main only`
작업이 증명 SHA-256을 다시 확인하고 세 lock만 자동 커밋한다. 이 작업만 `contents: write` 권한을
가지며 PR에서는 실행되지 않는다. 커밋 메시지에는 `[skip ci]`를 넣어 무한 실행을 막는다.

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
- API·Worker lock이 먼저 성공하면 npm 결과와 무관하게 검증 후 main에 반영한다.
- 각 lock job은 시작 즉시 audit status 파일을 만들어 artifact 경로를 보장한다.

## CI Hardening 3

- lock 생성 전 registry 후보를 병렬 probe해 응답 가능한 endpoint부터 사용합니다.
- 공식 npm endpoint가 모두 불안정할 때만 Yarn 호환 registry를 마지막 fallback으로 사용합니다.
- `omit-lockfile-registry-resolved=true`로 lock을 특정 registry tarball URL에 묶지 않습니다.
- 누적 ZIP에서 남은 이전 selector 파일은 호환 shim으로 덮어쓰므로 GitHub Desktop 복사만으로 preflight가 복구됩니다.

