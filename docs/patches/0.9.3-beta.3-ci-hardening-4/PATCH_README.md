# SoriON AI 0.9.3-beta.3 CI Hardening 4 Patch

반복되는 npm registry bootstrap을 일반 push·PR에서 제거합니다. `package-lock.json`은
`GENERATE_WEB_LOCK.cmd` 또는 `GENERATE_WEB_LOCK.sh`로 로컬에서 한 번 생성·검증한 뒤
GitHub Desktop으로 커밋해야 합니다. 이후 CI는 `npm ci` verify-only 경로를 사용합니다.

API `verification.py`의 일반 import와 alias import를 Ruff I001 canonical form으로 분리하고,
workflow의 중복 `env` 키를 제거했습니다.
