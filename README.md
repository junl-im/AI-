# AI Shorts Studio v1.6.24

로컬 영상 분석·쇼츠 편집·스마트 리프레임·렌더링을 브라우저 내부에서 수행하는 정적 PWA입니다. 사용자 영상, 프로젝트, 분석 이력, 선택 설치한 비전 모델 팩은 외부 서버로 자동 전송하지 않습니다.

## v1.6.24 핵심 변경

- 서로 다른 두 화자가 동시에 말하면 두 얼굴을 상·하 2분할로 유지합니다.
- 화자 cue를 주 화자·보조 화자·자동 역할로 지정해 pane 순서를 제어합니다.
- 같은 시간 범위에 보조 화자 cue를 직접 추가할 수 있습니다.
- 동일 화자 라벨의 모든 cue에 얼굴 연결·고정·역할을 한 번에 적용합니다.
- cue별 연결 신뢰도 이력을 최대 12건 보존하고 최근 변화를 표시합니다.
- 역할과 신뢰도 이력은 개인정보를 추가하지 않고 프로젝트 파일에 bounded metadata로 보존됩니다.
- 직접 시작 스크립트 49개와 기존 Preview/Render/Object URL 수명주기를 유지합니다.

## 실행

```bash
npm run serve
```

브라우저에서 `http://localhost:8080`을 엽니다. 비전 모델 팩은 사용자가 공식 MediaPipe Tasks Vision 런타임과 얼굴 감지 모델 파일을 직접 선택해 설치합니다. 모델 바이너리는 배포 ZIP에 포함되지 않습니다.

## 검사

```bash
npm test
node qa/run_all_checks.js --shard 1/8
node qa/run_all_checks.js --match support_diagnostics
```

등록 품질 게이트는 **281개**이며 8개 샤드에서 **281/281 통과, 실패 0건**을 확인했습니다. 브라우저·실미디어 감사는 Chromium, ffmpeg, Python Playwright가 필요합니다.

## 모듈형 엔진 구조

- 상위 앱 브리지: `src/app.js`
- 가져오기: `src/app/media-import-controller.js`
- 분석·timing history: `src/app/analysis-controller.js`
- 지원 진단 생성·가져오기·비교·보고서: `src/diagnostics/support-diagnostics.js`
- 미리보기: `src/app/preview-controller.js`
- 렌더 흐름: `src/app/render-workflow-controller.js`
- 분석 엔진: `src/engine/*`, `src/analysis/*`
- 스마트 리프레임·비전 모델: `src/vision/*`
- 저장·복구: `src/storage/*`
- staged hydration: `src/boot/staged-ui-loader.js`
- 앱 셸 업데이트·무결성: `sw.js`, `asset-integrity.json`, `src/boot/update-sentinel.js`

## 개인정보·안전 정책

- 진단 비교는 읽기 전용이며 프로젝트·분석 이력·모델 설정을 변경하지 않습니다.
- 지원 요약에는 원본 파일명, 로컬 경로, 미디어 바이트, 모델 URL, 임의 operation metadata를 포함하지 않습니다.
- 비교 대상 외부 JSON은 기존 allowlist normalizer를 통과한 값만 사용합니다.
- 분석 이력 보존 설정은 로컬 브라우저에만 저장됩니다.
- Local AI 연결은 사용자의 명시 동작과 loopback 주소로 제한됩니다.
- 서비스워커는 앱 셸 자산만 관리하고 사용자 미디어와 프로젝트 데이터는 runtime cache에 저장하지 않습니다.

## 알려진 제한

- 환경 비교는 브라우저가 노출하는 기능과 진단 요약을 비교하며 물리 GPU·발열 상태를 확정하지 않습니다.
- 지원 요약은 문제 재현 보조 자료이며 프로젝트 복원 파일이 아닙니다.
- Chromium RSS는 GPU·renderer·utility 캐시를 합산하므로 JS 누수 단독 판정값이 아닙니다.
- 15→30→15분 정상 단일-focus 경로는 변경되지 않아 v1.6.23 완주 증빙을 승계했습니다. 현재 버전에서는 dual-speaker Chromium 흐름, 30분 1080p 스마트 리프레임, 5회 실미디어 heap, 프로세스 메모리, 4개 화면 감사를 새로 수행했습니다.
- 3명 이상 동시 화자는 역할·신뢰도 기준 상위 두 얼굴만 표시하며 dual pane은 현재 상·하 50:50 고정입니다.
- 모바일 Safari와 Samsung Internet 실기기 검증은 남아 있습니다.
