# HANDOFF v1.3.2

## 요약

v1.3.2는 **실제 MP3·MP4 E2E**, **오디오 Worker 폴백**, **렌더 취소**, **재생 실패 즉시 중단**, **새 작업 기반 안전 재시도**를 추가한 엔진 안정화 릴리스입니다.

합성 20초 MP3와 MP4를 Chromium에 직접 넣어 분석 → 추천 → 후보 선택 → 2초 구간 렌더 → 다운로드까지 실행했습니다. 별도로 렌더 중 취소와 의도적인 재생 실패 후 재시도를 검증했습니다. v1.3.1의 3열 작업실 조절과 집중 보기, 자동 메뉴 이동, 단계 네온 랜딩은 유지합니다.

## 이번 변경

- `src/analysis/audio-analysis-core.js`: Worker와 메인 스레드가 공유하는 오디오 특징 분석 코어를 추가했습니다.
- `src/workers/highlight-analysis.worker.js`: 공유 분석 코어를 사용하도록 정리했습니다.
- `src/analysis/audio-feature-extractor.js`: Worker 생성·실행 실패 시 메인 스레드 비동기 폴백을 수행하고 진단을 기록합니다.
- `src/render/vertical-renderer.js`: MediaRecorder·canvas captureStream 사전 검사와 원본 재생 실패 즉시 중단을 추가했습니다.
- `src/render/render-queue.js`: 실패 작업을 새 queued 작업으로 재구성하는 `retryableJobs()`와 안전 재시도를 추가했습니다.
- `src/app.js`: 렌더 취소 버튼, 실행 중 버튼 상태, 새 작업 토큰 기반 실패 재시도와 사전 호환성 검사를 연결했습니다.
- `index.html`: 공유 분석 코어와 렌더 취소 버튼을 연결했습니다.
- `assets/css/render-queue.css`: 취소 버튼, 취소 상태, PC 3열·모바일 1열 액션 배치를 추가했습니다.
- `qa/run_media_e2e.py`: ffmpeg·Playwright가 있는 환경에서 MP3·MP4·취소·재시도를 재현하는 브라우저 감사 스크립트입니다.
- `qa/runtime-media-e2e-v1.3.2.json`: 실제 미디어 감사 결과입니다.
- `qa/audio_analysis_fallback_smoke.js`, `qa/render_recovery_smoke.js`, `qa/media_e2e_audit_smoke.js`: 신규 회귀 검사입니다.
- 버전·빌드 키·서비스워커 캐시를 v1.3.2 / `1.3.2-media-e2e`로 동기화했습니다.

## 사용자 디자인·UX 선호

- 멋있지만 깔끔하고 쇼츠의 9:16·빠른 컷·타임라인 정체성이 보여야 합니다.
- 현재 진행 중인 구역은 밝은 네온 띠 라인으로 즉시 알아볼 수 있어야 합니다.
- 네온은 현재 작업 한 곳에만 사용하고 카드·배지·테두리가 겹치지 않게 합니다.
- PC는 여러 작업 구간이 보이고 진행 시 메뉴·패널 강조·화면 위치가 함께 이동해야 합니다.
- PC의 넓은 화면은 한 화면 분할과 직접 조절 가능한 작업실로 활용합니다.
- 모바일은 본문 기능 중복을 피하고 하단 메뉴바와 진행 안내를 사용합니다.
- 사용자 노출 명칭은 `Dock`이 아니라 `메뉴바`입니다.
- 핵심 아이콘은 `assets/icons/studio/`의 전용 SVG만 사용합니다.
- 상단 메타는 왼쪽 BUILD·버전·모바일/PC 호환, 오른쪽 DESIGNED BY·곰같은여우만 유지합니다.
- 매 릴리스마다 전체 설치 ZIP과 직전 버전 덮어쓰기 패치 ZIP을 함께 제공합니다.

## 오디오 분석 유지 규칙

1. Worker와 메인 스레드 폴백은 `audio-analysis-core.js`의 같은 계산식을 사용합니다.
2. Worker 실패는 분석 전체 실패로 확정하지 말고 폴백 가능 여부를 먼저 확인합니다.
3. 폴백 루프는 배치 사이에 실행권을 양보하고 AbortSignal을 확인합니다.
4. 취소된 분석은 결과를 상태에 기록하지 않습니다.
5. Worker 폴백 발생은 `analysis-worker-fallback` 진단으로 남깁니다.
6. 공유 코어의 입력·출력 형태를 바꾸면 Worker와 extractor 회귀 검사를 함께 갱신합니다.

## 렌더·복구 유지 규칙

1. 렌더 전에 MediaRecorder와 canvas captureStream 필수 기능을 검사합니다.
2. 원본 미디어의 `play()` 성공을 확인한 뒤에만 녹화를 시작합니다.
3. 재생 거절 시 빈 영상이나 정지 프레임을 계속 녹화하지 않고 즉시 실패 처리합니다.
4. 실행 중에는 `취소` 버튼만 활성화하고 큐 비우기·중복 시작을 막습니다.
5. 취소는 다운로드를 만들지 않고 queue item을 `cancelled`로 종료합니다.
6. 실패 재시도는 이전 operation token을 재사용하지 않고 `runRenderQueueJobs()`로 새 작업을 시작합니다.
7. 재시도 횟수는 큐 item에 누적하고 무한 재시도를 허용하지 않습니다.
8. 성공·실패·취소 모두에서 RAF·interval·timeout·MediaStreamTrack·MediaRecorder·원본 볼륨을 정리합니다.
9. 결과 다운로드 직전에 현재 operation과 media session을 다시 검증합니다.

## 작업실·단계 강조 유지 규칙

1. 기본 작업실 모드는 `balanced`이며 새 실행마다 균형 모드로 시작합니다.
2. 로컬 저장에는 열 `weights`만 기록하고 집중 모드는 기록하지 않습니다.
3. 현재 단계 강조 최종 소유자는 `FlowDirectorFinal`입니다.
4. 현재 패널에는 `is-stage-current`와 `.stage-neon-rail`을 유지합니다.
5. 랜딩 애니메이션은 단계가 실제 변경될 때 한 번만 실행합니다.
6. 집중 보기에서도 메뉴 활성, 화면 이동과 네온 단계 키가 일치해야 합니다.
7. 1180px 미만에서는 PC 전용 도구막대와 리사이저를 숨깁니다.
8. `prefers-reduced-motion`에서는 스윕과 펄스를 비활성화합니다.

## 비동기 엔진 유지 규칙

1. 새 원본은 `startMediaSession()`을 호출합니다.
2. 분석·미리보기·렌더는 각 채널에서 동시에 하나만 활성화됩니다.
3. 같은 채널의 새 작업은 이전 작업을 취소합니다.
4. 결과 반영과 다운로드 직전에 현재 작업과 미디어 세션을 검증합니다.
5. 오래된 진행 이벤트는 DOM에 쓰지 않습니다.
6. AbortError는 사용자 오류로 표시하지 않고 조용한 취소로 처리합니다.
7. 자원 cleanup은 성공·실패·취소 모두에서 실행합니다.

## Update Sentinel 유지 규칙

- 새 릴리스에서는 CSS·스크립트 링크와 서비스워커 캐시 쿼리를 같은 빌드 키로 갱신합니다.
- 신규 분석 코어와 QA 감사 파일을 배포 매니페스트에 포함합니다.
- 이전 셸 캐시 정리와 진단 복사 기능을 유지합니다.

## 검수 순서

1. `npm test`로 문법, DOM, 버전·캐시, 메뉴, 네온, 엔진 계약, Worker 폴백, 렌더 취소·재시도와 배포 계약을 실행합니다.
2. `qa/runtime-browser-audit-v1.3.2.json`에서 PC·모바일 오류, 메뉴 8개, overflow와 작업실 조절을 확인합니다.
3. ffmpeg·Python Playwright가 있으면 `python3 qa/run_media_e2e.py`를 실행합니다.
4. MP3와 MP4가 분석·추천·선택·렌더·다운로드까지 완료되는지 확인합니다.
5. ffprobe로 출력 파일의 컨테이너, 재생 시간과 크기를 확인합니다.
6. 6초 렌더 도중 취소해 다운로드 0건, cancelled 1건, 활성 operation 0건인지 확인합니다.
7. 원본 `play()` 실패를 주입하고 첫 작업 실패 후 재시도가 attempts 2로 정상 완료되는지 확인합니다.
8. `npm run package`로 전체 ZIP과 v1.3.1 패치 ZIP을 생성합니다.
9. 깨끗한 v1.3.1 복사본에 패치를 적용해 매니페스트 파일을 바이트 단위로 비교합니다.
10. 전체·패치 ZIP에 `unzip -t`를 실행하고 SHA-256을 생성합니다.

## 배포 규칙

1. 전체 설치용 ZIP과 직전 버전 덮어쓰기용 패치 ZIP을 함께 만듭니다.
2. v1.3.2 패치 기준은 v1.3.1입니다.
3. `PATCH_MANIFEST.txt`는 실제 바이트 차이로 생성한 변경·추가 파일만 기록합니다.
4. 전체·패치 ZIP 모두 압축 무결성과 SHA-256을 확인합니다.
5. 삭제 파일이 생기면 단순 덮어쓰기 외에 삭제 절차를 제공합니다.

## 검수 결과

- `npm test`: **124/124 통과**
- Chromium desktop 1366×768: 오류 0, Promise 거절 0, 콘솔 오류 0
- Chromium mobile 390×844: 오류 0, Promise 거절 0, 콘솔 오류 0
- 합성 20초 MP3: 추천 1개, 2초 출력, 실패 0, 출력 약 340KB
- 합성 20초 MP4: 추천 1개, 2초 출력, 실패 0, 출력 약 218KB
- MP3·MP4 출력은 ffprobe에서 MP4 계열 컨테이너와 유효 재생 시간 확인
- 렌더 취소: cancelled 1, 다운로드 0, 활성 operation 0
- 재생 실패 재시도: 첫 시도 failed 1, 두 번째 attempts 2·done 1, 출력 약 398KB
- 브라우저 감사 종료 뒤 오류와 활성 operation 없음
- 덮어쓰기 패치: 70개 파일, 누락 0, 불일치 0
- 전체 ZIP: 241개 항목, 전체·패치 압축 무결성 통과

## 핵심 파일

- `src/analysis/audio-analysis-core.js`
- `src/analysis/audio-feature-extractor.js`
- `src/workers/highlight-analysis.worker.js`
- `src/render/vertical-renderer.js`
- `src/render/render-queue.js`
- `src/engine/operation-coordinator.js`
- `src/app.js`
- `assets/css/render-queue.css`
- `qa/run_media_e2e.py`
- `qa/runtime-media-e2e-v1.3.2.json`
- `qa/runtime-browser-audit-v1.3.2.json`

## 알려진 제한

- 자동 실미디어 감사는 합성 20초 파일을 사용하며 수십 분짜리 대용량·고해상도 영상은 아직 검증하지 않았습니다.
- 관리형 Chromium의 로컬 주소 제한 때문에 동일 자산을 인라인 하네스로 주입했으며 서비스워커와 영구 localStorage는 감사 범위 밖입니다.
- 모바일 Safari와 인앱 브라우저의 MediaRecorder MIME 선택·파일 확장자는 실기기 검증이 필요합니다.
- 브라우저가 원본 미디어 captureStream을 제공하지 않으면 영상 출력에 원본 오디오가 포함되지 않을 수 있으며 사전 검사에서 경고만 제공합니다.
- ffmpeg와 Python Playwright가 없는 환경에서는 실제 미디어 감사를 재실행할 수 없고 저장된 감사 JSON 회귀 검사만 수행합니다.

## 다음 우선순위

1. 5분·15분·30분 대용량 MP4 장시간 분석·렌더와 메모리 추적
2. 모바일 Safari·Samsung Internet·인앱 브라우저 실기기 출력 검증
3. 렌더 취소 후 사용자 복구 안내와 진행률 상세화
4. 모바일 메뉴바를 현재 단계와 다음 행동 중심으로 축약
5. CSS를 핵심·편집·저장 단계로 분리해 초기 페인트 추가 최적화
6. 후보 비교·고정과 미리보기 연결 개선
