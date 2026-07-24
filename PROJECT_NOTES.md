# PROJECT NOTES v1.6.2

## 변하지 않는 프로젝트 원칙

- 정적 호스팅으로 기본 분석·편집·렌더 기능이 동작해야 합니다.
- 외부 CDN, 원격 런타임 코드, 추적 스크립트를 추가하지 않습니다.
- 사용자가 선택한 Local AI 기능 외에는 미디어와 프로젝트 내용을 네트워크로 보내지 않습니다.
- 서비스워커 앱 셸 변경 시 `asset-integrity.json`을 재생성합니다.
- 현재 namespace, 중요 세션 백업, 프로젝트 원본을 자동 파괴하지 않습니다.

## 저장소 UI 계약

- 일반 저장소 요약은 전체 작업실 뒤 페이지 최하단에 둡니다.
- 정상 상태에서는 낮은 시각 우선순위를 유지합니다.
- cleanup·repair action이 새로 발생할 때만 한 번 자동 이동·강조합니다.
- namespace, signature, 캐시 계약, 셸 감사 용어는 일반 화면에 노출하지 않습니다.
- 상세 캐시 조회는 고급 진단을 열기 전에는 실행하지 않습니다.
- 위험 작업은 공통 확인 계층을 통과해야 합니다.

## Local AI 배치 계약

- Local AI는 프로젝트·카피와 핵심 제작 단계 사이의 전체 폭 `ai` grid row를 소유합니다.
- 기본 상태는 접힘이며 명시적 사용자 동작으로만 workbench를 펼칩니다.
- 미리보기·파형 집중 모드에서는 숨겨 핵심 편집 공간을 보존합니다.
- endpoint 검증은 `local-ai-provider-registry.js`가 소유합니다.
- 자동 probe 금지. 연결·생성·전사는 사용자 gesture 뒤에 실행합니다.
- AI 모듈은 staged loader의 `localAI` phase에서만 적재합니다.

## 버전 동기화 대상

- `package.json`
- `src/config/app-runtime-config.js`
- `src/boot/app-version-sync.js`
- `src/boot/update-sentinel.js`
- `sw.js`, `index.html`, `asset-integrity.json`
- 버전별 QA JSON과 문서

## 릴리스 전 필수 점검

- 무결성 manifest 재생성
- storage footer·auto-navigation browser audit
- Local AI layout harmony browser audit
- staged loading 직접 스크립트 예산
- 일반 4개 viewport browser audit
- CSS ownership, interaction, structure priority
- service worker lifecycle, process memory, GPU/media
- 전체 221개 `qaChecks`
- `git diff --check`
- release/patch ZIP 무결성 및 v1.6.1 기준 덮어쓰기 SHA-256 동일성

## 다음 확장 규칙

상시 상태·전문 진단·선택형 AI는 핵심 제작 단계보다 높은 시각 우선순위를 갖지 않습니다. MediaPipe, 브라우저 WASM 모델, ffmpeg.wasm은 초기 번들에 넣지 않고 optional provider 또는 model pack으로 격리합니다.
