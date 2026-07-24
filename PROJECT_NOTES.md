# PROJECT NOTES v1.6.0

## 변하지 않는 프로젝트 원칙

- 정적 호스팅으로 기본 편집·렌더 기능이 동작해야 합니다.
- 외부 CDN, 원격 런타임 코드, 추적 스크립트를 추가하지 않습니다.
- 사용자가 선택한 로컬 AI 기능 외에는 미디어와 프로젝트 내용을 네트워크로 보내지 않습니다.
- AI 기능 실패가 기존 분석·편집·렌더 경로를 중단해서는 안 됩니다.
- 서비스워커 앱 셸 변경 시 `asset-integrity.json`을 반드시 재생성합니다.
- 현재 namespace와 중요 세션 백업을 자동 파괴하지 않습니다.

## Local AI 계약

- endpoint 검증은 `local-ai-provider-registry.js` 한 곳에서 소유합니다.
- 기본 허용 호스트는 loopback뿐입니다.
- 자동 probe 금지. 모든 연결·생성·전사는 사용자 gesture 뒤에 실행합니다.
- provider별 transport 차이를 UI에 분산하지 않습니다.
- Ollama digest mismatch는 hard block입니다.
- timeout과 사용자 취소는 서로 다른 상태로 기록합니다.
- 작업 이력에는 콘텐츠·파일명·모델명·endpoint 원문을 넣지 않습니다.
- AI 모듈은 staged loader의 `localAI` phase에서만 적재합니다.

## API 매핑

- Ollama creative: `GET /api/tags`, `POST /api/generate`
- llama.cpp creative: `GET /v1/models`, `POST /v1/chat/completions`
- whisper.cpp speech: `POST /inference`
- OpenAI-compatible speech fallback: `POST /v1/audio/transcriptions`

## 버전 동기화 대상

- `package.json`
- `src/config/app-runtime-config.js`
- `src/boot/app-version-sync.js`
- `src/boot/update-sentinel.js`
- `sw.js`
- `index.html`
- `asset-integrity.json`
- 버전별 QA JSON과 문서

## 릴리스 전 필수 점검

- `node tools/generate-integrity-manifest.js`
- 신규 Local AI 3개 smoke test
- staged loading 49개 직접 스크립트 예산
- 4개 viewport browser audit
- CSS ownership audit
- service worker lifecycle
- 전체 `qaChecks`
- `git diff --check`
- release/patch ZIP `unzip -t`
- v1.5.29 기준 패치 적용 후 현재 트리와 SHA-256 동일성

## 다음 확장 규칙

브라우저 WASM 모델, MediaPipe, ffmpeg.wasm을 추가할 때는 초기 번들에 넣지 말고 provider 또는 optional pack으로 격리합니다. 모델 파일은 크기·라이선스·SHA-256·저장 위치·삭제 UI·fallback을 함께 설계해야 합니다.
