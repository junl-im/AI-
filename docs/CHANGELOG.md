# CHANGELOG

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

## 0.1.5 - 2026-07-31

### Fixed

- 새 Vite 빌드가 GitHub Pages에 배포되지 않아 이전 쇼츠 스튜디오가 계속 열리던 문제 수정
- 프로젝트 사이트 주소 `/AI-/`에 맞게 Vite base, PWA 시작 경로, 아이콘, 탐색 fallback 수정
- 루트 절대 경로였던 favicon 경로를 Vite base 경로로 변경

### Added

- `main` Push와 수동 실행을 지원하는 GitHub Pages 전용 배포 워크플로
- `dist/` 아티팩트 업로드와 `github-pages` 환경 배포 단계
- 기존 서비스워커 캐시 정리와 즉시 활성화 설정
- GitHub Pages 최초 설정·캐시 복구 문서

## 0.1.2 - 2026-07-31

- GitHub Actions를 모든 브랜치 push에서 실행하도록 수정
- Actions 탭에서 수동 실행할 수 있도록 `workflow_dispatch` 추가
- package-lock이 없는 초기 저장소에서 실패할 수 있는 npm cache 설정 제거
- 워크플로 이름과 단계 이름을 명확하게 정리

모든 주요 변경은 이 문서에 기록한다.

## [0.1.0] — 2026-07-31

### Added

- SoriON AI 신규 프로젝트 생성
- React, Vite, TypeScript, Tailwind CSS, Motion 기반 모바일 PWA 구조
- FastAPI 기반 교체형 AI 엔진 레지스트리
- 개발용 Mock TTS 요청 흐름
- IndexedDB 로컬 프로젝트 저장
- 선택형 Firebase Google 로그인 어댑터
- 소스 500줄 제한, SVG 금지, 비밀키 검사 스크립트
- GitHub Actions 품질 검사
- 제품·기술·보안·인수인계 문서 체계

### Notes

기존 프로젝트 코드는 사용하지 않았다. 실제 음성 엔진과 음원 생성은 Phase 2 범위다.

## 0.1.1 - 2026-07-31

### Fixed
- 웹앱의 `index.html`, `src`, `public`, Vite 설정을 저장소 루트로 이동했다.
- 압축을 해제한 직후 `index.html`을 확인할 수 있도록 구조를 단순화했다.
- Firebase Hosting 배포 경로를 `dist`로 수정했다.
- 루트에서 `npm install`, `npm run dev`, `npm run build`를 실행하도록 문서를 수정했다.

## 0.1.3 - 2026-07-31

### Added

- 기존 프로젝트의 상단 시각 문법만 새 코드로 재해석한 브랜드 마스트헤드 추가
- `BUILD`, `모바일 · PC 호환`, `DESIGNED BY 곰같은여우` 메타 정보 추가
- 공식 대문 네이밍을 `곰같은여우 SoriON AI`로 통일
- 모바일에서는 핵심 브랜드와 작업 흐름, PC에서는 Voice Core 콘솔이 보이는 반응형 구성
- 브랜드 마스트헤드 렌더링 테스트 추가

### Changed

- 브라우저 제목과 PWA 앱 이름을 `곰같은여우 SoriON AI`로 변경
- PWA 테마 색상을 새 상단 디자인의 네이비 계열로 변경
- 홈 본문을 브랜드 소개가 아닌 실제 음성 생성 작업 중심 문구로 정리

## 0.1.4 - 2026-07-31

### Added

- 프로젝트 루트의 영구 전달 규칙 `DELIVERY_RULES.md`
- 다음 개발 범위를 보존하는 `docs/NEXT_UPDATE.md`
- 전체 통파일 ZIP과 덮어쓰기용 패치 ZIP의 표준 이름·구조·체크섬 규칙
- 패치 적용 기준 버전과 변경 파일 목록을 기록하는 패치 매니페스트 규칙

### Changed

- 프로젝트 규칙 검사에서 HANDOVER, CHANGELOG, NEXT_UPDATE와 현재 버전 기록을 필수 확인
- Pull Request 템플릿에 전달 문서와 릴리스 산출물 확인 항목 추가
- RELEASE와 CODING_RULE 문서에 전달·인수인계 차단 조건 추가
- 웹과 API 버전을 `0.1.4`로 갱신

## 0.5.8 - 2026-07-31

- Compact 10-second subtitle brand banner.
- Contained lightning waveform in Voice Core.
- Desktop two-frame workspace and mobile single-frame layout.
- Settings moved from Dock to top meta bar.
- Fixed linked-player Dock based on selectively re-authored FoxBear playback concepts.
