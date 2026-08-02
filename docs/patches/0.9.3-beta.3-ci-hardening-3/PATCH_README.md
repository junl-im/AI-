# SoriON AI 0.9.3-beta.3 CI Hardening 3 Patch

누적 ZIP 덮어쓰기에서 남은 구형 lock selector를 삭제 대상으로 취급하지 않고, 최신 호환 shim으로 덮어써 GitHub Desktop 복사만으로 preflight가 복구되도록 합니다.

또한 API Ruff import 정렬을 수정하고, npm registry를 짧게 병렬 진단한 뒤 응답 가능한 endpoint부터 사용합니다. 공식 npm endpoint가 불안정할 때는 Yarn 호환 registry를 마지막 fallback으로 사용하며 lock에는 registry tarball URL을 고정하지 않습니다.
