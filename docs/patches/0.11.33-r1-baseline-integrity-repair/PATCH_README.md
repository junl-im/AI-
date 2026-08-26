# 0.11.33 -> 0.11.33 R1 Baseline Integrity Repair

제품 semver는 0.11.33을 유지하는 안정화 리비전입니다.

1. 기존 0.11.33 저장소를 백업/커밋합니다.
2. 이 PATCH ZIP을 저장소 루트에 덮어씁니다.
3. `DELETE_LIST.txt`의 경로를 삭제합니다. 존재하지 않는 경로는 건너뜁니다.
4. `node VERIFY_LIVE_VOICE_MYVOICE.mjs`가 51/51 PASS인지 확인합니다.
5. 가능한 환경에서 npm clean install 후 lint/Vitest/typecheck/build를 실행합니다.
