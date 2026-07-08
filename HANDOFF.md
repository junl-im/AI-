# HANDOFF v1.1.7

## 요약

v1.1.7은 v1.1.6에서 해결한 버전 미반영/캐시 문제를 사용자가 직접 확인할 수 있게 만든 업데이트 신뢰성 패치입니다. 정보 모달에 `Update Sentinel`을 추가했고, 브라우저 성능 감지용 `Engine Boost Profile`을 추가했습니다.

## 주요 파일

- `src/config/app-runtime-config.js`
- `src/boot/app-version-sync.js`
- `src/boot/update-sentinel.js`
- `assets/css/update-sentinel.css`
- `src/engine/engine-boost-profile.js`
- `src/ui/flow-director-final.js`
- `src/ui/flow-command-bridge.js`
- `sw.js`
- `qa/app_version_sync_smoke.js`
- `qa/update_sentinel_smoke.js`
- `qa/engine_boost_profile_smoke.js`

## 중요 변경점

- 버전 표시는 계속 `AIShortsRuntimeConfig.APP_VERSION`을 단일 소스로 사용합니다.
- `app-version-sync.js`는 상단 배지, 문서 제목, 정보 모달, 메타 태그, body dataset을 런타임 설정에 맞춥니다.
- `update-sentinel.js`는 정보 모달에 `🛰️ 업데이트 적용 상태` 패널을 주입합니다.
- `Update Sentinel`은 현재 버전, 빌드 키, 캐시 상태, 서비스워커 상태, 엔진 프로필, 렌더 보조 기능을 표시합니다.
- `Update Sentinel`은 `업데이트 확인`, `이전 캐시 정리`, `진단 복사` 버튼을 제공합니다.
- `engine-boost-profile.js`는 브라우저 코어 수, 메모리 힌트, Worker, OffscreenCanvas, MediaRecorder, WebCodecs 가능 여부를 감지합니다.
- 엔진 프로필은 `MAX-STABLE / PRO-STABLE / SAFE-STABLE`로 표시되며, 향후 분석 샘플 수나 렌더 큐 한도를 조정하는 기준으로 사용할 수 있습니다.
- Dock의 후보 아이콘은 `🎯`, 저장 아이콘은 `📦`으로 재정리했습니다.
- 화면 이동은 계속 `flow-director-final.js`와 `flow-command-bridge.js`가 최종 소유합니다. 이 두 파일을 동시에 수정하면 중복 스크롤 떨림이 재발할 수 있습니다.

## 확인 포인트

1. PC에서 상단 좌측은 버전, 가운데는 PC · 모바일 호환, 우측은 Design by 곰같은여우로 한 줄 정렬되어야 합니다.
2. 상단 아래 YouTube/Reels/TikTok 셔터 타일이 보여야 합니다.
3. 하단 Dock은 `📂 파일 열기 / ✨ 추천 / 🎯 후보 / 📱 미리보기 / 〰️ 파형 / ✂️ 컷 / 🎛️ 편집 / 📦 저장` 순서여야 합니다.
4. 상단 버전 배지를 누르면 정보 모달이 열리고 `🛰️ 업데이트 적용 상태` 패널이 보여야 합니다.
5. 정보 모달에서 `업데이트 확인`, `이전 캐시 정리`, `진단 복사` 버튼이 보여야 합니다.
6. Dock 탭을 눌러도 화면이 떨리지 않고 해당 패널이 전면으로 이동해야 합니다.
7. `src/config/app-runtime-config.js`, `package.json`, `index.html`, `sw.js`가 모두 같은 버전을 참조해야 합니다.

## Update Sentinel 주의점

- `Update Sentinel`은 본 화면을 복잡하게 만들지 않기 위해 정보 모달 내부에만 상태 패널을 주입합니다.
- 캐시 정리는 `ai-shorts-studio-shell-`로 시작하는 이전 셸 캐시만 대상으로 합니다.
- 현재 버전 캐시 이름은 `v`를 제거한 `package.json` 버전과 `version-sync-cache-guard` 규칙을 맞춰야 합니다.
- `app-version-sync.js`보다 뒤에 로드되어야 현재 버전/빌드 키를 정확히 읽습니다.

## 검수 순서

1. `npm run check` 실행
2. 상단 한 줄 정보 확인: 좌측 버전 / 가운데 PC · 모바일 호환 / 우측 Design by 곰같은여우
3. 버전 배지 클릭 후 정보 모달 안의 `Update Sentinel` 패널 확인
4. `업데이트 확인`, `이전 캐시 정리`, `진단 복사` 버튼 존재 확인
5. Dock 탭 클릭 시 화면 떨림 없이 해당 패널이 전면으로 올라오는지 확인
6. 모바일 폭에서 Dock이 4+4 구조를 유지하는지 확인
7. 버전 패치 시 `package.json`, `src/config/app-runtime-config.js`, `index.html`, `sw.js`, `qa/app_version_sync_smoke.js`가 자동으로 같은 버전을 보는지 확인

## 알려진 제한

- 원본 미디어 파일은 브라우저 보안 정책상 세션에 자동 저장하지 않습니다.
- 모바일 Safari 및 일부 인앱 브라우저에서는 MediaRecorder 저장 형식과 진동 피드백이 제한될 수 있습니다.
- 셔터 플래시 연출은 `prefers-reduced-motion` 환경에서 자동으로 비활성화됩니다.
- 캐시 정리 버튼은 브라우저가 Cache API를 차단한 환경에서는 동작하지 않을 수 있습니다.
