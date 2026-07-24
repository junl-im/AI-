# PROJECT NOTES v1.6.1

## 변하지 않는 프로젝트 원칙

- 정적 호스팅으로 기본 분석·편집·렌더 기능이 동작해야 합니다.
- 외부 CDN, 원격 런타임 코드, 추적 스크립트를 추가하지 않습니다.
- 사용자가 선택한 Local AI 기능 외에는 미디어와 프로젝트 내용을 네트워크로 보내지 않습니다.
- 서비스워커 앱 셸 변경 시 `asset-integrity.json`을 재생성합니다.
- 현재 namespace, 중요 세션 백업, 프로젝트 원본을 자동 파괴하지 않습니다.

## 저장소 UI 계약

- 일반 화면은 `상태 + 사용량 + 조건부 자동 정리 + 고급 진단 진입`만 소유합니다.
- namespace, signature, 캐시 계약, 셸 감사 용어는 일반 화면에 노출하지 않습니다.
- 상세 캐시 조회는 고급 진단을 열기 전에는 실행하지 않습니다.
- 위험 작업은 공통 확인 계층을 통과해야 합니다.
- 확인 문구는 프로젝트 원본·편집 데이터의 비삭제와 분석 재수행 가능성을 구분합니다.
- 모바일 고급 진단은 viewport 안에서 독립 스크롤하며 일반 페이지를 확장하지 않습니다.

## Local AI 계약

- endpoint 검증은 `local-ai-provider-registry.js`가 소유합니다.
- 자동 probe 금지. 연결·생성·전사는 사용자 gesture 뒤에 실행합니다.
- Ollama digest mismatch는 hard block입니다.
- timeout과 사용자 취소는 서로 다른 상태입니다.
- AI 모듈은 staged loader의 `localAI` phase에서만 적재합니다.
- `index.html`에 Local AI 모듈을 직접 다시 삽입하지 않습니다.

## 버전 동기화 대상

- `package.json`
- `src/config/app-runtime-config.js`
- `src/boot/app-version-sync.js`
- `src/boot/update-sentinel.js`
- `sw.js`, `index.html`, `asset-integrity.json`
- 버전별 QA JSON과 문서

## 릴리스 전 필수 점검

- 무결성 manifest 재생성
- storage visibility·panel·전용 browser audit
- staged loading 49개 직접 스크립트 예산
- 일반 4개 viewport browser audit
- CSS ownership, interaction, structure priority
- service worker lifecycle, process memory, GPU/media
- 전체 219개 `qaChecks`
- `git diff --check`
- release/patch ZIP 무결성 및 v1.6.0 기준 덮어쓰기 SHA-256 동일성

## 다음 확장 규칙

고급 진단 기능을 늘릴 때는 일반 요약에 버튼을 추가하지 말고 고급 modal 내부 섹션으로 배치합니다. 브라우저 WASM 모델, MediaPipe, ffmpeg.wasm은 초기 번들에 넣지 않고 optional provider 또는 model pack으로 격리합니다.
