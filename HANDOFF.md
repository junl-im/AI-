# HANDOFF v1.6.0 Local AI Provider Foundation

## 현재 상태

- 앱 버전: `1.6.0`
- runtime version: `v1.6.0`
- build key: `1.6.0-local-ai-provider-foundation`
- 서비스워커 캐시: `ai-shorts-studio-shell-v1.6.0-local-ai-provider-foundation`
- 분석 캐시 계약: `v3`
- 기준 커밋: v1.5.29 `8e0eaeb`
- 최종 릴리스 커밋: 이 문서와 배포물을 고정한 `git log -1` 참조

v1.5.29의 옵션 인지형 분석 캐시와 저장 비용 추세를 유지하면서, localhost에서 실행되는 오픈소스 AI 서버를 안전하게 선택 연결하는 계층을 추가했습니다. 기존 분석·편집·렌더 경로는 AI 연결 없이 완전히 작동합니다.

## 이번 패치의 핵심

### 1. Local AI provider registry

`src/ai/local-ai-provider-registry.js`

- 제공자: Ollama, llama.cpp server, whisper.cpp server, Local OpenAI-compatible
- loopback 주소만 허용하고 URL 계정 정보·원격 호스트를 차단
- 요청 `credentials: omit`, `referrerPolicy: no-referrer`, `cache: no-store`
- 응답 최대 2MiB, 프롬프트·스키마·전사 파일 크기 상한
- Ollama 모델 digest 고정·변경 감지·생성 차단
- JSON Schema 기반 구조화 카피 결과 파싱·검증
- whisper.cpp `/inference`와 OpenAI 호환 `/v1/audio/transcriptions` 대응
- 구간 전사 결과를 밀리초 경계가 안정적인 SRT로 변환

### 2. 직렬 작업 조정기

`src/ai/ai-job-coordinator.js`

- 동시 작업 1개, 대기열 최대 6개
- 작업별 AbortController, 사용자 취소, 시간 제한
- timeout은 취소가 아니라 `failed / TimeoutError`로 구분
- 진행률·메시지·경과 시간·비식별 meta 이력 최대 20개
- 큐가 가득 차면 새 작업을 명확하게 거절

### 3. Local AI Studio UI

`src/ui/local-ai-studio.js`, `assets/css/local-ai-studio.css`

- 사용자가 직접 누르는 연결 확인 버튼
- 카피 제공자·주소·모델 선택, Ollama digest 고정
- 선택 후보·현재 자막을 바탕으로 제목·후킹·설명·해시태그 생성
- 제목·해시태그를 기존 작업실에 적용
- 미디어 전사, 언어 선택, SRT 미리보기·적용
- 현재 작업 진행률·취소·최근 이력 표시

### 4. 단계 적재

`src/boot/staged-ui-loader.js`

- 로컬 AI 모듈을 초기 스크립트에서 제거
- `#localAIStudio` 포커스 또는 첫 상호작용 때 coordinator → provider registry → UI 순서로 적재
- 첫 클릭을 보존해 적재 후 한 번 재생
- 직접 실행 스크립트 49개 예산 유지

### 5. Update Sentinel

기존 `src/boot/update-sentinel.js` 소유권을 유지합니다. 프로그램 정보 화면에서 현재 버전·빌드 키·서비스워커·셸 캐시를 확인하고, 업데이트 확인·이전 셸 캐시 정리·비식별 진단 복사를 수행합니다.

### 6. 보안·오프라인 계약

- CSP `connect-src`는 self와 loopback 주소만 허용
- 외부 CDN·원격 스크립트·원격 모델 참조 없음
- 새 CSS·JS는 서비스워커 앱 셸과 SHA-256 manifest에 포함
- 페이지 로드만으로 로컬 AI 네트워크 요청이 발생하지 않음
- 로컬 AI 실패는 기존 앱 부팅과 편집 기능을 차단하지 않음

## 주요 파일

- `src/ai/local-ai-provider-registry.js`
- `src/ai/ai-job-coordinator.js`
- `src/ui/local-ai-studio.js`
- `assets/css/local-ai-studio.css`
- `src/boot/staged-ui-loader.js`
- `src/config/app-runtime-config.js`
- `index.html`
- `sw.js`
- `qa/local_ai_provider_registry_smoke.js`
- `qa/ai_job_coordinator_smoke.js`
- `qa/local_ai_studio_smoke.js`

## 검수 순서

1. `node tools/generate-integrity-manifest.js`
2. `node qa/local_ai_provider_registry_smoke.js`
3. `node qa/ai_job_coordinator_smoke.js`
4. `node qa/local_ai_studio_smoke.js`
5. `node qa/staged_ui_loading_smoke.js`
6. `python3 qa/run_browser_audit.py`
7. `node qa/runtime_browser_audit_smoke.js`
8. `node qa/run_css_ownership_audit.js && node qa/css_ownership_smoke.js`
9. `node qa/run_service_worker_lifecycle.js && node qa/service_worker_lifecycle_smoke.js`
10. `npm test` 또는 `qa/run_all_checks.js`의 구간 실행
11. `git diff --check`
12. 전체·패치 ZIP 생성 후 `unzip -t`와 기준본 덮어쓰기 SHA-256 비교

## QA 근거

- 자동 QA 결과: **216/216 통과**
- Chromium 4개 viewport: 런타임 오류·Promise 거절·콘솔 오류·가로 overflow 0
- CSS ownership: 48개 파일, 충돌·동일값 중복·shadowed declaration 0
- 서비스워커: install·activate·offline navigation 통과
- GPU/media: 두 실행 모드 모두 62프레임, dropped frame 0, 런타임 오류 0
- 구조 우선순위: 현재 Chromium probe에서 safe 165, unsafe 29, unproven 12로 재분류
- 프로세스 메모리: 4회 UI 순환에서 JS heap slope 약 0.0053MiB/cycle, 런타임 오류 0. RSS는 warmup을 포함해 증가하므로 누수 부재의 단독 근거로 사용하지 않음
- 장시간 15→30→15분 1080p MP4: 미디어 디코드·분석·렌더·Object URL 경로가 변경되지 않아 기존 실측 근거를 명시적으로 상속

## 운영 시 주의

- 로컬 AI 서버는 OS 일반 사용자 권한과 loopback bind로 실행하십시오.
- 브라우저 origin을 허용하는 CORS 설정이 필요합니다.
- Ollama 모델 digest를 고정한 뒤 모델이 교체되면 UI에서 재확인·재고정해야 합니다.
- llama.cpp와 일반 OpenAI 호환 서버는 모델 digest를 표준 응답으로 제공하지 않아 고정 상태가 `unsupported`로 표시됩니다.
- 전사 버튼을 누르면 선택 미디어가 지정한 localhost 서버로 전송됩니다.

## 알려진 제한

- AI 서버·모델·WASM 바이너리는 배포본에 포함되지 않습니다.
- 브라우저 내부 whisper.cpp WASM 추론과 MediaPipe 스마트 리프레임은 아직 구현하지 않았습니다.
- 실기기 모바일 브라우저, 물리 GPU·NPU, 대규모 모델별 VRAM/RAM 한계는 검증하지 않았습니다.
- 로컬 서버 구현마다 CORS·모델 이름·구조화 출력 지원 차이가 있을 수 있습니다.
- headless Chromium의 GPU·프로세스 메모리 결과는 실제 데스크톱 환경과 동일하지 않습니다.
- 이전 버전 장시간 영상 결과의 상속은 AI 모듈이 기존 미디어 실행 경로를 변경하지 않았다는 코드·회귀 근거에 기반합니다.

## 다음 우선순위

`v1.6.1`에서는 모델 팩 다운로드·SHA-256 검증을 포함한 브라우저 WASM provider와 MediaPipe 기반 얼굴 중심 스마트 리프레임 중 하나를 독립 기능 플래그로 추가하는 것이 안전합니다.
