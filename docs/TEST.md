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
- 500줄 제한 위반
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
- HANDOVER는 500줄을 초과하지 않아야 한다.
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
