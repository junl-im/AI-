# HANDOFF v1.3.0

## 요약

v1.3.0은 **현재 작업 패널을 명확하게 보여주는 네온 랜딩 UI**와 **분석·미리보기·렌더의 비동기 작업 소유권**을 도입한 안정화 릴리스입니다.

단계가 바뀌면 메뉴 활성, 화면 이동, 패널 네온 테두리, 진행 칩이 함께 움직입니다. 진입 순간 밝은 라인이 한 번 흐르고 이후에는 현재 작업 테두리만 유지합니다. 새 파일을 열 때 이전 분석이나 렌더가 늦게 끝나 새 프로젝트를 덮어쓰는 경쟁 상태도 작업 세대와 AbortSignal로 차단했습니다.

## 이번 변경

- `assets/css/active-stage-beacon.css`: 단계별 네온 테두리, 랜딩 스윕, 진행 칩과 모션 감소 대응을 추가했습니다.
- `src/ui/flow-director-final.js`: 단계 장식 생성, 지속 현재 단계, 1회 랜딩, 접근성 라이브 안내를 단일 소유합니다.
- `src/engine/operation-coordinator.js`: 작업 ID, 미디어 세션, 채널별 취소·완료·현재성 검사를 제공합니다.
- `src/app.js`: 파일 교체, 분석, 미리보기와 렌더를 작업 조정기에 연결했습니다.
- `src/analysis/audio-feature-extractor.js`: 파일 읽기·디코딩·워커 분석에 AbortSignal을 적용했습니다.
- `src/analysis/video-motion-analyzer.js`: 메타데이터 대기, seek와 샘플링 반복을 취소할 수 있습니다.
- `src/engine/analysis-pipeline.js`: 분석 신호를 오디오·영상 모듈로 전달하고 취소를 fallback으로 오인하지 않습니다.
- `src/render/render-queue.js`: 렌더 취소, `cancelled` 상태와 외부 신호 전달을 추가했습니다.
- `src/render/vertical-renderer.js`: MediaRecorder 렌더를 AbortSignal로 중단하고 모든 자원을 정리합니다.
- 버전·빌드 키·서비스워커 캐시를 v1.3.0 / `1.3.0-stage-beacon`으로 동기화했습니다.

## 사용자 디자인·UX 선호

- 멋있지만 깔끔하고 쇼츠의 9:16·빠른 컷·타임라인 정체성이 보여야 합니다.
- 현재 진행 중인 구역은 밝은 네온 띠 라인으로 즉시 알아볼 수 있어야 합니다.
- 네온은 현재 작업 한 곳에만 사용하고 카드·배지·테두리가 겹치지 않게 합니다.
- PC는 여러 작업 구간이 보이고 진행 시 메뉴·패널 강조·화면 위치가 함께 이동해야 합니다.
- 모바일은 본문 기능 중복을 피하고 하단 메뉴바와 진행 안내를 사용합니다.
- 사용자 노출 명칭은 `Dock`이 아니라 `메뉴바`입니다.
- 핵심 아이콘은 `assets/icons/studio/`의 전용 SVG만 사용합니다.
- 상단 메타는 왼쪽 BUILD·버전·모바일/PC 호환, 오른쪽 DESIGNED BY·곰같은여우만 유지합니다.

## 네온 단계 강조 유지 규칙

1. 단계 강조 최종 소유자는 `FlowDirectorFinal`입니다.
2. 현재 패널에는 `is-stage-current`와 `.stage-neon-rail`을 유지합니다.
3. 랜딩 애니메이션은 단계가 실제 변경될 때 한 번만 실행합니다.
4. 같은 단계의 반복 동기화는 애니메이션을 다시 시작하지 않습니다.
5. 진행 칩은 전용 SVG 아이콘과 한국어 단계 명칭을 사용합니다.
6. 다른 CSS가 최종 강조를 덮지 않도록 `active-stage-beacon.css`를 마지막에 로드합니다.
7. 모바일에서는 테두리와 그림자를 약하게 줄이되 진행 상태는 숨기지 않습니다.
8. `prefers-reduced-motion`에서는 스윕과 펄스를 비활성화합니다.

## 비동기 엔진 유지 규칙

1. 새 원본은 `startMediaSession()`을 호출합니다.
2. 분석·미리보기·렌더는 각 채널에서 동시에 하나만 활성화됩니다.
3. 같은 채널의 새 작업은 이전 작업을 취소합니다.
4. 결과 반영과 다운로드 직전에 현재 작업과 미디어 세션을 검증합니다.
5. 오래된 진행 이벤트는 DOM에 쓰지 않습니다.
6. AbortError는 사용자 오류로 표시하지 않고 조용한 취소로 처리합니다.
7. 렌더 취소 시 queued/running 항목을 `cancelled`로 정리합니다.
8. 자원 cleanup은 성공·실패·취소 모두에서 실행합니다.

## Update Sentinel 유지 규칙

- 새 릴리스에서는 CSS·스크립트 링크와 서비스워커 캐시 쿼리를 같은 빌드 키로 갱신합니다.
- 신규 CSS와 operation coordinator를 셸 캐시에 포함합니다.
- 이전 셸 캐시 정리와 진단 복사 기능을 유지합니다.

## 검수 순서

1. `npm test`로 문법, DOM, 엔진 계약, 네온 단계, 작업 조정기, 런타임 감사와 배포 계약을 실행합니다.
2. Chromium 1366×768과 390×844에서 추천·미리보기 단계로 강제 이동해 랜딩 순간을 캡처합니다.
3. 랜딩 종료 뒤 `is-stage-current`와 네온 레일이 유지되고 `is-stage-landing`이 제거되는지 확인합니다.
4. 두 샘플 구간의 RAF·Mutation 카운터가 같은지 확인합니다.
5. `npm run package`로 전체 ZIP과 v1.2.9 패치 ZIP을 만들고 `unzip -t`를 실행합니다.
6. 깨끗한 v1.2.9 복사본에 패치를 적용해 매니페스트 파일을 바이트 단위로 비교합니다.
7. SHA-256 체크섬을 생성하고 QA 보고서 수치와 실제 결과를 맞춥니다.

## 배포 규칙

1. 전체 설치용 ZIP과 직전 버전 덮어쓰기용 패치 ZIP을 함께 만듭니다.
2. v1.3.0 패치 기준은 v1.2.9입니다.
3. `PATCH_MANIFEST.txt`에 변경·추가 파일을 모두 기록합니다.
4. 전체·패치 ZIP 모두 압축 무결성과 SHA-256을 확인합니다.
5. 삭제 파일이 생기면 단순 덮어쓰기 외에 삭제 절차를 제공합니다.

## 검수 결과

- `npm test`: **118/118 통과**
- Chromium desktop 1366×768: 오류 0, Promise 거절 0, 콘솔 오류 0
- Chromium mobile 390×844: 오류 0, Promise 거절 0, 콘솔 오류 0
- Desktop landing: 추천 생성 진행 중, 네온 레일·랜딩 스윕 확인
- Mobile landing: 미리보기 진행 중, 네온 레일·랜딩 스윕 확인
- RAF: 26 → 26, Mutation: 60 → 60으로 안정화
- 메뉴 8개 모두 표시, 가로 overflow 0

## 핵심 파일

- `assets/css/active-stage-beacon.css`
- `src/ui/flow-director-final.js`
- `src/engine/operation-coordinator.js`
- `src/analysis/audio-feature-extractor.js`
- `src/analysis/video-motion-analyzer.js`
- `src/engine/analysis-pipeline.js`
- `src/render/render-queue.js`
- `src/render/vertical-renderer.js`
- `src/app.js`
- `qa/active_stage_beacon_smoke.js`
- `qa/operation_coordinator_smoke.js`
- `qa/runtime-browser-audit-v1.3.0.json`

## 알려진 제한

- 실제 대용량 MP4의 장시간 분석·렌더·다운로드 E2E는 아직 남아 있습니다.
- 모바일 Safari와 인앱 브라우저의 MediaRecorder·SVG mask는 실기기 검증이 필요합니다.
- 현재 렌더 취소는 파일 교체·작업 교체 시 내부적으로 동작하며 명시적인 사용자 취소 버튼은 후속 대상입니다.

## 다음 우선순위

1. 실제 MP3·MP4 전체 E2E와 중단·재시도 시나리오
2. 사용자용 렌더 취소 버튼과 복구 안내
3. PC 3열 칼럼 리사이즈와 집중 모드
4. 모바일 단계형 메뉴 축약
5. CSS 단계 로딩과 초기 페인트 추가 최적화
