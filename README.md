# AI 쇼츠 제작 스튜디오 v1.3.2

음악이나 영상을 브라우저 안에서 분석하고, 하이라이트 추천부터 9:16 미리보기와 저장까지 이어주는 로컬 웹 스튜디오입니다.

## v1.3.2 핵심 패치

이번 버전은 실제 MP3·MP4 흐름을 Chromium에서 끝까지 실행하고, 그 과정에서 드러난 분석·렌더 복구 문제를 수정한 안정화 릴리스입니다.

- 오디오 분석 Worker를 사용할 수 없거나 중간에 실패하면 같은 분석 코어를 메인 스레드에서 비동기로 이어서 실행합니다.
- 메인 스레드 폴백은 배치 사이에 실행권을 양보하고 AbortSignal을 확인해 장시간 화면 정지를 줄입니다.
- 렌더 시작 전에 MediaRecorder와 canvas captureStream 지원 여부를 검사합니다.
- 원본 미디어 재생이 거절되면 빈 영상 녹화를 계속하지 않고 즉시 실패 처리합니다.
- 렌더 중 `취소` 버튼을 제공하고, 취소된 작업은 다운로드 없이 안전하게 종료합니다.
- 실패한 작업의 `재시도`는 과거 작업 토큰을 재사용하지 않고 새 렌더 작업으로 시작합니다.
- MP3·MP4 정상 저장, 렌더 취소, 재생 실패, 실패 재시도를 실제 브라우저 자동 감사에 포함했습니다.
- v1.3.1의 3열 리사이즈, 집중 보기, 메뉴 이동과 네온 랜딩을 그대로 유지합니다.

## 배포 파일

```bash
npm run package
```

- `dist/ai-shorts-studio-v1.3.2-release.zip`: 전체 설치용
- `dist/ai-shorts-studio-v1.3.2-patch-from-v1.3.1.zip`: v1.3.1 덮어쓰기용

패치 ZIP은 기존 v1.3.1 폴더 최상위에 풀고 파일 교체를 허용합니다. 다른 기준 버전에는 적용하지 않습니다.

## 실행과 검수

```bash
npm run serve
npm test
```

- 자동 QA: **124/124**
- 실제 Chromium PC·모바일 오류·Promise 거절·콘솔 오류: **0건**
- 합성 20초 MP3·MP4: 분석 → 추천 → 선택 → 2초 렌더 → 다운로드 완료
- 출력 파일: ffprobe에서 MP4 계열 컨테이너·유효 재생 시간·비어 있지 않은 크기 확인
- 렌더 취소: 취소 1건, 다운로드 0건, 활성 작업 0건
- 실패 재시도: 첫 시도 실패 후 두 번째 새 작업에서 정상 저장

## 주요 구조

- 모듈형 엔진: 분석·추천·렌더 기능을 계약 기반 모듈로 분리
- 공유 오디오 분석 코어: `src/analysis/audio-analysis-core.js`
- Worker·메인 스레드 분석 어댑터: `src/analysis/audio-feature-extractor.js`
- 렌더 사전 검사·재생 안전장치: `src/render/vertical-renderer.js`
- 렌더 큐 취소·재시도: `src/render/render-queue.js`
- 비동기 작업 소유권: `src/engine/operation-coordinator.js`
- PC 작업실 조절: `src/ui/workspace-layout-controls.js`
- 현재 단계 네온: `assets/css/active-stage-beacon.css`
- 전용 SVG 아이콘: `assets/icons/studio/`

## 알려진 제한

이번 자동 감사는 합성 20초 미디어와 관리형 Chromium의 인라인 자산 하네스를 사용했습니다. 실제 대용량·장시간 MP4, 매우 높은 해상도나 프레임률, 모바일 Safari와 인앱 브라우저의 MediaRecorder 출력 형식은 실기기에서 추가 검증해야 합니다. 서비스워커와 영구 localStorage 동작은 인라인 감사 범위 밖이며 별도 정적·브라우저 계약 검사로 확인합니다.
