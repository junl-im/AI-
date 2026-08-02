# SoriON AI 0.9.3-beta.3 CI Hardening 5 Patch

기준본은 `0.9.3-beta.3 CI Hardening 4`입니다. ZIP을 저장소 루트에 덮어쓴 뒤 GitHub Desktop에서 변경사항 전체를 Commit·Push합니다.

이번 패치는 반복된 Ruff I001을 STT 모듈 단일 import로 제거하고, 누락되거나 stale인 `package-lock.json`을 CI가 검증된 bootstrap으로 다시 생성하도록 복구합니다. npm Firebase SDK는 고정 버전 Firebase CDN ESM 런타임 로드로 바꿔 lock 해석 그래프에서 제거했습니다.

삭제 파일은 없습니다. 기존 package-lock이 있다면 CI가 manifest 불일치를 감지해 자동 갱신 대상으로 전환합니다. `GENERATE_WEB_LOCK.cmd`는 필수 단계가 아니라 registry 장애 시 사용할 수 있는 선택적 복구 수단입니다.
