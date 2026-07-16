# HANDOFF v1.2.9

## 요약

v1.2.9는 **PC 메뉴바 잘림과 런타임에서만 드러나는 오류를 해결한 코드·엔진 안정화 릴리스**입니다. 1366px 화면에서 마지막 저장 메뉴가 보이지 않던 원인은 메뉴바 외부 프레임 970px과 내부 레일 1180px 규칙이 동시에 적용된 CSS 소유권 충돌이었습니다. 내부 레일을 부모 너비에 고정하고 1180px 미만을 4열×2행으로 전환했습니다.

정적 QA가 놓친 `syncTopLine is not defined` 오류도 실제 Chromium 전체 스크립트 실행으로 발견해 제거했습니다. 단계 로더 키 불일치, 렌더 타이머 정리, 미리보기 재생 거절, 세션 heartbeat와 전역 오류 기록도 함께 보강했습니다.

## 이번 변경

- `assets/css/ui-refinement.css`: 메뉴바 프레임 폭을 최대 1080px로 조정하고 내부 레일의 너비 소유권을 고정했습니다.
- `assets/css/workspace-comfort.css`: 1180px 독립 레일과 112px 최소 탭 폭을 제거하고 `repeat(8, minmax(0, 1fr))`를 사용합니다.
- `src/boot/staged-ui-loader.js`: `editor`를 `edit`로 수정하고 런타임 빌드 키, 10초 타임아웃과 진단을 적용했습니다.
- `src/boot/runtime-health.js`: `window.error`, `unhandledrejection`, 최근 오류와 중복 제거를 추가했습니다.
- `src/app.js`: 미리보기 `play()` 거절 시 루프를 시작하지 않고 사용자 경고와 진단을 남깁니다.
- `src/render/vertical-renderer.js`: 모든 종료 경로에서 RAF·interval·timeout·트랙·볼륨을 정리합니다.
- `src/ui/session-continuity.js`: 30초 가시성 기반 heartbeat와 pagehide 정리를 사용합니다.
- `src/ui/flow-command-bridge.js`: 제거된 `syncTopLine()` 잔존 호출과 공개 API 참조를 제거했습니다.
- `qa/runtime_browser_audit_smoke.js`: 실제 Chromium 감사 JSON을 릴리스 QA에 포함합니다.
- 버전·빌드 키·서비스워커 캐시를 v1.2.9 / `1.2.9-stability-audit`로 동기화했습니다.

## 사용자 디자인·UX 선호

- 멋있지만 깔끔하고 쇼츠의 9:16·빠른 컷·타임라인 정체성이 첫눈에 보여야 합니다.
- 게임 UI처럼 카드·배지·테두리·네온이 겹치면 안 됩니다.
- 바깥 프레임은 한 번만 쓰고 내부 구분은 여백·명암·얇은 선으로 처리합니다.
- PC는 여러 작업 구간이 한 화면에 보이고, 진행 시 메뉴·패널 강조·화면 위치가 함께 이동해야 합니다.
- 모바일은 본문 기능 중복을 피하고 하단 메뉴바와 진행 안내를 사용합니다.
- 사용자 노출 명칭은 `Dock`이 아니라 `메뉴바`입니다.
- 핵심 아이콘은 `assets/icons/studio/`의 전용 SVG만 사용합니다.
- 상단 메타는 왼쪽 BUILD·버전·모바일/PC 호환, 오른쪽 DESIGNED BY·곰같은여우만 유지합니다.

## PC 메뉴바 유지 규칙

1. 외부 `.bottom-dock`이 너비를 소유합니다.
2. 내부 `.bottom-dock-tabs`는 `width:100%; max-width:100%; min-width:0`을 유지합니다.
3. 내부 레일에 viewport 기반 독립 폭을 다시 넣지 않습니다.
4. 1180px 이상은 8개 한 줄, 미만은 4열×2행입니다.
5. 항목은 `minmax(0, 1fr)`를 사용해 라벨이 레일을 늘리지 않게 합니다.
6. 1180·1280·1366·1920px와 모바일 390px에서 모든 메뉴가 viewport 안에 있는지 검사합니다.
7. `저장` 메뉴의 오른쪽 좌표가 viewport 폭을 넘지 않는지 회귀 검사합니다.

## 코드·엔진 안정성 규칙

1. 메뉴 키는 실제 DOM 상태와 일치해야 하며 편집은 `edit`입니다.
2. 단계 로더는 버전 문자열을 하드코딩하지 않고 런타임 config에서 파생합니다.
3. 지연 자산은 timeout과 진단 경로를 갖고 실패한 script 요소를 정리합니다.
4. 제거한 함수·DOM ID·상태 키가 리스너나 공개 API에 남지 않았는지 전체 검색합니다.
5. `play()`가 실패하면 RAF·interval을 시작하지 않습니다.
6. 렌더의 성공·오류·취소는 같은 cleanup 경로를 사용합니다.
7. 세션 저장 heartbeat는 hidden/pagehide에서 멈춥니다.
8. 전역 오류와 Promise 거절을 기록하고 릴리스 감사에서 0건을 요구합니다.
9. 초기화 후 2초와 4초의 RAF·Mutation 수가 같아야 합니다.
10. QA 보고서의 통과 수치는 실제 `npm test` 결과와 일치해야 합니다.

## Update Sentinel 유지 규칙

- Update Sentinel은 현재 버전·빌드 키·서비스워커 캐시를 진단하고 이전 셸 캐시를 정리합니다.
- 새 릴리스에서는 CSS·스크립트 링크와 서비스워커 캐시 쿼리를 같은 빌드 키로 갱신합니다.
- 런타임 건강 정보와 단계 로딩 오류가 진단 복사 내용에 포함되는지 확인합니다.

## 검수 순서

1. `npm test`로 문법, DOM, 엔진 계약, 메뉴 containment, 런타임 감사와 배포 계약을 실행합니다.
2. Chromium 1366×768과 390×844에서 전체 스크립트를 실행해 오류·Promise 거절·콘솔 오류를 확인합니다.
3. 2초와 4초의 RAF·Mutation 카운터가 같은지 확인합니다.
4. 1180·1280·1366·1920px에서 메뉴 8개가 모두 viewport 안에 있는지 확인합니다.
5. `npm run package`로 전체 ZIP과 패치 ZIP을 만들고 `unzip -t`를 실행합니다.
6. 깨끗한 v1.2.8 복사본에 패치를 적용해 매니페스트 파일을 바이트 단위로 비교합니다.
7. SHA-256 체크섬을 생성하고 QA 보고서 수치와 실제 결과를 다시 맞춥니다.

## 배포 규칙

1. 매 버전마다 전체 설치용 ZIP과 직전 버전 덮어쓰기용 패치 ZIP을 함께 만듭니다.
2. v1.2.9 패치 기준은 v1.2.8입니다.
3. `PATCH_MANIFEST.txt`에 변경·추가 파일을 모두 기록합니다.
4. 패치 적용 검증은 깨끗한 v1.2.8 복사본에서 수행합니다.
5. 전체·패치 ZIP 모두 압축 무결성과 SHA-256을 확인합니다.
6. 삭제 파일이 생기면 단순 덮어쓰기 외에 삭제 절차를 제공합니다.

## 검수 결과

- `npm test`: **115/115 통과**
- Chromium desktop 1366×768: 오류 0, Promise 거절 0, 콘솔 오류 0
- Chromium mobile 390×844: 오류 0, Promise 거절 0, 콘솔 오류 0
- Desktop/menu: 8개 모두 표시, dock 1080px, 마지막 메뉴 viewport 내부
- Mobile/menu: 4열×2행, 8개 모두 표시
- RAF: 25 → 25, Mutation: 59 → 59로 안정화
- 가로 overflow: PC·모바일 모두 0
- 전체 ZIP 225개 항목 / 패치 ZIP 67개 파일
- v1.2.8 복사본 패치 적용: 누락 0 / 불일치 0
- serviceWorker/secureContext는 감사용 `about:blank` 주입 환경 특성상 false이며 제품 결함으로 판정하지 않습니다.

## 핵심 파일

- `assets/css/ui-refinement.css`
- `assets/css/workspace-comfort.css`
- `src/boot/staged-ui-loader.js`
- `src/boot/runtime-health.js`
- `src/render/vertical-renderer.js`
- `src/ui/session-continuity.js`
- `src/ui/flow-command-bridge.js`
- `src/app.js`
- `qa/pc_menu_containment_smoke.js`
- `qa/stability_audit_smoke.js`
- `qa/runtime_browser_audit_smoke.js`
- `qa/runtime-browser-audit-v1.2.9.json`

## 알려진 제한

- 실제 대용량 MP4의 장시간 분석·렌더·다운로드 E2E는 아직 남아 있습니다.
- 모바일 Safari와 인앱 브라우저의 MediaRecorder·SVG mask는 실기기 검증이 필요합니다.
- 감사용 Chromium은 로컬 URL이 정책으로 차단되어 실제 자산을 CDP 문서에 주입해 실행했습니다.

## 다음 우선순위

1. 실제 MP3·MP4 전체 E2E와 중단·재시도 시나리오
2. 분석·추천·렌더 이벤트 및 상태 소유권 중복 감사
3. PC 3열 칼럼 리사이즈와 집중 모드
4. 모바일 단계형 메뉴 축약
5. CSS 단계 로딩과 초기 페인트 추가 최적화
