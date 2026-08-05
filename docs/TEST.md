# Heartbeat 6.8.3 CI 품질·승인 운영자 게이트 검증

- GitHub Actions Ruff I001 대상 3개 import block 재정렬
- Web unused variable, no-control-regex, React Hooks 참조 안정성 오류 4건 제거
- loopback 무토큰 허용과 원격 무토큰·오류 토큰 차단
- 32자 미만 서버 운영자 토큰을 안전하지 않은 설정으로 거부
- 승인 preview·apply·history·rollback 전체 인증 적용과 거부 감사 로그
- apply·rollback 동일 잠금 재검사, 적용 직전 WAV·manifest 변경 차단
- 승인 이후 WAV 변경 시 과거 manifest rollback 거부
- manifest 원자 교체와 JSONL append flush·fsync
- Repository preflight 24개, API pytest 171개, Worker pytest 14개 통과
- TS/TSX transpile 구문 182개와 Python compileall 통과
- 전체 Ruff·ESLint·semantic typecheck·Vitest·Vite build는 GitHub Actions 최종 판정

# Heartbeat 6.8.2 서명 승인·benchmark 대시보드 검증

- 현재 WAV·manifest·검수 묶음 checksum 재계산과 승인 diff preview
- preview 뒤 WAV 또는 manifest 변경 시 stale apply 거부
- manifest v3 approval ID·signed payload digest·선택적 HMAC-SHA256 생성과 검증
- signing secret 미설정 시 unsigned 상태 유지, 잘못된 key·signature 차단
- 승인 전후 manifest snapshot 감사 기록, 현재 manifest 변경 뒤 위험한 rollback 거부
- Engine Doctor와 실제 CosyVoice 합성 경로의 승인·서명 상태 일치
- Worker model manifest SHA-256 digest 진단과 성공·실패 자동 telemetry 저장
- 자동 Worker telemetry와 10·30·60분 실기기 soak의 저장소·API·UI 분리
- 모델 digest·GPU·프리셋별 표본 수, 실패율, first audio·RTF·handoff P50/P95 집계
- Repository preflight 23개, API pytest 164개, Worker pytest 14개 통과
- TS/TSX transpile 구문 182개와 Python compileall 통과
- 전체 npm lint·semantic typecheck·Vitest·Vite build는 설치 의존성 부재와 이전 내부 registry 제약으로 GitHub Actions 최종 판정

# Heartbeat 6.8.1 검수 동기화·화자 텔레메트리 검증

- manifest v2와 승인 당시 `human_review.audio_sha256` 계약 검사
- WAV 교체·checksum 변경 시 승인 검수를 `stale`로 전환하고 CosyVoice 사용 차단
- 동의·권리 만료 30일 전 경고와 만료 후 차단
- 검수 묶음 schema, canonical payload SHA-256, 변조 거부와 구형 품질 JSON migration
- 가져오기 시 로컬 평가만 병합하고 manifest 승인 상태·검수자·checksum 자동 변경 금지
- Windows System.Speech와 MeloTTS 실제 화자 선택 진단 계약
- 모델 digest·가속 장치·GPU·프리셋별 benchmark 그룹과 final handoff P95
- Repository preflight 22개, API pytest 161개, Worker pytest 14개 통과
- TS/TSX transpile 구문 179개, 검수 묶음 runtime smoke와 Python compileall 통과
- 전체 npm lint·semantic typecheck·Vitest·Vite build는 내부 registry의 `zustand@5.0.8` 404로 GitHub Actions 최종 판정

# Heartbeat 6.8.0 프리셋 증거 검증

- 5개 manifest schema와 프리셋 ID·이름·성별·WAV 파일명 일치 검사
- 동의 confirmed, `tts-inference` 권리, 사람 approved, 64자리 SHA-256과 실제 파일 크기 검사
- 실제 WAV checksum 불일치와 같은 WAV의 여러 인물 프리셋 중복 등록 차단
- Engine Doctor의 WAV/manifest/최종 사용 가능 집계와 프리셋별 증거 진단 계약
- CosyVoice 합성 경로에서 manifest 누락·미승인·중복 WAV 우회 차단
- Browser Speech 5종 실제 배정 진단과 후보 선택 근거 검사
- Quality Lab 프리셋별 A/B, IndexedDB 키 분리, CSV 프리셋 메타데이터 검사
- Repository preflight 21개 통과
- API pytest 158개 통과, Worker pytest 14개 통과, CosyVoice 전용 회귀 8개 통과
- TS/TSX transpile 구문 177개와 Python compileall 통과
- 전체 npm lint·semantic typecheck·Vitest·Vite build는 내부 registry의 `zustand@5.0.8` 404로 GitHub Actions 최종 판정

# Heartbeat 6.7.1 음성 프리셋 정합성 추가 검증

- 알 수 없는 프리셋 ID를 첫 여성 프리셋으로 대체하지 않는지 검사
- Browser Speech의 여성·남성·중성 후보 분리와 반대 성별 차단
- 남성 후보 1개를 도윤·준호·민준에 순환 중복 배정하지 않는지 검사
- CosyVoice 전용 WAV 누락 시 기본 기준 WAV로 대체하지 않는지 검사
- MeloTTS 단일 `KR` 화자 차단과 다중 남성 화자 순번 배정
- Windows/macOS/eSpeak의 성별·프리셋별 선택 계약
- 프리셋 호환성 오류가 엔진 circuit breaker를 열지 않는지 검사
- API pytest 154개, Worker pytest 14개, 핵심 회귀 28개, Python compileall
- 전체 npm lint·typecheck·Vitest·Vite build는 registry 404로 GitHub Actions 최종 판정

# Heartbeat 6.7 추가 검증

- npm lock integrity와 Evidence Intake/Local Bundle을 포함한 repository preflight 20개
- field evidence v2 preview·import·list·동일 bundle·동일 local record 차단
- Web quality run report 7 phase, package lock SHA, evidence/report SHA 검증과 변조 차단
- Evidence Intake 원본 checksum 파일 원자 저장과 JSONL index
- 로컬 ZIP PK signature, manifest 파일, 파일별 SHA-256, 지원 확장자·용량·취소·진행률
- 전체 API·Worker pytest, Python compileall, TS/TSX transpile 구문 검사

# TEST

## 계층

1. 단위 테스트: 숫자 읽기, 정규화, 문장 분할, WAV 병합
2. 파이프라인 테스트: 장문 분할, 자식 WAV 정리, 결과 지표
3. 어댑터 테스트: 주입된 Melo 모델, 설치된 eSpeak 실제 WAV
4. API 계약 테스트: 엔진 목록, 진단, 전처리, A/B 비교, 취소
5. 컴포넌트 테스트: 엔진 상태, 생성, 품질 연구소, 결과 표시
6. 실기기: Android Chrome, iOS Safari, 설치형 PWA

## 명령

```bash
npm run quality:rules
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:api
npm run test:worker
```

## 0.5.0 추가 검사

- 큰 정수의 한국어 읽기
- 날짜, 금액, 퍼센트, 영문 약어 전처리
- 40~500자 분할 기준 검증
- 같은 PCM 형식 WAV 병합과 구간 무음
- 장문 파이프라인의 자식 WAV 삭제
- 처리 시간, 파일 크기, RTF 응답
- 품질 진단의 Python·메모리·엔진 상태
- 평가 문장 API
- Mock 비교가 음원 없이도 안전한 결과를 반환하는지 확인
- 지원하지 않는 감정·피치 UI 비활성화

## 한국어 평가 세트

`docs/evaluation/KOREAN_TTS_SENTENCES.json`에 기본, 숫자, 날짜, 시각, 금액, 단위, 영문, 높임말, 긴 문장 분할 항목을 관리합니다.

## 배포 차단 기준

- 테스트 실패
- 1,200줄 안전 상한 위반. 800줄 초과는 비차단 분리 권고
- AI, Local TTS, Demo 표시 혼동
- 전처리 과정에서 원문 일부가 유실되는 문제
- 서로 다른 WAV 형식을 강제로 병합하는 문제
- 자식 임시 WAV가 병합 후 남는 문제
- 저장 루트 밖 파일 접근
- 사용자 문장 또는 비밀키가 로그·저장소에 포함됨

## 0.5.0 추가 검사

- JobManager 완료·취소 진행률 스냅샷
- 완료 후 작업 상태 조회와 알 수 없는 작업 404
- 장문 정규화·구간 생성·병합 진행 순서
- Setup API 필수·선택 진단 항목
- Voice API 주소 `/api/v1` 정규화
- 품질 JSON 버전과 CSV 한국어·따옴표 이스케이프
- IndexedDB v1 프로젝트 사용자의 v2 스키마 업그레이드 수동 확인

## 0.5.1 브랜드 배너 검사

- 접근 가능한 제목 이름이 `곰같은여우 SoriON AI`인지 확인
- 한국어 순환 문구 3종이 DOM에 존재하는지 확인
- 로고 마이크와 Voice Core 마이크 요소가 존재하는지 확인
- 360px, 390px, 430px에서 배너가 작업 영역을 과도하게 밀어내지 않는지 수동 확인
- 760px 이상에서 Voice Core가 표시되고 그 이하에서는 숨겨지는지 확인
- 모션 감소 환경에서 첫 슬라이드만 정적으로 표시되는지 확인
- SVG 파일과 SVG 아이콘이 새로 추가되지 않았는지 확인

## 0.5.2 CI 안정성 검사

- `.github/workflows`의 활성 YAML이 `ci.yml` 하나인지 확인
- 기능 브랜치 PR 갱신 시 동일 커밋의 Push·PR 실행이 중복되지 않는지 확인
- `main` Push 한 번에서 Web quality, API quality, Deploy GitHub Pages가 같은 실행 안에 표시되는지 확인
- API CI가 Python 3.10으로 실행되는지 확인
- API 소스에 `from datetime import UTC` 또는 `datetime.UTC`가 없는지 확인
- 같은 컴포넌트를 여러 테스트에서 렌더링해도 이전 DOM이 남지 않는지 확인
- GitHub Pages Source가 `GitHub Actions`인지 확인

## 0.5.4 setup-uv 액션 고정 검사

- `.github/workflows/ci.yml`에 `astral-sh/setup-uv@08807647e7069bb48b6ef5acd8ec9567f424441b`가 있는지 확인
- setup-uv 입력에 `version: '0.11.32'`가 있는지 확인
- `astral-sh/setup-uv@v8` 같은 부동 태그가 다시 들어오면 규칙 검사가 실패하는지 확인
- API Job이 Python 3.10 설정 뒤 uv 설치·동기화·Ruff·pytest 순서로 실행되는지 확인

## 0.5.3 CI 테스트 호환성 검사

- JSDOM의 `Blob`에 `arrayBuffer()`가 없어도 WAV RIFF 헤더 테스트가 실행되는지 확인
- `FileReader` 기반 폴리필이 `ArrayBuffer`를 반환하고 읽기 실패를 reject하는지 확인
- HomePage 테스트가 전체 document가 아니라 현재 render 컨테이너만 검색하는지 확인
- `읽을 문장` 입력을 접근성 이름과 `textbox` 역할 조합으로 유일하게 찾는지 확인
- 매 테스트 후 Testing Library cleanup과 `document.body` 초기화가 실행되는지 확인
- API Ruff가 `py310`을 유지하고 `UP017`만 제외하는지 확인
- `timezone.utc`가 Python 3.10 호환 코드로 유지되는지 확인
- API Job이 `services/api`에서 Python 3.10으로 Ruff와 pytest를 실행하는지 확인
- checkout·setup-node·setup-uv에 Node.js 20 세대 major가 남지 않았는지 확인


## 0.5.5 API Lint·엔진 전략 검사

- `services/api/app`과 `services/api/tests`의 Python 줄이 100자를 넘지 않는지 확인
- `app/main.py` import 블록이 Ruff 기준으로 정렬됐는지 확인
- `tests/test_python_compatibility.py` import 뒤 불필요한 빈 줄이 없는지 확인
- `/api/v1/engines/strategy`가 CosyVoice 3를 주력 TTS·복제 엔진으로 반환하는지 확인
- GPT-SoVITS가 복제 전문가용 보조 엔진으로 표시되는지 확인
- Fish Audio S2가 평가 전용으로 표시되는지 확인
- `docs/ENGINE_STRATEGY.md`에 Python 백엔드 이유와 라이선스 주의사항이 있는지 확인

## 0.5.6 Ruff 한글 표시 폭 검사

- Ruff E501이 사용하는 동아시아 전각·광각 문자의 2칸 표시 폭을 로컬 규칙 검사에 반영
- `system_tts.py`, `engine_diagnostics.py`, `setup_diagnostics.py`의 보고된 6개 줄이 100칸 이하인지 확인
- `services/api/app`과 `services/api/tests` 전체 Python 줄의 Ruff 표시 폭이 100칸 이하인지 pytest로 확인
- 단순 `line.length` 검사가 한글 긴 줄을 놓치지 않는지 회귀 확인
- Python 3.10 호환성, import 정렬, API 전체 테스트를 함께 확인


## 0.5.7 Python 3.10 비동기 타임아웃 검사

- `JobManager`는 `asyncio.wait_for()`에서 발생한 `asyncio.TimeoutError`를 잡아야 한다.
- 외부 호출자에게는 `GenerationTimeoutError`만 전달해야 한다.
- 작업 상태는 `failed`, 오류 코드는 `generation-timeout`이어야 한다.
- 타임아웃 이후 같은 작업은 활성 작업 레지스트리에 남아 있지 않아야 한다.
- Python 3.10 호환성 검사는 `except asyncio.TimeoutError` 구문을 정적으로 확인한다.


## 0.6.0 추가 검사

### Web

- 정상 10초 샘플과 짧고 클리핑된 샘플의 품질 판정
- Player store의 대기열 추가와 현재 트랙 선택
- Object URL 소유 트랙 삭제 시 URL 해제
- FormData 요청에서 브라우저가 multipart boundary를 설정하도록 Content-Type 강제 금지

### API

- 복제 capability 응답
- 동의 누락 차단
- 품질 차단 샘플 거부
- 유효한 WAV 프로필 준비와 삭제
- 손상 WAV와 5초 미만 WAV 거부

현재 API 테스트 기준은 40개 이상 통과다.


## 0.6.1 Web 배너·Blob 회귀 검사

- BrandMasthead 테스트가 현재 10초 전환 설명 3종의 완전한 문구를 검사하는지 확인
- 제목 마이크와 Voice Core 마이크에 안정적인 test id가 있는지 확인
- JSDOM Blob에 `arrayBuffer`가 없을 때 FileReader fallback으로 RIFF/WAVE 헤더를 읽는지 확인
- 전역 setup의 Blob 폴리필이 prototype 단순 대입이 아니라 `Object.defineProperty`를 사용하는지 확인
- UI 문구 변경 시 구현과 테스트 계약을 함께 갱신하지 않으면 규칙 검사가 실패하는지 확인

## 0.6.2 API·엔진 연결 회귀 검사

- `/api/v1/connectivity`가 API, TTS, CORS, 저장소, 복제 Worker 상태를 반환하는지 검사
- 기본 CORS가 `https://junl-im.github.io` preflight를 허용하는지 검사
- Setup의 최소 Python 표시가 3.10과 일치하는지 검사
- CosyVoice Worker `/health` 성공과 URL 미설정 상태를 각각 검사
- 웹 HTTP client가 저장된 API Origin으로 상대 음원 URL을 변환하는지 검사
- 공개 정적 배포에서 API 미설정 상태를 명확히 표시하는지 Web quality에서 검사


## 0.6.4 적응형 Dock 회귀 검사

- 빈 대기열에서는 `연계형 오디오 플레이어` 영역이 없어야 한다.
- 완성 음원을 enqueue하면 플레이어가 나타나야 한다.
- DOM 순서는 플레이어가 주요 메뉴보다 앞이어야 한다.
- Dock 상태 클래스는 `soa-dock--nav-only`와 `soa-dock--has-player`를 구분한다.
- AppShell은 플레이어 유무에 따라 하단 안전 여백 클래스를 전환한다.

## 0.6.4 Premium Creation UX 회귀 검사

- 빈 입력에서 CTA가 비활성화되고 `변환할 문장을 입력하세요`를 표시한다.
- 문장 입력 후 CTA가 `WAV로 생성하기 (약 3초)`로 변경된다.
- 입력창은 500자 제한과 실시간 카운터를 제공한다.
- 숫자·날짜 자동 변환 토글은 API `normalize_text`로 전달된다.
- 생성 결과는 문장별 완료 구간 리스트를 제공한다.
- Dock 메뉴 클릭은 현재 스크롤 위치와 관계없이 화면 상단으로 이동한다.
- API pipeline은 `normalize_text=false`에서 날짜 표기를 원문으로 유지한다.


## 0.7.0 Worker·복제 실행 회귀 검사

- `/health` 성공과 `/ready` not-ready 상태를 별도로 검사한다.
- adapter가 준비되지 않으면 작업 생성이 503인지 검사한다.
- 문장 2개 작업이 구간 WAV 2개와 최종 RIFF WAV를 만드는지 검사한다.
- 취소 후 완료되지 않은 구간만 재시도해 완료되는지 검사한다.
- FastAPI가 작업 생성·상태·취소·재시도·최종·구간 음원을 프록시하는지 검사한다.
- Worker가 없는 UI에서 실제 실행 버튼이 비활성화되는지 검사한다.
- 진행 중 UI가 문장별 상태와 취소 버튼을 표시하는지 검사한다.
- 완료 시 Linked Player Dock 연결 안내를 표시하는지 검사한다.
- CI는 API와 별도로 Worker Python 3.10 Ruff·pytest를 실행한다.


## 0.7.1 인증·제한·복구 회귀 검사

- API Worker 서명 헤더 생성과 로컬 비활성 모드
- Worker 유효 서명 수락과 만료 서명 거부
- 인증이 켜진 Worker의 무서명 요청 401
- 서명된 multipart 복제 작업 생성 202
- API·Worker 고정 창 요청 제한
- Worker health 공개와 readiness 인증 분리
- SSE revision id와 Last-Event-ID 전달 계약
- 종료 작업 TTL 정리 계약


## 0.7.2 CI zero-error 회귀 검사

- Worker `security.py`의 `Mapping`은 `collections.abc`에서 가져온다.
- Worker `runtime.py`의 callable 타입은 `collections.abc`에서 가져온다.
- Worker adapter factory는 상수 `getattr` 대신 `module.create_runtime`으로 접근한다.
- FastAPI upload/form 인자는 `Annotated` 메타데이터를 사용한다.
- API Worker 테스트에 사용하지 않는 `json` import가 없다.
- `splitTextForUi`는 기본 길이에서도 마침표 문장 경계를 유지한다.
- 복제 polling effect는 `activeJobId`, `activeJobStatus` 의존성을 사용한다.

## 0.7.3 인수인계 메모리 회귀 검사

- HANDOVER에 임시채팅 영구 메모리 상태가 있어야 한다.
- 제품 목표, 사용자 UX 결정, 아키텍처, 제한, 전달 규칙, 다음 목표가 있어야 한다.
- HANDOVER는 800줄부터 archive 분리를 권고하고 1,200줄 안전 상한을 초과하지 않아야 한다.
- DELIVERY_RULES에 임시채팅 인수인계 메모리 절대 규칙이 있어야 한다.
- START_HERE의 첫 절차가 HANDOVER 필독이어야 한다.



## 0.8.0 Chat-to-Timeline 회귀 검사

- 초기 랜딩과 편집 작업공간이 분리되는지 확인
- 메시지 전송이 문장·쉼 블록을 생성하는지 확인
- 선택 보이스와 생성 옵션이 블록에 고정되는지 확인
- 첫 ready 블록이 Dock에 즉시 추가되는지 확인
- 실패 블록만 재시도할 수 있는지 확인
- API 미설정이 채팅 시스템 메시지와 연결 바텀시트로 이어지는지 확인
- 불필요한 작업공간 외곽 테두리가 다시 추가되지 않는지 확인

## 0.8.1 모바일 엔진·API 신뢰성 회귀 검사

- 스킴 없는 LAN IP와 공개 도메인의 API 주소 정규화
- 마지막 성공 주소와 최근 주소 최대 5개 저장
- 휴대폰 localhost와 HTTPS→HTTP mixed-content 사전 차단
- GET 일시 오류 재시도와 POST 무재시도
- 모든 요청의 request ID와 익명 client ID 헤더
- API·TTS·Worker·GPU 네 계층 상태 파생
- 온라인·네트워크 변경·PWA 복귀 시 단일 재점검
- TTS POST 응답 단절 후 job 상태와 `/result`로 완료 음원 복구
- 완료 전 409, 알 수 없는 job 404, 만료 결과 410 계약
- Private Network preflight 응답
- 느린 3G·데이터 절약 모드 timeout 조정
- 모바일 입력 16px, 터치 영역 44px, safe-area CSS 유지

현재 기준 테스트 수는 API 60개, Worker 9개다. Web Vitest·ESLint·Vite build는
GitHub Actions에서 최종 확인한다.

## 0.8.2 모바일 job 멱등성 회귀 검사

- 같은 job ID·같은 요청을 동시에 보내도 합성 factory가 한 번만 실행되는지 확인
- 완료 뒤 같은 요청을 재전송해도 저장 결과를 반환하고 재생성하지 않는지 확인
- 같은 job ID·다른 payload가 HTTP 409와 `SOA-4009`를 반환하는지 확인
- HTTP 호출 코루틴 취소 뒤에도 서버 생성이 완료되고 결과가 남는지 확인
- 타임라인 POST 실패 뒤 job ID를 유지하고 다음 재시도에서 GET/result를 먼저 호출하는지 확인
- 생성 중 블록 수정·분할 시 Abort되고 오래된 결과가 새 텍스트를 덮지 않는지 확인
- localStorage write 실패와 `randomUUID` 미지원 환경에서 fallback이 동작하는지 확인

현재 기준 테스트 수는 API 65개, Worker 9개다. Web 테스트는 새 회귀 케이스를 포함했으나
현재 실행 환경의 패키지 저장소 404 때문에 정식 Vitest 실행은 GitHub Actions에서 확인한다.


## 0.8.3 영속 JobStore 회귀 검사

- SQLite에 저장한 완료 결과를 새 JobManager와 API 재시작 뒤 복구
- 같은 SQLite를 쓰는 두 JobManager가 동일 job factory를 한 번만 실행
- 프로세스 종료를 가정한 만료 claim을 다른 manager가 재획득
- 결과 TTL 뒤 completed tombstone과 410 계약 유지
- 다른 manager가 보낸 취소 요청을 owner Task가 감지해 취소
- 결과 TTL과 이력 TTL cleanup 통계 및 레코드 삭제
- 서버 재시작 없이 조회할 때 만료 이력이 즉시 정리되는지 확인
- 기존 메모리 JobManager 멱등성·timeout·취소·진행률 회귀 유지

현재 기준 테스트 수는 API 77개, Worker 9개다. Web 품질 검사는 의존성 설치가 가능한
GitHub Actions에서 ESLint, TypeScript, Vitest 직렬 실행과 Vite build를 최종 확인한다.

## 0.8.4 자동 연결·Dock·프로젝트 복원 회귀 검사

- API 후보에 같은 Origin `/api/v1`이 포함되는지 확인
- 미설정 상태에서 bootstrap이 주소 입력 UI 없이 자동 탐색하는지 확인
- 수동 연결 Bottom Sheet와 API Setup Wizard가 번들 경로에서 제거됐는지 확인
- 초기 랜딩에서는 Dock과 `--has-player` 레이아웃이 생성되지 않는지 확인
- 작업공간 진입 뒤 메뉴 Dock이 나타나는지 확인
- 프로젝트 목록 항목 클릭이 home 작업공간과 active project를 설정하는지 확인
- 저장된 채팅·보이스·옵션·타임라인·job ID 위치가 복원되는지 확인
- 프로젝트 복원 시 새 synthesis POST보다 기존 job result를 먼저 조회하는지 확인
- 일부 실패의 null job ID가 뒤 문장으로 이동하지 않는지 확인
- 만료된 결과를 자동 재생성하지 않고 블록별 재생성 안내로 남기는지 확인

현재 기준 테스트 수는 API 77개, Worker 9개다. Web 회귀 테스트는 추가했으며 108개
TS/TSX 구문과 대체 strict 타입 검사는 통과했다. 정식 ESLint, TypeScript, Vitest와 Vite
build는 npm registry 제한 때문에 GitHub Actions에서 최종 확인한다.

## 0.8.5 공통 UX·엔진 오케스트레이션 회귀 검사

### Web

- 만들기 입력 후 복제 페이지로 이동했다 돌아와도 입력 값이 유지되는지 검사
- Compact Header에서 설정 버튼이 접근 가능하고 현재 페이지를 표시하는지 검사
- 프로젝트 loading, error+retry, empty와 불러오기 상태를 구분하는지 검사
- 하단 Dock과 Header가 공통 내비게이션 정의를 사용하는지 정적 검사
- 일반 합성·프리뷰가 특정 엔진이 아니라 `auto`를 요청하는지 검사

### API

- 주 엔진 실패 시 다음 준비 엔진으로 fallback하고 시도 순서를 반환하는지 검사
- 연속 실패 임계치 뒤 circuit가 열리고 해당 엔진을 건너뛰는지 검사
- cooldown 종료 뒤 후보를 다시 평가하는지 검사
- 명시한 알 수 없는 엔진을 다른 엔진으로 대체하지 않는지 검사
- 준비 엔진이 요청 출력 형식을 지원하지 않을 때 422 계약을 유지하는지 검사
- 모든 후보 실패 시 `SOA-4013`과 감사 이벤트를 반환하는지 검사
- `/engines`에서 ready 우선 엔진 하나만 recommended인지 검사

현재 기준은 API 89개, Worker 9개다. Web 정식 test는 의존성이 설치 가능한 CI에서 실행한다.

## 0.8.6 장문·브랜드·연결·세션 회귀 검사

### Web

- 공식 아이콘이 favicon, PWA, 랜딩과 작업공간 상단에 연결되는지 확인
- 상단 브랜드 클릭이 어느 작업 화면에서도 첫 페이지로 이동하는지 확인
- 첫 popstate에서 커스텀 종료창, 두 번째 popstate에서 즉시 back 호출 확인
- 20,000자 내용과 일반 Enter 줄바꿈, Ctrl/⌘+Enter 제작 계약
- 생성 후 내용 유지와 문장별 타임라인 생성 확인
- 서버 연결 대기 제작이 연결 복구 뒤 자동 재개되는지 확인
- GitHub Pages location 후보가 빈 배열이고 자체 HTTPS 호스트만 8443 후보를 갖는지 확인
- IndexedDB, localStorage, memory fallback과 세션 revision 확인
- 프로젝트 불러오기와 Object URL 재구성, block revision mismatch 폐기 확인

### API

- `/connectivity` 추천 엔진 ID가 `/engines` 추천 엔진과 일치하는지 확인
- cooldown 엔진이 실제 TTS ready로 계산되지 않는지 확인
- SQLite job 복구·409 충돌·410 만료 계약 유지
- API Python 3.10 Ruff와 pytest, Worker Ruff와 pytest 통과

현재 기준 테스트 수는 API 90개, Worker 9개다.

## 0.8.7 더빙 스튜디오 회귀 검사

### Web

- 프로젝트 제목 변경과 자동 저장 시각 표시
- 화자 선택·미리듣기·읽기 설정 Sheet 열기와 닫기
- 장문 내용의 문장 블록 변환과 블록별 수정·생성·재생
- 분할·순서 이동·삭제·새 대사·쉼 추가
- 작업 비우기 확인창과 workspace reset
- 하단 Player Queue의 현재 트랙·이전·재생·다음·진행률 연결
- 세션 복원 시 pitch 기본값과 기존 프로젝트 호환

### 공통

- API 90개·Worker 9개 회귀 유지
- Ruff, ESLint, TypeScript, Vitest와 Vite build는 CI 최종 관문

## TimelineEditor 접근성 이름 회귀

동일 화면에 여러 대사 생성 버튼이 있어도 각 버튼은 대사 번호와 상태를 포함한 고유한
접근성 이름을 가져야 한다. 완료됐지만 track이 없는 블록과 실패 블록이 함께 있어도
`getByRole` 단일 조회가 모호해지지 않아야 한다.

```text
1번 대사 음성 다시 생성
2번 대사 음성 다시 생성
```

## DubbingVoiceControls 접근성 이름 회귀

- 현재 화자 선택 버튼은 `현재 목소리 {이름} 선택`이라는 고유한 이름을 사용한다.
- 같은 화자의 미리듣기 버튼은 `{이름} 목소리 미리듣기`를 사용한다.
- 테스트는 `/혜린/` 같은 부분 정규식으로 단일 버튼을 조회하지 않는다.
- 화자 선택·음성 설정 버튼은 `aria-haspopup=dialog`와 `aria-expanded`를 제공한다.
## Dubbing menu 상태·접근성 회귀

- 프로젝트 메뉴는 `프로젝트 메뉴 열기` button과 `aria-expanded`로 열림 상태를 전달한다.
- JSDOM의 네이티브 `details/summary` 토글 동작에 테스트와 제품 동작을 의존하지 않는다.
- `현재 작업 비우기` 선택 시 메뉴가 닫히고 앱 내부 확인창이 열린다.
- 대사 블록 메뉴는 `{번호}번 대사 블록 메뉴 열기`라는 고유 이름을 사용한다.
- 블록 메뉴 동작을 선택하면 메뉴가 닫히고 정확한 블록 ID로 callback을 전달한다.
- 프로젝트 규칙은 두 제작 컴포넌트에 `<details`와 `<summary`가 다시 들어오면 실패한다.

## 종료 확인·장문 입력 테스트 안정성 회귀

- popstate로 React 상태를 변경할 때 `act()` 안에서 이벤트를 발생시킨다.
- 첫 뒤로가기 확인창, 두 번째 뒤로가기의 `history.back()`, 종료 버튼의 `history.go(-2)`를 각각 검증한다.
- HomePage 테스트는 변경 가능한 placeholder 카피에 결합하지 않는다.
- 장문 입력기는 접근성 이름과 `maxlength=20000`이라는 안정적인 제품 계약을 검증한다.
- `scripts/check-web-test-contracts.mjs`가 위 규칙의 누락을 프로젝트 규칙 단계에서 차단한다.

## 0.9.0 무료 전용·SSE 회귀 검사

- 기본 설정이 `free-only`이고 과금형 Cloud Adapter를 registry에 등록하지 않는지 확인
- free-only에서 명시 과금 엔진 요청을 거부하고 과거 선택 정책에서만 사용할 수 있는지 확인
- `/engines/strategy`가 비용 정책·유료 활성 여부·자동 순서를 반환하는지 확인
- `/tts/jobs/{job_id}/events`가 progress 이벤트와 종료 상태를 전송하는지 확인
- Web SSE 파서가 여러 frame을 처리하고 실패 시 polling으로 전환하는지 확인
- 완료 블록 추가가 현재 Player 선택을 덮어쓰지 않는지 확인

## 0.9.1 무료 전용 경계 회귀 검사

- `scripts/check-free-only-boundary.mjs`가 허용 목록 밖 TTS Adapter를 차단하는지 확인
- 환경 예시에 외부 음성 공급자 Secret이 없는지 확인
- `/engines`가 CosyVoice·MeloTTS·System Voice·Mock만 반환하는지 확인
- `/engines/strategy`가 `free_only=true`와 정적 Web+로컬 런타임 프로필을 반환하는지 확인
- GitHub Pages와 Firebase Hosting 자체 `/api`를 검사하지 않는지 확인
- 데스크톱 정적 Web의 localhost 후보와 모바일 Browser Speech 전환을 확인
- Firebase 설정에 Functions 또는 Cloud Run rewrite가 없는지 확인


## 0.9.2 엔진 오케스트레이터·Director 회귀 검사

- `/engines/catalog`가 `free_only=true`와 `product_identity=engine-orchestrator`를 반환하는지 확인
- CosyVoice 3·MeloTTS·DeepFilterNet3가 채택 상태인지 확인
- F5-TTS가 `research-only`, Kokoro가 `excluded`이며 자동 후보가 아닌지 확인
- Seed-VC가 코어 번들이 아닌 `external-plugin`인지 확인
- `/director/plan`이 오디오북·광고 용도와 속도·감정·호흡을 결정하는지 확인
- 영문 약어 발음 힌트와 원문 보존 경고를 반환하는지 확인
- `scripts/check-engine-blueprint.mjs`가 연구 엔진의 자동 순서 유입을 차단하는지 확인

## 0.9.2 CI Hotfix 2 · 잔존 브랜드 파일 회귀

```sh
npm run quality:rules
npm run cleanup:stale-brand
```

검증 시나리오:

1. 누적 저장소에 `public/sorion-icon.svg`가 있으면 `quality:rules`가 실패한다.
2. 오류 메시지는 `npm run cleanup:stale-brand` 복구 명령을 안내한다.
3. 정리 명령은 해당 파일을 삭제하고 다른 SVG가 남으면 실패한다.
4. 정리 뒤 `quality:rules`가 통과하며 Git 변경사항에 파일 삭제가 표시된다.

## 0.9.3-alpha.1 모델 온보딩 회귀 검사

- 매니페스트의 schema version, 모델 ID·버전, 라이선스와 한 개 이상의 파일을 요구하는지 확인
- `..`, 절대 경로, 역슬래시와 모델 루트 밖 symlink 경로를 거부하는지 확인
- 라이선스 동의 전에는 모델 파일을 해싱하거나 adapter를 로딩하지 않는지 확인
- 파일 크기·SHA-256 불일치와 누락 파일을 `checksum-failed`로 보고하는지 확인
- 매니페스트가 필수인데 경로가 없으면 `manifest-required`로 readiness를 차단하는지 확인
- CUDA·MPS·CPU 저속 모드와 최소 VRAM·디스크 여유 상태를 진단하는지 확인
- `/connectivity`가 `worker-model-integrity`와 실행 장치 상태를 전달하는지 확인
- 매니페스트 생성·검증 CLI가 작은 로컬 fixture에서 동일 digest를 재현하는지 확인

현재 로컬 실행 결과는 API 100개, Worker 14개 통과다. Python 3.10 uv·Ruff는 외부 네트워크가
차단된 환경이라 실행하지 못했으며, Web 의존성 설치는 내부 npm 미러 404로 완료하지 못했다.

## 0.9.3-alpha.2 Web 도구체인 회귀 검사

```bash
npm run quality:web-manifest
npm install --no-audit --no-fund
npm run quality:web-toolchain
npm ls vite vitest typescript typescript-eslint --all
npm run lint
npm run typecheck
npm run test:ci
npm run build
```

검사 기준:

- 직접 의존성에 caret·tilde가 없어야 한다.
- Vitest 4.1.10과 Vite 8.2.0이 하나의 그래프에 설치돼야 한다.
- Tailwind 4.3.3과 TypeScript ESLint 8.65.0의 peer 범위가 유효해야 한다.
- `@testing-library/dom`이 직접 설치돼야 한다.
- Vitest 아래 중첩 Vite가 생기거나 npm tree가 invalid면 실패해야 한다.


## 0.9.3-alpha.3 lock·전체 트리 검사

- Node 22.18.0과 npm 10.9.3이 nvm, node-version, packageManager, Volta, CI에서 일치하는지 확인
- `generate_lockfiles=true`가 package-lock과 API·Worker uv.lock을 생성하는지 확인
- npm package-lock 생성과 `npm ci` 로그의 ERESOLVE·UNMET·invalid·missing을 전부 차단
- `npm ls --all --json --long`에서 Vite 8.2.0과 Vitest 4.1.10이 단일 버전인지 확인
- 설치된 `vite-plugin-pwa`의 peerDependencies가 Vite 8을 포함하는지 확인
- 생성된 세 lock을 같은 workflow의 Web·API·Worker가 내려받아 frozen install로 재검증
- 일반 push·PR은 lock이 없으면 자동 bootstrap하고, 기존 lock이 manifest와 다르면 품질 작업 전에 실패

## 0.9.3-beta.1 회귀 검사
- `quality:stale-files`는 폐기 SVG의 파일·Git 추적·ignore·pre-push 계약을 검사한다.
- API는 실기기 기록, STT CER·WER·핵심 토큰 오류, 최종 WAV·SRT·VTT를 검사한다.
- 미완료 음성 구간이 있으면 기본 Export가 HTTP 409로 차단되어야 한다.
- Web은 완료 API WAV 블록에서 최종 WAV와 자막 요청을 시작해야 한다.


## 0.9.3-beta.1 CI Hotfix 1 · 이전 lock 모드 기록

- 이 절의 단일 lock 모드 selector는 beta.2 CI hardening에서 제거됐다. 현재 계약은 아래 component별 failure-domain 회귀 검사를 따른다.

## 0.9.3-beta.2 회귀 검사

- `npm run quality:lock-network`: ETIMEDOUT·EAI_AGAIN·429·503 등의 재시도 분류와 ERESOLVE 비재시도를 확인한다.
- npm은 cache-only 우선 후 online 최대 2회, uv는 component별 최대 2회 재시도하며 모든 명령에 hard timeout을 둔다.
- 장치 summary는 5개 프로필 × 10·30·60분의 누락 시나리오를 계산한다.
- STT 일괄 검수는 정상 문장을 제외하고 금액·CER·WER 오류 문장만 재생성 대상으로 고른다.
- 재생성 횟수가 최대값에 도달한 문장은 blocked로 반환한다.
- 타임라인 재생성 준비는 기존 jobId, trackId, audio를 제거하고 revision과 시도 횟수를 증가시킨다.

## 0.9.3-beta.2 CI failure-domain regression

- npm lock, API uv lock, Worker uv lock job이 서로 독립적인지 확인한다.
- npm ETIMEDOUT fixture가 제한 재시도 후 실패하고 API·Worker job dependency를 막지 않는지 확인한다.
- ERESOLVE fixture는 재시도 없이 즉시 실패하는지 확인한다.
- lock proof의 lock 또는 manifest SHA-256을 바꾸면 검증이 실패하는지 확인한다.
- main 전용 자동 커밋 job만 contents write를 가지며 PR에서는 실행되지 않는지 확인한다.

## Engine Heartbeat 3 회귀 검사

- 801줄 소스 fixture는 권고를 출력하지만 exit code 0을 유지한다.
- 1,201줄 소스 fixture는 1,200줄 안전 상한 위반으로 실패한다.
- Setup API는 CosyVoice 프리셋 0/5, 부분 준비, 5/5 준비를 구분한다.
- `START_ENGINE.cmd`, `npm run dev:free`, `npm run dev:api`는 별도 설정이 없으면 프로젝트 `voice-presets` 폴더를 자동 연결한다.
- Engine Doctor는 API·TTS·Worker·GPU를 분리 표시하고 주소 저장·재진단·자동 연결 복구를 제공한다.
- 복사되는 진단 JSON에는 Setup 상세 경로, 음원 내용, 서비스 토큰을 넣지 않는다.

## Engine Heartbeat 4 회귀 검사

- 첫 화면 4단계가 가로 스크롤 없이 2×2 또는 1×4로 배치되는지 확인합니다.
- HomePage에 프로젝트 rail, 작업 메시지 region, Voice Drawer가 함께 렌더링되는지 검사합니다.
- 엔진 API·Worker·GPU offline 상태가 작업 메시지에 기록되는지 검사합니다.
- Timeline에 시간 눈금, 가위, 삭제 직접 도구가 노출되는지 검사합니다.

## Engine Heartbeat 5 회귀 검사

- forwarded public HTTPS 요청이 `public_https_ready=true`와 공개 Origin을 반환하는지 확인
- localhost·사설 주소는 공개 Bridge ready로 오인하지 않는지 확인
- 프리셋 WAV의 유효 PCM, 누락, 과도한 무음이 각각 ready·missing·blocked인지 확인
- 준비되지 않은 프리셋 WAV가 CosyVoice 일반 TTS readiness를 만들지 않는지 확인
- 장문 TTS의 `first_audio_ms`가 존재하고 `processing_ms`보다 크지 않은지 확인
- Browser Speech가 측정하지 않은 첫 발화 시간을 0ms로 가장하지 않는지 확인
- 저장된 PC 패널 너비가 안전 범위로 clamp되고 접기 상태가 보존되는지 확인

Heartbeat 5 샌드박스 결과: API 127개, Worker 14개, compileall, Repository preflight 11개,
프로젝트 규칙, TypeScript·TSX 156개 transpile 구문 검사를 통과했습니다. 전체 Web lint·semantic
typecheck·Vitest·Vite build는 전달본에 npm lock과 설치 의존성이 없어 실행하지 못했습니다.

## Engine Heartbeat 5.1 Web Quality Hotfix 회귀 검사

- 세션 복원 뒤 `음성 설정` dialog가 열리는지 확인합니다.
- `밝게` 활성 상태는 전역 `screen`이 아니라 해당 dialog에 `within`을 적용해 검증합니다.
- 데스크톱 Voice Drawer와 모바일 Voice Settings Sheet가 동시에 DOM에 존재해도 중복 요소 오류가 없어야 합니다.
- `scripts/check-web-test-contracts.mjs`는 동일 버튼의 전역 단일 조회가 다시 들어오면 preflight를 실패시킵니다.

샌드박스에서는 Repository preflight 11개와 강화된 Web 테스트 계약을 통과했습니다. npm 설치는 내부 registry의
미러 누락(404)과 외부 registry DNS timeout으로 실행되지 않아 Vitest 전체 재실행은 GitHub Actions에서 최종 확인합니다.

## Engine Heartbeat 5.2 UI/UX Polish 회귀 검사

- PC Voice Drawer와 모바일 Voice Settings Sheet가 속도 0.7~1.4, 높낮이 -6~6 정수 단위와 말투 6종을 공유하는지 확인합니다.
- 과거 저장 속도·높낮이가 범위를 벗어나거나 소수 pitch여도 복원·미리듣기·생성 전에 보정되는지 확인합니다.
- Sheet와 확인창이 열릴 때 안전한 첫 컨트롤로 초점이 이동하고 Tab이 dialog 안에서 순환하는지 확인합니다.
- Escape·배경 닫기 뒤 원래 실행 버튼으로 초점이 돌아오고 열린 동안 body scroll이 잠기는지 확인합니다.
- 미리듣기 준비 중 관련 버튼이 비활성화되어 중복 요청이 발생하지 않는지 확인합니다.
- 목소리 radio가 방향키로 이동하고 비기능성 탭이 조작 가능한 tab으로 노출되지 않는지 확인합니다.
- 프로젝트 메뉴가 바깥 클릭·Escape로 닫히고 현재 프로젝트가 동작 없는 버튼으로 노출되지 않는지 확인합니다.
- 접힌 패널의 separator가 비활성화되고 제어 대상과 접힘 상태를 접근성 값으로 알리는지 확인합니다.
- dependency-free preflight가 공통 음성 설정과 modal 계약이 빠지면 실패하는지 확인합니다.

샌드박스 결과: Repository preflight 11/11, API pytest 127개, Worker pytest 14개, Python compileall,
TypeScript·TSX parser 160개와 transpile 159개 구문 검사를 통과했습니다. npm registry 404·timeout으로 Web 전체 lint,
semantic typecheck, Vitest, Vite production build는 실행하지 못했으며 GitHub Actions에서 최종 확인합니다.

## Engine Heartbeat 5.2.1 Focus Return Hotfix 회귀 검사

- 프로젝트 메뉴에서 초기화 확인창을 열 때 메뉴 항목이 unmount되어도 복귀 대상은 프로젝트 메뉴 실행 버튼으로 유지되어야 합니다.
- 확인창의 안전 버튼에 초기 초점이 있고 Escape로 닫은 뒤 `document.body`가 아니라 명시된 실행 버튼에 초점이 돌아와야 합니다.
- modal effect는 `returnFocusRef.current`를 setup 시점에 지역 변수로 캡처하고 cleanup에서는 해당 ref를 직접 다시 읽지 않아야 합니다.
- 명시적 복귀 대상이 연결되어 있으면 이전 활성 요소보다 우선하고, 대상이 없거나 끊겼을 때만 이전 활성 요소를 fallback으로 사용해야 합니다.
- dependency-free preflight는 cleanup의 mutable ref 직접 읽기와 복귀 우선순위 계약 제거를 실패로 처리해야 합니다.

샌드박스에서는 Repository preflight 11/11과 TypeScript 구문 검사를 통과했습니다. npm 내부 registry에서
`@eslint/js@9.22.0`이 404로 반환되어 ESLint·Vitest·semantic typecheck·Vite build는 GitHub Actions에서 최종 확인합니다.

## Engine Heartbeat 6 Partial Audio Delivery & Bridge Hardening 회귀 검사

- 장문 각 구간 WAV가 작업 상태 `ready_segments`에 저장되고 SSE가 `segment-ready`를 한 번씩 발행하는지 확인합니다.
- 서명 URL이 작업 ID·구간 번호·파일명·만료에 결합되고 변조·만료·다른 작업 파일 접근을 거부하는지 확인합니다.
- 성공한 구간은 음원 TTL 동안 유지하고 실패·취소 시 부분 파일을 제거하는지 확인합니다.
- 신뢰 CIDR 밖의 `X-Forwarded-*`는 무시하고 신뢰 proxy가 설정한 공개 HTTPS Origin만 결과 URL에 사용되는지 확인합니다.
- rate-limit bucket이 회전 가능한 `X-SoriON-Client-ID`가 아니라 유효 client IP에 고정되는지 확인합니다.
- Web이 SSE와 polling의 같은 첫 구간을 중복 등록하지 않고 최종 WAV를 같은 Player Queue 트랙 ID로 교체하는지 확인합니다.
- 첫 응답 chunk, `HTMLAudioElement.playing`, Browser Speech `onstart`가 별도 telemetry 필드에 기록되는지 확인합니다.
- dependency-free `quality:partial-audio-bridge`가 백엔드·프런트·테스트·운영 문서 계약 누락을 실패로 처리하는지 확인합니다.

샌드박스 결과: Repository preflight 12/12, API pytest 133개, Worker pytest 14개, Python compileall,
TypeScript·TSX 159개 transpile 구문 검사를 통과했습니다. 내부 npm registry의 `@eslint/js@9.22.0`
404로 ESLint·전체 Vitest·semantic typecheck·Vite production build는 실행하지 못했으며 GitHub Actions에서 최종 확인합니다.


## Engine Heartbeat 6.1 Progressive Playback & Male Presets 회귀 검사

- `voicePresets.ts`와 FastAPI canonical 목록에 5개 ID가 있고 남성 프리셋이 3종인지 확인합니다.
- Setup API가 0/5, 일부 준비, 5/5와 누락·차단 WAV를 구분하는지 확인합니다.
- CosyVoice가 도윤·준호·민준 ID별 WAV를 같은 이름으로 Worker에 전달하는지 확인합니다.
- Voice Picker의 남성 필터가 도윤·준호·민준만 표시하고 방향키 이동이 필터 목록을 따르는지 확인합니다.
- 첫 구간 URL이 410이면 새 서명 URL을 받아 두 번째 fetch로 복구하는지 확인합니다.
- partial 트랙이 final WAV로 교체될 때 트랙 ID, 현재 위치, 재생 상태와 telemetry가 유지되는지 확인합니다.
- dependency-free preflight는 프리셋 ID·성별·필터·공통 backend 목록과 부분 재생 handoff 계약을 검사합니다.

## Engine Heartbeat 6.2 Ordered Segment Queue & Device Evidence 회귀 검사

- SSE와 polling 구간이 2·1·3처럼 뒤섞여 와도 Player Store에는 1·2·3 순서로 한 번씩 등록되는지 확인합니다.
- 앞 번호 구간이 없을 때 뒤 구간을 먼저 재생하지 않고, 현재 구간 종료 뒤 `다음 구간 대기` 상태를 유지하는지 확인합니다.
- 대기 중 다음 구간이 추가되면 같은 트랙에서 자동 재생하고 최종 WAV 교체 시 누적 완료 시간과 현재 구간 위치를 승계하는지 확인합니다.
- 부분 구간 중 전체 seek·다운로드가 비활성화되고 중복·교체·삭제 시 소유 Blob URL이 해제되는지 확인합니다.
- 브라우저 증거가 Android Chrome·iOS Safari·PWA·Desktop 수준으로만 정규화되고 전체 User-Agent를 저장하지 않는지 확인합니다.
- 사용자 제스처 재생이 `passed`·`blocked`·`failed`를 구분하며 자동 감지가 백그라운드 복귀 통과로 기록되지 않는지 확인합니다.
- dependency-free `quality:ordered-segment-playback`이 coordinator, Player handoff, 기기 증거, 테스트와 운영 문서 계약 누락을 실패로 처리하는지 확인합니다.

샌드박스 결과: Repository preflight 14/14, API pytest 135개, Worker pytest 14개, Python compileall,
TypeScript·TSX 164개 transpile 구문 검사를 통과했습니다. 전달본에 `package-lock.json`과 설치 의존성이 없어
ESLint·전체 Vitest·semantic typecheck·Vite production build는 실행하지 못했으며 GitHub Actions에서 최종 확인합니다.



## Engine Heartbeat 6.3 Seam Metrics & Device Soak 회귀 검사

- 구간 1의 `ended`와 구간 2의 `playing` 사이 시간이 seam으로 기록되고 생성 대기 포함 플래그가 유지되는지 확인합니다.
- 같은 전환의 중복 `playing` 이벤트가 seam을 중복 기록하지 않고 트랙별 최근 20개 한도를 지키는지 확인합니다.
- Quality Lab이 평균·최대·최근 seam을 표시하고 사용자 문장 없이 JSON을 내보내는지 확인합니다.
- 원격 최종 API 음원과 Browser Speech만 플레이어 세션에 저장되고 부분 음원·Blob·revoke 대상은 제외되는지 확인합니다.
- 25분이 지난 세션은 폐기하고, 유효 세션은 자동 재생 없이 저장된 위치·반복 모드·재생 속도를 복원하는지 확인합니다.
- online/offline, visibility hidden→visible, BFCache pageshow가 관찰 세션 카운터와 숨김 시간에 반영되는지 확인합니다.
- dependency-free `quality:seam-metrics`가 seam, persistence, device soak, 테스트와 운영 문서 계약 누락을 실패로 처리하는지 확인합니다.

샌드박스 결과: `Repository preflight 15/15, API pytest 135개, Worker pytest 14개, Python compileall, TS/TSX 166개 transpile 구문 검사, 핵심 비-React 모듈 strict semantic 검사와 player session·browser evidence runtime smoke를 통과했습니다`. 실제 Android Chrome·iOS Safari·PWA 장시간 음성 재생과 네트워크 전환은 별도 실기기 증거가 필요합니다.


## Engine Heartbeat 6.4 Signed Audio Rehydration & Device Certification 회귀 검사

- 최종 TTS URL이 작업 ID·파일명·만료 시각과 final 서명 도메인에 결합되고 segment 서명과 서로 대체되지 않는지 확인합니다.
- 완료 작업 결과를 다시 조회할 때 새 만료 시각의 최종 음원 URL이 발급되고, 변조된 작업 ID·파일명·서명을 거부하는지 확인합니다.
- 새로고침 복원은 저장된 작업 ID로 URL을 갱신한 뒤 대기열을 복원하며, 갱신 실패한 트랙만 제외하는지 확인합니다.
- 재생 중 서명 URL 오류가 발생하면 동일 트랙 ID·재생 위치·재생 의도를 유지한 채 한 번만 복구하는지 확인합니다.
- Quality Lab이 seam 평균·P95·최대와 최종 WAV handoff 위치 오차 P95를 사용자 문장 없이 내보내는지 확인합니다.
- Android Chrome·iOS Safari의 baseline·network-switch·background-resume·installed-pwa를 10·30·60분 조합으로 분리하고, 실제 기록이 없으면 READY를 생성하지 않는지 확인합니다.
- dependency-free `quality:signed-audio-certification`이 signer, API, player rehydration, P95, 인증 schema·UI와 문서 계약 누락을 실패로 처리하는지 확인합니다.

샌드박스 결과: Repository preflight 16/16, API pytest 137개, Worker pytest 14개, Python compileall,
TypeScript·TSX 166개 transpile 구문 검사를 통과했습니다. 전달본에 `package-lock.json`과 설치 의존성이 없어
ESLint·전체 Vitest·semantic typecheck·Vite production build는 실행하지 못했으며 GitHub Actions에서 최종 확인합니다.

## Engine Heartbeat 6.5 검사

- Device benchmark가 `preset_id`, wall-clock soak 시간과 세 가지 복구 지연을 저장하는지 확인합니다.
- 복구 boolean이 true여도 지연 필드가 없으면 warning인지 확인합니다.
- 목표 시간의 98% 미만 기록이 READY로 분류되지 않는지 확인합니다.
- 기기·엔진·프리셋별 first audio, SSE, fetch, interruption, waited/decode seam P95가 nearest-rank로 집계되는지 확인합니다.
- Quality Lab recorder가 진행 세션을 localStorage에서 복원하고 현재 기록 JSON을 저장하는지 확인합니다.
- Export 응답에 서버 만료 시각, 보관 분, `download-only` 정책이 포함되는지 확인합니다.
- 로컬 archive receipt가 파일명만 저장하고 전체 URL·음성 바이트·원문을 저장하지 않는지 확인합니다.
- dependency-free `quality:device-soak-archive`가 recorder·집계·archive 정책·테스트 계약 누락을 차단하는지 확인합니다.

샌드박스 결과: `Repository preflight 17/17, API pytest 139개, Worker pytest 14개, Python compileall, TS/TSX 171개 transpile 구문 검사`를 통과했습니다. 전체 ESLint·Vitest·semantic typecheck·Vite build는 검증된 npm lock 환경에서 최종 확인합니다.

## Engine Heartbeat 6.5.1 CI Regression Hotfix 검사

- `segment_audio.py`가 Ruff UP012를 유발하는 `.encode("utf-8")`를 사용하지 않는지 확인합니다.
- 플레이어가 현재 `playRequestId`를 초기 기준으로 캡처해 새로고침 복원 트랙을 자동 재생하지 않는지 확인합니다.
- `play`·`playing`·`pause` 이벤트가 `playingRef`를 즉시 갱신하고, 부분→최종 WAV 교체 시 최신 UI 위치와 native 위치 중 안전한 값을 승계하는지 확인합니다.
- `progressiveSegments`가 memoized되어 Hooks dependency 경고가 발생하지 않는지 확인합니다.
- SSE 테스트 mock이 `resolveApiAssetUrl`을 제공하고, 부분 WAV 테스트 fixture가 jsdom Blob 대신 Undici 호환 byte body를 사용하는지 확인합니다.
- visibility 측정 테스트가 주입 시계로 정확히 3,500ms를 계산하는지 확인합니다.
- 샌드박스 결과: Repository preflight 17/17, API pytest 139개, Worker pytest 14개, Python compileall, TS/TSX 171개 transpile 구문 검사를 통과했습니다.
- 제한: npm registry의 scoped package 404로 전체 ESLint·Vitest·semantic typecheck·Vite build는 로컬 재실행하지 못했으며 GitHub Actions에서 최종 확인합니다.


## Engine Heartbeat 6.5.2 Stream Handoff CI Hotfix 검사

- 첫 WAV fetch의 `ReadableStream.tee()`에서 probe 첫 chunk를 읽은 뒤 cancel promise를 생성하되 playback branch를 완전히 소비한 다음 cancel 완료를 기다리는지 확인합니다.
- 코드에 playback 소비 전 `await probe.cancel()` 패턴이 다시 들어오면 dependency-free preflight가 실패하는지 확인합니다.
- 만료 URL 복구, 첫 구간 즉시 큐 등록, 뒤섞인 1·2·3 구간 정렬 테스트가 stream 교착 없이 부분 트랙을 관찰할 수 있는지 확인합니다.
- 부분→최종 WAV 테스트가 Store 교체를 `act()`로 처리하고 새 audio `src` 반영 뒤 metadata와 재생 재개를 검증하는지 확인합니다.
- 샌드박스 결과: Repository preflight 17/17, API pytest 139개, Worker pytest 14개, Python compileall, TS/TSX 171개 transpile 구문 검사와 Web Streams tee/cancel runtime smoke를 통과했습니다.
- 제한: sandbox npm registry가 `@eslint/js@9.22.0`을 404로 반환해 전체 Vitest·ESLint·semantic typecheck·Vite build는 GitHub Actions에서 최종 확인합니다.

## Engine Heartbeat 6.6 Field Evidence & Reproducible Web Quality 검사

- `npm run quality:preflight`: 18/18
- `python -m pytest services/api/tests -q`: 143 passed
- `python -m pytest services/worker/tests -q`: 14 passed
- `python -m compileall -q services/api/app services/worker/app`: 통과
- TypeScript `transpileModule`: TS/TSX 171개 통과
- `node scripts/check-reproducible-web-quality.mjs`: plan report 생성, 실제 로그 hash 검증, report·로그 변조 차단 확인
- `node scripts/verify-web-quality-report.mjs --allow-plan`: 통과
- `.github/workflows/ci.yml` YAML parse: 통과
- 전체 ESLint·Vitest·semantic typecheck·Vite build는 설치된 Web dependency가 없는 sandbox에서는 실행하지 못했습니다. 커밋된 lock을 사용하는 GitHub Actions에서 최종 확인합니다.
- Ruff는 현재 실행 환경에 설치돼 있지 않아 API·Worker CI에서 최종 확인합니다.
