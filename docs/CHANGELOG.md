# CHANGELOG

## 0.8.1 - 2026-08-01

### Mobile Engine/API Reliability

- 모바일 API 주소 정규화, 최근 성공 주소, 안전 자동 탐색을 강화했습니다.
- API·TTS·Worker·GPU 상태를 별도 계층으로 표시합니다.
- 네트워크 전환·앱 복귀 시 자동 재검사와 단계적 재연결을 추가했습니다.
- GET 요청 재시도, 요청 ID, 모바일 timeout, 오류 분류를 추가했습니다.
- TTS POST 응답이 끊겨도 job ID로 완료 결과를 복구할 수 있습니다.
- 재시도 대기 중 AbortSignal listener를 완료·취소 시 정리합니다.
- Private Network preflight와 모바일 CORS 응답을 강화했습니다.
- 입력·타임라인·Dock·바텀시트의 모바일 터치 영역과 safe-area를 보강했습니다.

## 0.8.0 - 2026-08-01

### Chat-to-Timeline 전체 UX 개편

- 초기 브랜드 랜딩을 유지하고 Dock 진입 후 편집 작업공간으로 전환
- 대형 브랜드 헤더를 편집 모드에서 58px compact header로 축소
- 500자 대형 입력 폼을 ChatGPT형 메시지 composer로 교체
- 광고톤, 느린 속도, 숫자 읽기, 밝은 톤 추천 프롬프트 추가
- 브라우저 지원 시 한국어 Web Speech 입력 추가
- 혜린·도윤·소리 세로 보이스 라이브러리와 선택 프리뷰 추가
- 문장을 음성·쉼 블록으로 쌓는 CapCut형 타임라인 추가
- 블록 드래그·좌우 이동·자르기·길게 눌러 수정·실패 구간 재시도 추가
- 첫 블록 완성 즉시 Linked Player Dock에 추가하는 Progressive Playback 적용
- API 미설정 오류를 채팅 시스템 메시지와 연결 바텀시트에서 즉시 해결
- API·Worker·GPU 상태 점과 안전한 API 후보 탐색·붙여넣기 추가
- 불필요한 중간 프레임과 이중 카드 테두리 제거
- 모바일 보이스 라이브러리를 선택 요약 + 펼침형 세로 목록으로 변경
- API 연결, 실제 TTS 준비, Demo 전용 상태를 분리해 엔진 상태 오판 방지
- 타임라인 블록에 생성 옵션을 저장해 이전 문장 재시도 시 목소리가 바뀌지 않도록 수정

### 연결 안정성

- API URL 정규화와 저장 주소·localhost·현재 호스트 자동 탐색 강화
- Connectivity 응답에 API, TTS, clone readiness와 Worker 설정 여부 추가
- API 실패를 브라우저 데모 성공으로 조용히 숨기지 않는 새 작업 흐름 적용

### 검증

- FastAPI 테스트 56개 통과
- CosyVoice Worker 테스트 9개 통과
- Python compileall 및 Python 3.10 AST 검사
- TypeScript·TSX 구문 검사와 대체 정적 타입 검사
- CSS 10개 파싱, 프로젝트 규칙, 실제 API·Worker·System TTS HTTP 통합 검사, 패치 동등성 검사

## 0.7.3 - 2026-08-01

### Added

- `docs/HANDOVER.md`를 임시채팅용 영구 프로젝트 메모리로 재구성
- 제품 목표, 사용자 확정 UX, 현재 아키텍처, 엔진 상태, 보안, 환경 변수,
  CI 회귀, 제한, 다음 작업을 한 파일에 보존
- 다음 세션 시작 절차와 HANDOVER 갱신 규칙
- 이전 상세 HANDOVER와 오래된 CHANGELOG 보존 아카이브
- 프로젝트 규칙 검사에 MASTER HANDOVER 필수 구역과 500줄 제한 추가

### Changed

- Web·API·Worker 표시 버전을 `0.7.3`으로 통일
- `START_HERE.md`의 첫 절차를 HANDOVER 필독으로 변경
- 다음 기능 목표를 `0.7.4 GPU Deployment & Progressive Playback`으로 이동
- `DELIVERY_RULES.md`에 임시채팅 인수인계 메모리 절대 규칙 추가

### Notes

- 기능 코드는 `0.7.2`와 동일하다.
- 이 릴리스의 목적은 다음 AI·개발자가 대화 메모리 없이도 정확히 이어서 개발하도록
  기준 상태를 고정하는 것이다.

### Verification

- 프로젝트 절대 규칙 검사 통과
- FastAPI 테스트 56개 통과
- CosyVoice Worker 테스트 9개 통과
- Python compileall·Python 3.10 AST 검사 통과
- HANDOVER 500줄 제한 통과

## 0.7.2 - 2026-08-01

### Fixed

- Worker의 `Mapping`, `Awaitable`, `Callable` import를 `collections.abc`로 이동해 Ruff `UP035`를 해결했다.
- 상수 이름을 사용하는 `getattr`를 직접 속성 접근으로 바꿔 Ruff `B009`를 해결했다.
- FastAPI `File`·`Form` 기본값을 `Annotated` 메타데이터로 이동해 Ruff `B008`을 해결했다.
- API Worker 테스트의 사용하지 않는 `json` import를 제거해 Ruff `F401`을 해결했다.
- 짧은 여러 문장이 기본 180자 한도 안에서 하나의 UI 구간으로 합쳐지던 문제를 수정했다.
- 복제 작업 polling effect가 전체 `job` 객체를 참조하면서 부분 의존성만 선언하던 Hook 경고를 수정했다.

### Added

- Ruff 회귀 패턴과 React Hook polling 계약을 검사하는 프로젝트 규칙을 추가했다.
- 기본 길이에서도 문장 경계를 유지하는 `splitTextForUi` 회귀 테스트를 추가했다.

### Verification

- FastAPI 테스트 56개 통과
- CosyVoice Worker 테스트 9개 통과
- Python compileall 및 Python 3.10 AST 문법 검사 통과
- 프로젝트 절대 규칙 검사 통과

## 0.7.1 - 2026-07-31

- API와 CosyVoice Worker 사이 서비스 토큰·HMAC-SHA256 요청 서명을 추가했다.
- 만료 요청, 변조 body, 잘못된 토큰을 Worker에서 차단한다.
- API와 Worker에 사용자/IP·서비스 토큰 기준 요청 제한을 추가했다.
- 음성 데이터 없이 운영 메타데이터만 남기는 JSONL 감사 로그를 추가했다.
- production Worker에서 보안 Secret이 없으면 readiness를 차단한다.
- 모델 필수 파일, CUDA, VRAM, 디스크 여유 공간, CPU 실행 정책 진단을 추가했다.
- SSE event id와 Last-Event-ID 복구 계약을 추가했다.
- 종료된 Worker 작업·입력 샘플 TTL 정리를 추가했다.
- 버전을 0.7.1로 통일하고 보안·인수인계 문서를 갱신했다.

## 0.7.0 - 2026-07-31

### Added

- 별도 `services/worker` CosyVoice 실행 서비스
- Worker `/health`, `/ready`, `/v1/diagnostics` 상태 계약
- GPU·CUDA·VRAM·모델 경로·adapter 로딩 진단
- 공식 `AutoModel`과 `inference_cross_lingual(stream=True)` 기반 선택 설치 adapter
- 문장별 작업 생성, SSE 이벤트, 취소, 실패·취소 구간 재시도
- 문장별 WAV와 최종 병합 WAV 제공
- FastAPI 복제 작업 프록시 API와 음원 프록시
- 실제 복제 문장 입력, 진행률, 취소·재시도 UI
- 완료 음원의 Linked Player Dock 자동 연결
- Worker 전용 Python 3.10 CI job

### Changed

- Worker 프로세스 health와 모델 readiness를 별도로 표시
- Worker가 준비되지 않으면 복제 작업 생성 API를 503으로 차단
- 복제 프로필 생성 시 Worker readiness를 다시 확인
- CI 배포 조건에 Worker quality를 추가

### Verification

- API pytest 53개 통과
- Worker pytest 5개 통과
- Python compileall, 프로젝트 규칙, YAML·TS/TSX·CSS 정적 검사 통과
- 기본 Worker Uvicorn 시작과 health·not-ready 응답 확인
- FastAPI↔Worker HTTP 연결과 capability 상태 전달 확인
- 전체본 290개, 변경·추가 66개, 삭제 0개
- 패치 적용본과 전체본 파일 해시 일치
- 전체·패치 ZIP 무결성 통과

## 0.6.4 - 2026-07-31

### Changed

- 생성 훅과 보조 문장의 색상·굵기 계층 분리
- 보라·파랑 radial glow와 32px 오버랩 입력 카드 적용
- 첫 화면 입력 제한을 500자로 조정하고 실시간 카운터 노출
- 목소리 선택을 모바일 가로 스크롤 칩으로 변경
- 입력 상태에 따라 WAV 생성 CTA 문구와 활성 상태 변경
- Dock 터치 영역 확대와 active pill inner shadow 적용

### Added

- 숫자·날짜 자동 변환 토글과 실제 API `normalize_text` 계약
- 생성 후 문장별 완료 구간 리스트
- Dock 메뉴 클릭 시 페이지 상단 이동
- 텍스트 분할 UI 유틸리티와 Web·API 회귀 테스트

### Verification

- 프로젝트 규칙, FastAPI 50 tests, compileall 통과
- TypeScript·TSX 87개 파일 구문 검사와 CSS 파싱 통과
- npm registry 제한으로 정식 Web quality와 Ruff는 GitHub Actions에서 최종 확인
- 전체본과 패치 적용본 해시 일치 및 ZIP 무결성 통과

## 0.6.3 - 2026-07-31

### Changed

- Dock 플레이어를 주요 메뉴보다 위에 배치
- 기존 앱 배경과 이어지는 어두운 반투명 Dock 색상 톤 유지
- 음성이 준비된 경우에만 연계형 플레이어 렌더링
- 음원 유무에 따라 작업 화면의 하단 안전 여백을 자동 조절
- 모바일과 PC 모두 `플레이어 → 메뉴` 순서로 통일

### Added

- 메뉴 전용 Dock과 플레이어 포함 Dock 상태 클래스
- 플레이어 조건부 표시와 DOM 순서를 검증하는 Web 회귀 테스트
- 프로젝트 규칙에 조건부 플레이어·상단 배치·적응형 여백 계약 추가

### Verification

- 프로젝트 절대 규칙 검사 통과
- FastAPI 테스트 49개 통과
- Python compileall 통과
- 변경 TypeScript·TSX 정적 검사와 CSS 파싱 통과
- 패치 적용본과 전체본 260개 파일 완전 일치
- npm registry에 `@tailwindcss/vite`가 없어 정식 Web quality는 GitHub Actions에서 최종 확인

## 0.6.2 - 2026-07-31

### Fixed

- GitHub Pages에서 존재하지 않는 같은 Origin `/api/v1`을 기본 API로 호출하던 문제
- API 장애가 Demo WAV 전환에 가려져 엔진 연결 상태를 알기 어렵던 문제
- `.env` 없이 FastAPI를 실행할 때 GitHub Pages Origin이 CORS 기본값에서 빠지던 문제
- Python 3.10 지원 프로젝트가 Setup에서 Python 3.11 이상을 요구하던 문제
- CosyVoice Worker URL만 설정하고 실제 health를 확인하지 못하던 문제
- API health의 snake_case 응답과 상대 음원 URL을 웹에서 정확히 변환하지 않던 문제

### Added

- `/api/v1/connectivity` 통합 연결 진단 API
- Health·Setup·TTS·복제·통합 진단 5경로 검사와 응답 시간 표시
- 실제 TTS, CORS, 임시 음원 저장소, CosyVoice Worker 상태 보고
- 정적 배포, PC localhost, 모바일 LAN, 공개 HTTPS API 경고
- `npm run dev:api` FastAPI 실행 명령
- Worker `/health` 실제 probe와 상태 스냅샷
- CORS·연결 진단·Worker probe 회귀 테스트

### Verification

- FastAPI 테스트 49개 통과
- 실제 Uvicorn health·connectivity·CORS preflight 통과
- Linux 시스템 TTS WAV 생성·다운로드·RIFF 검사 통과
- Python compileall 통과
- TypeScript·TSX 구문 검사 통과
- npm registry 제한으로 정식 Web quality는 GitHub Actions에서 최종 확인

## 0.6.1 - 2026-07-31

### Fixed

- Compact 배너로 변경된 뒤에도 과거 짧은 문구를 찾던 `BrandMasthead` 테스트 수정
- 제목 마이크와 Voice Core 마이크의 안정적인 회귀 검사용 test id 복원
- JSDOM에서 `Blob.arrayBuffer()`가 없거나 덮어쓰기 어려운 환경의 WAV 테스트 수정
- 테스트 폴리필을 단순 prototype 대입 대신 `Object.defineProperty` 방식으로 강화

### Added

- 배너의 현재 한국어 설명 3종과 마이크 표식이 구현·테스트에 함께 존재하는지 규칙 검사
- Mock WAV 테스트가 FileReader fallback을 직접 보유하는지 규칙 검사

### Changed

- 웹·API·품질 보고서 버전을 `0.6.1`로 통일

### Verification

- FastAPI 테스트 44개 통과
- 프로젝트 절대 규칙 검사 통과
- Python compileall 통과
- npm registry 제한으로 로컬 Vitest 전체 실행은 불가하며 GitHub Actions가 최종 판정

## 0.6.0 - 2026-07-31

### Added

- 모바일 마이크 녹음과 WAV·MP3·M4A·WEBM·OGG 음성 파일 선택
- 길이, 무음 비율, 클리핑, RMS 음량의 브라우저 1차 품질 검사
- `녹음 → 확인·동의 → 목소리 만들기` 3단계 복제 준비 화면
- 권리 확인, AI 합성 고지, 사칭·사기 금지의 명시적 동의 게이트
- IndexedDB v3 `voiceProfiles` 로컬 우선 저장소
- FastAPI `/voice-clones/capabilities`, `/profiles`, 삭제 API
- UUID 샘플 저장, 25MB 제한, 7일 TTL, WAV 컨테이너·최소 길이 검사
- 별도 `CosyVoiceCloneEngine` Worker 연결 경계
- Dock 재생 대기열, 이전·다음, 전체·한 곡 반복, 재생 속도, 다운로드
- TTS 결과와 복제 원본 샘플의 단일 플레이어 orchestration
- Object URL 트랙 소유권과 제거 시 메모리 해제

### Changed

- 하단 Dock 메뉴를 만들기, 복제, 품질, 프로젝트 네 항목으로 변경
- 브라우저 FormData 요청은 `Content-Type`을 강제하지 않도록 HTTP 클라이언트 수정
- API와 웹 표시 버전을 `0.6.0`으로 통일
- 릴리스 산출물에서 `.sorion`, Python 캐시, 테스트 캐시를 제거

### Security

- 동의가 하나라도 빠진 복제 프로필 요청 차단
- 실제 Worker가 없을 때 복제 성공으로 표시하지 않음
- 원본 음성의 공개 조회 라우트 미제공
- 동의 철회 시 로컬과 API 임시 샘플 삭제 요청

### Verification

- FastAPI 테스트 44개 통과
- Python compileall 통과
- 외부 모듈 선언 기반 TypeScript strict 소스·테스트 검사 통과

## Archived releases

- 0.2.0–0.5.8: `docs/archive/CHANGELOG_0.2.0-0.5.8.md`
- 0.1.x: `docs/archive/CHANGELOG_0.1.x.md`
