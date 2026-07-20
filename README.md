# AI 쇼츠 제작 스튜디오 v1.3.5

음악이나 영상을 브라우저 안에서 분석하고, 하이라이트 추천부터 9:16 미리보기와 저장까지 이어주는 로컬 웹 스튜디오입니다.

## v1.3.5 핵심 패치

이번 버전은 **부팅 안정성**, **파일 입력 방어**, **사용자 데이터 안전 렌더링**을 강화했습니다.

- 서비스워커 등록을 `AIShortsServiceWorkerRegistration` 단일 모듈로 분리했습니다.
- HTTPS·localhost에서 등록이 성공한 뒤 존재하지 않는 `runtimeConfig`를 참조하던 오류 경로를 제거했습니다.
- 서비스워커 등록은 한 번만 실행하고, 실패 시 진단을 남긴 뒤 재시도할 수 있습니다.
- 드래그앤드롭으로 PDF·문서 등 지원하지 않는 파일이 들어오면 오디오로 오인하지 않고 즉시 차단합니다.
- 세션 복구 파일명, 불러온 프로젝트의 후보 제목·구간, 렌더 작업 라벨·오류를 `innerHTML`이 아닌 안전한 텍스트 노드로 출력합니다.
- 공용 유틸에 미디어 종류 판별과 HTML 이스케이프 함수를 추가했습니다.
- 기존 모바일 핵심 4개/전체 8개 메뉴, 긴 파일 메모리 사전 점검, 렌더 취소·재시도·ETA 흐름은 그대로 유지됩니다.
- 자동 QA와 실제 Chromium MP3·MP4·10분 미디어 E2E를 다시 통과했습니다.

## 배포 파일

```bash
npm run package
```

- `dist/ai-shorts-studio-v1.3.5-release.zip`: 전체 설치용
- `dist/ai-shorts-studio-v1.3.5-patch-from-v1.3.4.zip`: v1.3.4 덮어쓰기용

패치 ZIP은 기존 v1.3.4 폴더 최상위에 풀고 파일 교체를 허용합니다.

## 실행과 검수

```bash
npm run serve
npm test
python3 qa/run_browser_audit.py
python3 qa/run_media_e2e.py
```

- 자동 QA: **131/131**
- PC·모바일 Chromium 오류, Promise 거절, 콘솔 오류: **0건**
- PC 메뉴: 8개 모두 표시
- 모바일 간단 메뉴: 핵심 4개 표시
- 모바일 전체 메뉴: 8개 모두 표시
- 페이지 가로 overflow: 0px
- 20초 MP3·MP4 출력, 취소, 실패 재시도 완료
- 10분 MP3 분석 약 5.2초, 8kHz 분석 트랙 약 18.3MB
- 서비스워커 성공·실패·중복 등록 방지와 재시도 경로 단위 검증 완료
- 악성 마크업 형태의 파일명·후보 제목·렌더 라벨 텍스트 출력 회귀 검증 완료

## 주요 구조

- 모듈형 엔진: 분석·추천·렌더 기능을 계약 기반 모듈로 분리
- 서비스워커 등록 소유권: `src/boot/service-worker-registration.js`
- 미디어 종류 판별·문자열 이스케이프: `src/utils/core-utils.js`
- 파일 입력 차단과 앱 연결: `src/app.js`
- 안전한 세션 파일명 출력: `src/ui/session-continuity.js`
- 안전한 후보 비교 출력: `src/ui/candidate-preview-pro.js`
- 안전한 렌더 완료 로그: `src/ui/export-finish-center.js`
- 적응형 성능 예산: `src/engine/performance-budget.js`
- 비동기 작업 소유권: `src/engine/operation-coordinator.js`
- 렌더 취소·재시도·ETA: `src/render/render-queue.js`
- 모바일 메뉴 조정: `src/ui/mobile-menu-guide.js`

## 알려진 제한

Web Audio의 `decodeAudioData()`는 브라우저 내부에서 원본 전체를 디코딩합니다. 매우 긴 WAV·AIFF나 다채널 오디오는 디코딩 자체의 순간 메모리가 여전히 클 수 있습니다. 모바일 Safari·Samsung Internet·인앱 브라우저의 장시간 출력과 실제 서비스워커 업데이트 전환은 실기기·실배포 환경 검증이 추가로 필요합니다.
