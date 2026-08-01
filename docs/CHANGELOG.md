# CHANGELOG

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

## 0.5.8 - 2026-07-31

- Compact 10-second subtitle brand banner.
- Contained lightning waveform in Voice Core.
- Desktop two-frame workspace and mobile single-frame layout.
- Settings moved from Dock to top meta bar.
- Fixed linked-player Dock based on selectively re-authored FoxBear playback concepts.

## 0.5.7 - 2026-07-31

### Fixed

- Python 3.10에서 `asyncio.wait_for()`의 `asyncio.TimeoutError`가 그대로 노출되던 문제 수정
- 타임아웃 작업 취소 후 내부 Task가 남을 수 있는 경계를 명시적으로 정리

### Added

- 타임아웃 후 `failed / generation-timeout` 상태 저장 회귀 테스트
- 종료 작업이 작업 레지스트리에서 제거되는지 확인하는 회귀 테스트
- Python 3.10용 `asyncio.TimeoutError` 처리 구문 정적 호환성 검사
- 프로젝트 규칙 검사에 비동기 타임아웃 처리 계약 추가

### Changed

- 웹과 API 버전을 `0.5.7`로 갱신

### Notes

- Python 3.10에서는 `asyncio.TimeoutError`와 내장 `TimeoutError`가 별도 클래스다.
- Python 3.11 이상에서는 두 예외가 호환되므로 로컬 최신 Python에서만 검사하면 이 회귀를 놓칠 수 있다.

## 0.5.6 - 2026-07-31

### Fixed

- Ruff가 한글을 두 칸으로 계산해 E501로 보고한 시스템 음성·진단 코드 6곳을 실제 표시 폭 100칸 이하로 분리
- Setup 진단의 Python 설치 안내를 프로젝트 지원 범위인 Python 3.10 이상으로 수정

### Added

- 프로젝트 규칙 검사에 Ruff와 동일한 동아시아 문자 표시 폭 계산 추가
- API 회귀 테스트에 앱·테스트 전체 Python 줄의 Ruff 표시 폭 검사 추가

### Changed

- Python 100자 검사를 단순 문자열 길이가 아니라 한글·CJK·전각 문자·이모지 표시 폭 기준으로 강화
- 웹과 API 버전을 `0.5.6`으로 갱신

### Notes

- 로컬 검사와 GitHub Ruff가 서로 다른 결과를 내던 원인을 제거했다.
- 실제 Ruff 바이너리는 GitHub Actions에서 최종 실행되며, 로컬에서는 같은 표시 폭 계약과 33개 API 테스트를 검증했다.

## 0.5.5 - 2026-07-31

### Fixed

- Python 3.10 API 품질 검사에서 발생한 E501 100자 초과 오류를 전부 수정
- `app/main.py`와 Python 호환성 테스트의 Ruff I001 import 정렬 오류 수정

### Added

- Python 소스 100자 제한을 로컬 프로젝트 규칙 검사에 추가
- `GET /api/v1/engines/strategy` 엔진 전략 API 추가
- `docs/ENGINE_STRATEGY.md`에 Python 백엔드 이유와 엔진 선정 기준 기록

### Changed

- 주력 TTS·제로샷 복제 엔진 방향을 Fun-CosyVoice 3로 결정
- GPT-SoVITS를 복제 전문가용 보조 엔진으로 분류
- MeloTTS와 운영체제 음성을 로컬 대체 엔진으로 유지
- Fish Audio S2를 상업 라이선스 계약 전 평가 전용으로 분류
- 웹과 API 버전을 `0.5.5`로 갱신

### Notes

- React·TypeScript는 사용자 화면을 담당하고 Python은 AI 모델 실행 서버에만 사용한다.
- 실제 CosyVoice 3 모델 연결은 다음 기능 버전에서 별도 worker와 함께 구현한다.

## 0.5.4 - 2026-07-31

### Fixed

- GitHub Actions가 존재하지 않는 `astral-sh/setup-uv@v8` 태그를 해석하지 못해 API Job이 시작 전에 종료되던 문제 수정

### Changed

- setup-uv를 Astral 공식 문서의 불변 커밋 `08807647e7069bb48b6ef5acd8ec9567f424441b`로 고정 (`v8.1.0`)
- 액션이 설치하는 uv 실행 파일을 `0.11.32`로 고정해 CI 재현성 강화
- `setup-python@v6`가 Python 3.10을 준비하고 setup-uv는 uv 설치와 API 캐시만 담당하도록 역할 분리
- 프로젝트 규칙 검사에서 `setup-uv@v8` 같은 부동 태그를 금지하고 공식 SHA·uv 버전 누락을 차단
- 웹과 API 버전을 `0.5.4`로 갱신

### Notes

- 액션 버전은 실제 존재 여부를 공식 저장소·문서에서 확인하고, 보안과 재현성을 위해 가능한 경우 커밋 SHA로 고정한다.
- 이번 수정은 API 코드 오류가 아니라 Job 준비 단계의 Action 참조 오류를 해결한다.

## 0.5.3 - 2026-07-31

### Fixed

- JSDOM 환경에서 `Blob.arrayBuffer()`가 제공되지 않아 Mock WAV 테스트가 중단되던 문제를 `FileReader` 기반 테스트 폴리필로 수정
- `HomePage`의 섹션과 textarea가 같은 접근성 이름을 가져 전역 쿼리가 중복 요소를 찾던 문제를 현재 렌더 컨테이너와 `textbox` 역할 쿼리로 수정
- Python 3.10에서 `timezone.utc`를 유지해야 하는 코드가 Ruff `UP017`에 의해 Python 3.11 전용 `datetime.UTC`로 변경 요구되던 충돌을 명시적으로 제외
- API CI가 저장소 루트와 API 하위 프로젝트 경로를 혼용하던 실행 구조를 `services/api` 작업 디렉터리 기준으로 통일

### Changed

- `actions/checkout`, `actions/setup-node`, `actions/setup-python`을 Node.js 24 기반 v6로 갱신
- `astral-sh/setup-uv`를 v8로 갱신하고 Python 3.10·API 작업 디렉터리를 액션 입력으로 고정
- Pages 액션을 `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`로 갱신
- Web CI 런타임을 Node.js 24로 변경하고 자동 npm 캐시를 명시적으로 비활성화
- 테스트 종료 시 Testing Library cleanup 후 `document.body`를 초기화해 테스트 간 DOM 오염을 이중 차단
- 프로젝트 규칙 검사에 구형 Node.js 20 액션, Blob 폴리필, Python 3.10 Ruff 호환성 회귀 검사를 추가
- 웹과 API 버전을 `0.5.3`으로 갱신

### Notes

- GitHub Pages 액션도 Node.js 24 대응 stable major로 갱신하고 워크플로 전체에 Node.js 24 강제 환경 변수를 유지했다.
- 로컬 환경의 외부 패키지 다운로드 제한으로 정식 Vitest와 Python 3.10 uv 환경 실행은 불가능했으며, GitHub Actions 성공 여부가 최종 확인 기준이다.

## 0.5.2 - 2026-07-31

### Fixed

- Python 3.10에서 import할 수 없는 `datetime.UTC` 사용을 `timezone.utc`로 교체
- Vitest 전역 API 비활성 환경에서 테스트 DOM이 누적되던 문제를 명시적 `afterEach(cleanup)`으로 수정
- 브랜드 배너 테스트가 두 번째 테스트에서 중복 DOM 때문에 실패하던 문제 수정
- 기능 브랜치의 열린 Pull Request에서 `push`와 `pull_request`가 같은 커밋을 두 번 검사하던 트리거 정리

### Changed

- Web 품질, API 품질, GitHub Pages 배포를 `.github/workflows/ci.yml` 하나로 통합
- `push` 자동 실행 범위를 `main`으로 제한하고 `develop`·기능 브랜치는 PR 이벤트로 검사
- API CI를 지원 최소 버전인 Python 3.10으로 명시하고 Ruff 검사를 추가
- Ruff 대상 버전을 `py310`으로 변경
- 프로젝트 규칙 검사에 단일 워크플로, Python 3.10 UTC 호환성, 테스트 cleanup 검사를 추가
- 웹과 API 버전을 `0.5.2`로 갱신

### Removed

- 중복 Pages 실행을 만들던 `.github/workflows/deploy-pages.yml`

### Notes

- GitHub 저장소의 `Settings → Pages → Source`는 반드시 `GitHub Actions`여야 한다.
- `Deploy from a branch`가 남아 있으면 GitHub가 생성한 `pages-build-deployment`가 별도로 실행될 수 있다.

## 0.5.1 - 2026-07-31

### Added

- `곰같은여우 SoriON AI`와 한국어 핵심 문장 3종이 순환하는 배너형 페이드 메시지
- `SoriON AI`의 `I`를 대신하는 CSS 마이크 로고 마크
- PC Voice Core의 CSS 스튜디오 마이크와 호흡형 광원
- 브랜드 문구와 마이크 요소 렌더링 회귀 테스트

### Changed

- 모바일·PC 마스트헤드의 세로 높이와 내부 여백을 축소
- 정적인 대형 대문을 같은 공간에서 메시지가 교체되는 슬라이드형 배너로 변경
- 마스트헤드 스타일을 `src/styles/masthead.css`로 분리
- 모션 감소 환경에서는 첫 브랜드 화면만 정적으로 노출
- 웹과 API 버전을 `0.5.1`로 갱신

### Notes

- 기능 흐름과 데이터 계약은 `0.5.0`과 동일합니다.
- SVG를 사용하지 않고 HTML 요소와 CSS만으로 마이크를 표현합니다.

## 0.5.0 - 2026-07-31

### Added

- 모바일 설정 화면의 3단계 Voice API 연결·준비 상태 마법사
- Python, 임시 음원 폴더, 실제 한국어 엔진, FFmpeg, CORS 진단 API
- TTS 작업 진행률 스냅샷과 `GET /tts/jobs/{job_id}` 조회 API
- 한국어 정규화, 구간 생성, WAV 병합 단계별 진행률과 현재 구간 표시
- 품질 별점과 발음 메모의 IndexedDB 영구 저장
- 품질 평가 JSON·CSV 보고서 내보내기
- 공통 IndexedDB 스키마 버전 2와 `qualityReviews` 저장소
- 진행률, Setup 상태, 보고서 변환 회귀 테스트

### Changed

- Voice API 주소를 기기별로 저장하고 주소 변경 시 엔진 목록을 자동 갱신
- 생성 화면의 단순 회전 표시를 실제 퍼센트·구간 진행 막대로 교체
- 작업 완료·실패·취소 스냅샷을 최근 기록에 유지
- 웹과 API 버전을 `0.5.0`으로 갱신

### Notes

- Setup Wizard는 설치 상태를 안내하지만 MeloTTS 모델을 자동 다운로드하지 않습니다.
- 구간별 실패 재시도와 모델 worker 프로세스 분리는 아직 포함하지 않습니다.
- 품질 보고서는 사용자가 직접 다운로드할 때만 파일로 만들어집니다.

## 0.4.0 - 2026-07-31

### Added

- Python·운영체제·메모리·엔진 준비 상태를 표시하는 Korean Voice Quality Lab
- MeloTTS 패키지 탐지와 모델 지연 로딩 진단
- 한국어 숫자, 날짜, 시각, 금액, 퍼센트, 단위, 영문 약어 전처리
- 긴 문장 자동 분할과 같은 형식 PCM WAV 병합
- 생성 시간, 음원 길이, 파일 크기, 구간 수, RTF 지표
- 최대 두 엔진의 A/B 생성과 모바일 재생
- 브라우저 세션용 별점과 발음 메모
- 품질 진단·평가 문장·전처리·비교 API
- 전처리, 분할, WAV 병합, 장문 파이프라인, 품질 API 테스트

### Changed

- 엔진 계약에 속도·피치 지원 여부 추가
- 엔진이 지원하지 않는 감정·피치 설정을 UI에서 비활성화
- 일반 TTS 생성도 한국어 전처리와 장문 파이프라인을 통과하도록 변경
- 결과 카드에 실제 읽은 문장과 품질 지표 표시
- 하단 메뉴에 `품질` 탭 추가
- 웹과 API 버전을 `0.4.0`으로 갱신

### Notes

- WAV 병합은 같은 채널·샘플 폭·샘플레이트의 비압축 PCM만 지원합니다.
- 별점과 메모는 아직 영구 저장하지 않습니다.
- GitHub Pages만 실행하면 품질 진단과 A/B 생성 API를 사용할 수 없습니다.

## 0.3.0 - 2026-07-31

### Added

- 선택 설치형 MeloTTS 한국어 AI 엔진 어댑터
- Windows System.Speech, macOS say, Linux eSpeak 기반 Local TTS 어댑터
- 준비된 실제 엔진을 우선 선택하는 `auto` 엔진 규칙
- 엔진 모드, 공급자, 준비 상태, 실패 이유 API
- UUID 기반 작업 취소, 중복 방지, 동시 실행 제한, 75초 제한 시간
- UUID 파일명과 30분 TTL을 사용하는 임시 WAV 저장소
- 임시 WAV의 경로 이동 차단과 `private, no-store` 제공
- 모바일 생성 중 취소 버튼과 엔진 상태 카드
- 한국어 TTS 평가 문장 10종
- MeloTTS 및 운영체제별 Local TTS 설치 문서

### Changed

- 결과를 `AI AUDIO`, `LOCAL TTS`, `DEMO WAV`로 구분
- API 요청 제한 시간을 실제 엔진용 90초로 조정
- Mock 미연결 fallback과 사용자 취소를 별도 처리
- 웹과 API 버전을 `0.3.0`으로 갱신

### Notes

- MeloTTS 모델과 대형 의존성은 ZIP과 Git 저장소에 포함하지 않습니다.
- Local TTS는 실제 음성이지만 AI 모델 음성은 아닙니다.
- GitHub Pages만 사용할 때는 Python 엔진이 실행되지 않아 Demo WAV가 사용됩니다.

## 0.2.0 - 2026-07-31

### Added

- 모바일 중심의 첫 Voice Workspace
- 예시 문장을 포함한 한국어 텍스트 작성 영역
- `소리`, `온`, `담` 한국어 음성 프리셋 카드
- 자연스러움, 밝음, 차분함, 광고톤, 슬픔, 강함 감정 프리셋
- 숨김형 Advanced 속도·피치 설정
- 준비, 요청, 렌더링, 완료, 실패, 재시도 상태 UI
- API 미연결 환경에서 기능을 확인할 수 있는 브라우저 PCM WAV 데모 생성
- 오디오 플레이어, WAV 다운로드, 안전한 한국어 파일명 규칙
- WAV RIFF 헤더, 파일명, 음성 선택, 홈 워크스페이스 테스트

### Changed

- HomePage를 단일 대형 폼에서 기능별 Voice 컴포넌트로 분리
- 프로젝트 메타데이터에 엔진 ID, 음원 출처, 출력 형식 추가
- 설정과 프로젝트 화면에서 Mock·Demo·실제 AI 상태를 구분
- 웹과 API 버전을 `0.2.0`으로 갱신

### Notes

- 브라우저 데모 WAV는 실제 음성이 아닌 기능 검증용 합성 톤이다.
- 실제 엔진이 `audio_url`을 반환하면 동일한 결과 플레이어에서 API 음원을 사용한다.


## Earlier releases

- [0.1.x 초기 변경 이력](archive/CHANGELOG_0.1.x.md)
