# AI 쇼츠 제작 스튜디오 v1.3.4

음악이나 영상을 브라우저 안에서 분석하고, 하이라이트 추천부터 9:16 미리보기와 저장까지 이어주는 로컬 웹 스튜디오입니다.

## v1.3.4 핵심 패치

이번 버전은 **모바일 작업 동선 단순화**와 **긴 파일 디코딩 메모리 안전장치**를 추가했습니다.

- 모바일 메뉴바는 현재 단계와 다음 행동을 포함한 핵심 4개 메뉴만 우선 표시합니다.
- `전체 메뉴`를 누르면 파형·컷·편집·저장을 포함한 기존 8개 메뉴가 모두 표시됩니다.
- 단계 이동 시 간단 메뉴로 자동 복귀하고 `현재 … · 다음 …` 안내가 갱신됩니다.
- PC 메뉴바는 기존처럼 8개 메뉴를 모두 유지합니다.
- 긴 파일은 분석 전에 예상 디코딩 메모리와 위험도를 계산합니다.
- 위험도가 높은 파일은 안전 모드 안내를 표시하고 진단 기록을 남깁니다.
- 브라우저 안정 범위를 크게 넘는 무압축 파일은 MP3·AAC 변환 또는 파일 분할을 안내합니다.
- 오디오 디코딩 시 원본 ArrayBuffer의 전체 복사본을 만들지 않아 순간 메모리 피크를 낮췄습니다.
- 10분 MP3 분석·추천·렌더, MP4 출력, 취소와 실패 재시도를 실제 Chromium에서 재검증했습니다.

## 배포 파일

```bash
npm run package
```

- `dist/ai-shorts-studio-v1.3.4-release.zip`: 전체 설치용
- `dist/ai-shorts-studio-v1.3.4-patch-from-v1.3.3.zip`: v1.3.3 덮어쓰기용

패치 ZIP은 기존 v1.3.3 폴더 최상위에 풀고 파일 교체를 허용합니다.

## 실행과 검수

```bash
npm run serve
npm test
python3 qa/run_browser_audit.py
python3 qa/run_media_e2e.py
```

- 자동 QA: **129/129**
- PC·모바일 Chromium 오류, Promise 거절, 콘솔 오류: **0건**
- PC 메뉴: 8개 모두 표시
- 모바일 간단 메뉴: 핵심 4개 표시
- 모바일 전체 메뉴: 8개 모두 표시
- 페이지 가로 overflow: 0px
- 20초 MP3·MP4 출력, 취소, 실패 재시도 완료
- 10분 MP3 분석 약 5.8초, 8kHz 분석 트랙 약 18.3MB

## 주요 구조

- 모듈형 엔진: 분석·추천·렌더 기능을 계약 기반 모듈로 분리
- 모바일 메뉴 조정: `src/ui/mobile-menu-guide.js`
- 모바일 메뉴 스타일: `assets/css/mobile-menu-guide.css`
- 적응형 성능 예산: `src/engine/performance-budget.js`
- 메모리 절감 오디오 준비: `src/analysis/audio-feature-extractor.js`
- 공유 분석 코어: `src/analysis/audio-analysis-core.js`
- 비동기 작업 소유권: `src/engine/operation-coordinator.js`
- 렌더 취소·재시도·ETA: `src/render/render-queue.js`
- PC 작업실 조절: `src/ui/workspace-layout-controls.js`
- 현재 단계 네온: `assets/css/active-stage-beacon.css`
- 전용 SVG 아이콘: `assets/icons/studio/`

## 알려진 제한

Web Audio의 `decodeAudioData()`는 브라우저 내부에서 원본 전체를 디코딩합니다. 이번 패치가 원본 ArrayBuffer의 추가 복사는 제거했지만, 매우 긴 WAV·AIFF나 다채널 오디오는 디코딩 자체의 순간 메모리가 여전히 클 수 있습니다. 모바일 Safari·Samsung Internet·인앱 브라우저의 장시간 출력은 실기기 검증이 필요합니다.
