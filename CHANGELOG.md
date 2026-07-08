# CHANGELOG

## v1.1.7 - Update Sentinel + Engine Boost Profile

- 정보 모달에 `🛰️ 업데이트 적용 상태` 패널을 추가했습니다.
- 현재 버전, 빌드 키, 서비스워커 상태, 캐시 상태, 엔진 프로필을 한눈에 볼 수 있게 했습니다.
- `업데이트 확인`, `이전 캐시 정리`, `진단 복사` 버튼을 추가했습니다.
- `src/boot/update-sentinel.js`와 `assets/css/update-sentinel.css`를 추가했습니다.
- `src/engine/engine-boost-profile.js`를 추가해 브라우저 성능을 `MAX-STABLE / PRO-STABLE / SAFE-STABLE`로 감지합니다.
- Dock 후보 아이콘을 `🎯`, 저장 아이콘을 `📦`으로 재정리했습니다.
- `qa/update_sentinel_smoke.js`와 `qa/engine_boost_profile_smoke.js`를 추가했습니다.
- `qa/app_version_sync_smoke.js`를 패키지 버전 기반 동적 검수로 개선했습니다.
- 인수인계 문서에 Update Sentinel, 캐시 정리 범위, 엔진 프로필 주의점을 추가했습니다.
