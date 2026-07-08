# HANDOFF - AI 쇼츠 제작 스튜디오 v1.1.3

## 이번 버전 핵심

v1.1.3은 저장 완료 후 흐름을 정리하는 `Export Finish Center` 패치입니다.

### 추가 파일

- `assets/css/export-finish-center.css`
- `src/ui/export-finish-center.js`
- `qa/export_finish_center_smoke.js`

### 연결 위치

- `index.html`에서 저장 탭 렌더 큐 아래에 동적으로 완료 센터가 생성됩니다.
- `sw.js`에 신규 CSS/JS 캐시 항목을 추가했습니다.
- `package.json` QA 목록에 신규 검사 2개를 추가했습니다.

### 동작

1. 렌더 큐가 실행됩니다.
2. 큐가 완료되면 완료 센터가 표시됩니다.
3. 완료/실패/부분 완료 상태와 최근 작업 로그가 표시됩니다.
4. 사용자는 미리보기, 후보 보기, 다시 저장, 실패 재시도, 진단 복사, 목록 정리를 바로 실행할 수 있습니다.

### 주의

- 실제 파일 저장 위치는 브라우저 다운로드 정책을 따릅니다.
- 실패 재시도는 기존 `AIShortsRenderQueue.retryFailed()` 또는 `renderQueueRetryBtn`을 사용합니다.

## 검수 순서

1. `npm run check` 실행
2. 파일 열기 후 자동 분석 확인
3. 추천 생성 후 후보 탭 이동 확인
4. 후보 선택 후 미리보기 이동 확인
5. 저장 탭에서 렌더 큐와 저장 완료 센터 표시 확인

## 알려진 제한

- 원본 미디어 파일은 브라우저 보안상 자동 세션 저장에 포함되지 않습니다.
- iOS Safari와 일부 인앱 브라우저에서는 다운로드, 진동, MediaRecorder 동작이 제한될 수 있습니다.
- 저장 완료 후 실제 파일 위치는 브라우저 다운로드 설정을 따릅니다.
