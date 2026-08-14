# ROADMAP

현재 제품 버전: `0.11.12`

## 0.11.12 완료 · Editing History, Speaker Memory & Engine Routing Trace

- 최근 20단계 Timeline bounded Undo/Redo와 keyboard/toolbar 제어
- stale audio/job을 복원하지 않는 안전 snapshot apply
- 화자 원문 대신 hash key+voiceId만 저장하는 최근 배정 재사용
- batch engine usage/switch/fallback routing trace
- 다음 목표는 0.11.13 Adaptive Longform Soak & Mobile Editing Polish

## 0.11.11 완료 · Mobile Studio Flow & Natural Voice Playback

- 모바일 홈 Player + 주요 Dock 일관화
- 현재 목소리 1개 + 팝업 전체 목록/미리듣기/장단점/상황 적합도
- preview-only 계약과 대본 맞춤 추천/프리셋 natural range 보정
- 모바일 composer focus/visualViewport 상단 정렬
- 모바일 실제 좌→우 horizontal timeline + full-width track
- 생성 음성 store play 요청과 Player 버튼 즉시 연결
- 다음 목표는 0.11.12 Editing History & Engine Soak Polish

## 0.11.10 완료 · Horizontal Timeline Workspace

- PC ruler·clip·playhead 동일 X축 geometry
- 실제 duration 비례 clip 폭과 zoom 연동
- 얇은 가로 clip strip + 선택 클립 빠른 편집 분리
- 트랙 background/ruler drag scrubbing과 clip selection/seek 분리
- 모바일 세로형 유지 + PC 전용 container-query 밀도 조절
- 다음 목표는 0.11.11 Editing History & Engine Soak Polish

## 0.11.9 완료 · Multi-Speaker Assist & Resume Generation

- 명확한 `화자: 대사` 형식만 감지하는 보수적 Multi-Speaker Assist
- 사용자 승인 전 자동 voice 배정을 실제 생성에 사용하지 않는 확인 gate
- clip-level voice/project restore와 job 순서 보존
- 취소 뒤 queued 대사만 재개하는 `남은 대사 이어서 만들기`
- 0.11.10에서 PC Horizontal Timeline Workspace를 우선 완료

## 0.11.8 완료 · Fast One-Flow & Safe Parallel Generation

- 첫 대사 우선 재생 + 이후 최대 2개 bounded parallel 생성
- 병렬 완료 뒤 player queue를 원문 timeline 순서로 자동 복원
- 실제 대본 첫 문장 미리듣기와 생성 진행률/중지
- SRT/VTT clipboard 자동 정리와 Markdown 말하기용 정리
- 다음 목표는 0.11.9 Multi-Speaker Assist & Approved Visual Baseline



## 0.10.2 완료 · Recovery Soak & Managed Lock Interface

- 이전 장시간 검사 대비 응답·성공률·복구·메모리·연결 회귀 비교
- Worker 실제 재시작과 45초 자동 복구 gate
- 계획된 복구 실패와 일반 장애 표본 분리
- writer lease Protocol과 SQLite backend factory
- 1024·1280·1440px PC 3분할 폭 회귀 계약
- 다음 목표는 0.10.3 Baseline History & Recovery Dashboard


## 0.10.1 완료 · Approval Modularization & Operator Baselines

- 승인 orchestration, hash·diff, 원자 저장·history, 갱신 대기열 모듈 분리
- 운영자 확정 최근 5건 SHA-256 기준선과 자동 기준선 별도 관리
- 기준선 교체·폐기 history와 Quality Lab 회귀 표시
- 다음 목표는 0.10.2 Recovery Soak & Managed Lock Interface


## 0.10.0 완료 · Always-on Preset Runtime & PC Three-Pane

- 프리셋 음성 미리듣기 자동 대기·재연결·점진 재시도
- 일반 작업 화면 엔진 연결 상태 완전 비노출
- 12초/45초 heartbeat와 60초 전체 점검
- 1024px PC 3분할과 v2 기본 펼침 레이아웃

## 0.9.9 완료 · CI Quality Hotfix

- 승인 서비스 first-party import Ruff 정렬 복구
- 플레이어 테스트의 렌더 초기 pause와 사용자 pause 기준 분리
- 동일 회귀를 compatibility·playback preflight에서 차단
- 다음 목표는 0.10.0 승인 서비스 모듈화와 운영자 확정 기준선

## 0.9.8 완료 · Quality Gate Compatibility

- Python collection protocol import와 예외 chaining 최신 Ruff 규칙 반영
- 모바일 음성 설정 engine prop과 Engine Doctor 테스트 타입 계약 복구
- 다음 목표는 0.9.9 CI 품질 Hotfix

## 0.9.7 완료 · Natural Playback Controls

- 재생 클릭 즉시 일시정지 버튼으로 전환
- 일시정지 클릭 즉시 재생 버튼으로 복귀
- 파일 음원·Browser Speech 준비 지연 중 중복 재생 방지
- 다음 목표는 0.9.8 승인 서비스 모듈화와 운영자 확정 기준선

## 0.9.6 완료 · Long-Run Reliability & Writer Safety

- 승인·재서명·롤백의 SQLite writer lease와 fencing token
- API·Worker 5·30·60분 장시간 soak와 복구·누수 지표
- 개인정보 제외 감사 ZIP과 파일별 SHA-256 manifest
- 다음 목표는 0.9.7 승인 서비스 모듈화와 운영자 확정 기준선

## Phase 1 — Foundation

- [x] 신규 코드베이스 기초 구조
- [x] 모바일 PWA 셸
- [x] FastAPI 엔진 게이트웨이
- [x] 로컬 프로젝트 저장
- [x] Firebase 선택형 로그인 어댑터
- [x] CI와 프로젝트 규칙 검사
- [x] GitHub Pages 자동 배포
- [ ] 실제 Firebase 개발 프로젝트 연결
- [ ] 설치형 PWA 실기기 점검

## Phase 2 — AI Core

- [x] 모바일 Voice Workspace
- [x] 한국어 음성·감정 프리셋 UI
- [x] 생성 상태, 실패, 재시도 UI
- [x] 오디오 플레이어와 WAV 다운로드 흐름
- [x] Mock·Demo·실제 AI 구분
- [ ] 첫 실제 한국어 TTS 엔진 어댑터
- [ ] Faster Whisper STT
- [ ] 목소리 샘플 전처리
- [ ] 복제 동의 및 권리 확인 흐름

## Phase 3 — Professional

- [ ] 실제 감정·속도·톤·피치 제어
- [ ] 한국어 발음 사전
- [ ] 다국어 번역과 더빙
- [ ] 배치 생성
- [ ] 프로젝트 버전과 즐겨찾기

## Phase 4 — Service

- [ ] 관리자 화면
- [ ] 사용량·비용·오류 지표
- [ ] 요금제와 할당량
- [ ] AI 성우 마켓 기반
- [ ] 실시간 음성 변환 연구

## 현재 진행 상태

- `0.2.0`: 모바일 TTS 생성 흐름
- `0.3.0`: 실제 한국어 엔진 어댑터
- `0.4.0`: 한국어 전처리와 품질 연구소
- `0.5.0`: API 연결, 실제 진행률, 품질 기록 보존
- `0.6.0`: 모바일 목소리 복제 온보딩과 동의 기반
- `0.7.0`: 음성 → 음성 변환과 STT 연결


## 0.6.0 완료

- 모바일 마이크 녹음과 음성 파일 선택
- 로컬 길이·무음·클리핑·음량 검사
- 명시적 동의와 동의 철회 삭제
- IndexedDB v3 음성 프로필
- CosyVoice Worker 경계와 API capability
- Dock 대기열, 이전·다음, 반복, 속도, 다운로드

## 0.7.0 예정

- CosyVoice Worker 실제 health·모델·GPU 진단
- 제로샷 speaker prompt와 복제 실행
- 스트리밍 TTS·복제 결과
- 프로젝트별 Dock 세션 복구


## 0.7.1 완료

- API↔Worker 서명 인증
- 요청 제한과 감사 로그
- 모델·GPU readiness 강화
- SSE 재연결 계약
- 종료 작업 TTL 정리

## 0.7.4 예정

- GPU 배포 템플릿
- 모델 설치·체크섬·로딩 진행률
- 문장별 조기 재생
- Worker 재시작 상태 복구
- speaker prompt cache 수명주기


## 0.7.2 완료

- CI Ruff·Vitest·React Hooks 회귀 수정
- 문장별 UI 분할 계약 안정화
- 동일 오류 재유입 방지 규칙 추가

## 0.7.3 예정

- GPU 배포 템플릿과 progressive playback
- Worker 재시작 복구와 prompt cache 수명주기


## 0.7.3 완료

- 임시채팅 영구 HANDOVER 메모리 기준점
- 제품 목표·UX 결정·아키텍처·엔진·보안·환경·CI·제한 통합 기록
- 다음 기능 목표를 0.7.4로 이동


## 0.8.0 완료

- 초기 랜딩 유지와 Chat-to-Timeline 편집 작업공간
- 세로 보이스 라이브러리, 채팅 composer, 문장·쉼 타임라인
- 첫 ready 블록 Progressive Playback과 연결 바텀시트

## 0.8.1 완료

- 모바일 API 주소 정규화·last-good·최근 주소 복구
- API·TTS·Worker·GPU 네 계층 상태
- 네트워크 전환·PWA 복귀 자동 재점검
- GET 제한 재시도와 TTS POST job 결과 복구
- Private Network preflight와 모바일 safe-area·터치 영역 강화

## 0.8.2 완료

- 동일 TTS job·동일 요청의 실행 Task 공유와 완료 결과 재사용
- 다른 payload의 job ID 재사용 409 차단
- HTTP 호출 취소와 서버 생성 Task 수명 분리
- 타임라인 job ID 보존과 recover-first 재시도
- 모바일 localStorage 실패 fallback과 randomUUID 호환
- 생성 중 편집·분할의 stale 결과 방지

## 0.8.3 완료

- SQLite 기반 교체 가능한 TTS JobStore
- API 재시작 뒤 상태·완료 결과 복구
- 다중 API 프로세스 원자적 claim과 stale claim 재획득
- 결과 TTL·이력 TTL 분리와 completed tombstone 410
- 저장소 기반 cross-process 취소 신호

## 0.8.4 완료

- 수동 API 주소 입력과 엔진 연결 Bottom Sheet 제거
- 같은 Origin·환경 변수·성공 이력·안전 로컬 후보 자동 탐색
- 첫 랜딩 Dock 비노출, 작업공간 진입 뒤 메뉴·Player Dock 표시
- 최근 프로젝트 클릭 불러오기와 채팅·보이스·타임라인 복원
- 저장된 job ID 결과 recover-first와 만료 시 블록별 재생성 안내

## 0.8.5 완료

- 메뉴 이동 중 만들기 초안·채팅·타임라인 보존
- 품질·프로젝트·설정 공통 헤더와 다크 IA 통일
- 설정 직접 접근과 프로젝트 loading/error/empty/retry 상태
- 자동 엔진 순위화·fallback·실행 시도 메타데이터
- 반복 실패 엔진 circuit breaker와 품질 진단 연결

## 0.8.6 완료

- 최대 20,000자 장문 내용 중심 Voice Studio
- 내용 통계, 문장 분할, 순차 생성과 연결 복구 뒤 자동 재개
- 공식 브랜드 아이콘과 모든 상단 브랜드의 첫 페이지 이동
- 첫 뒤로가기 확인, 두 번째 뒤로가기 즉시 이탈
- GitHub Pages same-origin·8443 API 오탐 차단
- Actions 공개 API 변수 주입과 엔진 진단 일치
- IndexedDB 세션 저장, revision 보호와 recover-first 복원

## 0.8.7 예정

- 공개 HTTPS API·GPU Worker 운영 템플릿
- Fun-CosyVoice 3 일반 TTS Adapter
- 한국어 장문 음질 평가와 Progressive Streaming
- 첫 오디오 지연, 실패 구간 재생성과 실기기 검증

## 0.8.7 완료

- 모바일 더빙 프로젝트 상단바와 자동 저장 상태
- 화자 선택·읽기 설정 Bottom Sheet
- 문장별 직접 편집·생성·재생·분할·이동·삭제
- 새 대사·쉼 추가와 하단 전체 폭 플레이어
- 작업 초기화 확인과 공통 workspace reset

## 0.8.8 완료

- 만들기 포함 공통 상단 배너와 작은 SoriON 프로그램명 복원
- 사용자 제공 PNG 공식 로고·favicon·PWA 아이콘 통일
- 공개 API 미연결 시 Web Speech API 한국어 음성 자동 대체 재생
- 실제 서버 엔진 우선순위와 브라우저 음성의 비-AI 표시

## 0.8.9 완료

- 공통 내부 페이지 셸과 한국어 Engine Mesh
- 복수 공개 API 후보 자동 장애 전환
- Premium Cloud Adapter 경계와 한국어 특화 순위 메타데이터

## 0.9.0 완료

- 무료 사용 기본 `free-only` 엔진 정책
- 유료 공급자 Adapter의 서버 명시 opt-in
- TTS job SSE 진행률과 polling fallback
- Progressive Queue 현재 트랙 보존

## 0.9.1 예정

- 무료 CosyVoice 로컬 모델 설치·체크섬·readiness 온보딩
- 한국어 무료 엔진 블라인드 품질 벤치마크
- 전체 WAV 병합·다운로드와 실패 문장 재생성

## 0.9.1 완료

- 외부 과금형 음성 Adapter와 Secret 설정 제거
- CosyVoice·MeloTTS·System Voice·Browser Speech 무료 전용 경계
- Firebase Hosting Spark 정적 배포 구성
- 데스크톱 localhost 무료 API 자동 탐색
- 허용 목록 밖 Adapter와 서버형 Firebase 설정 CI 차단

## 0.9.2 예정

- 무료 CosyVoice 모델 온보딩과 체크섬 검사
- 한국어 발음·억양·장문 호흡 블라인드 벤치마크
- 전체 프로젝트 WAV 병합과 실패 문장 재생성


## 0.9.2 완료

- 엔진 모음이 아닌 한국어 음성 오케스트레이터 제품 정체성 확정
- 무료 엔진·선택 Adapter·벤치마크·연구·제외 카탈로그
- F5-TTS 비상업 checkpoint와 Kokoro 한국어 경계 명시
- OpenVoice V2 선택 Adapter와 Seed-VC 외부 플러그인 결정
- Faster Whisper·DeepFilterNet3·Rule Director 채택
- 내용 용도·발음·호흡·속도·감정 자동 계획 API

## 0.9.3 예정

- 무료 모델 온보딩과 하드웨어 자동 프로필
- OpenVoice V2·Faster Whisper·DeepFilterNet3 실제 Adapter
- STT 기반 한국어 발음 자동 검수와 실패 문장 재생성
- 전체 WAV·MP3 병합과 자막 출력

## 0.9.3-alpha.1 완료

- 모델 로딩 전 매니페스트 schema·안전 경로·파일 크기·SHA-256 검증
- 사용자가 확인한 모델 라이선스 동의 없이는 readiness 차단
- CUDA·Apple Silicon MPS·CPU 저속 모드와 VRAM·디스크 프로필 진단
- 모델 매니페스트 생성·검증 CLI와 API 연결 상태 노출

## 0.9.3-alpha.2 완료

- Vite 8과 Vitest·Tailwind·TypeScript ESLint 호환 조합 정렬
- 직접 npm 의존성 exact pin과 Vite override
- React Testing Library peer dependency 명시
- 설치 전 manifest·설치 후 실제 버전·dependency tree CI 검사

## 0.9.3-beta.1 예정

- Faster Whisper 한국어 STT 검수 Adapter
- CER·WER 및 숫자·날짜·금액·고유명사 오류 분류
- 타임라인 순서·쉼을 반영한 전체 WAV·MP3·SRT·VTT Export
- 품질 임계값 실패 문장만 제한적으로 재생성


## 0.9.3-alpha.3 lock evidence gate

- Node·npm 실행 버전을 개발 환경과 CI에 동일 고정
- npm·API uv·Worker uv lock 생성과 경고 로그를 GitHub Actions artifact로 제공
- 전체 npm tree와 vite-plugin-pwa Vite 8 peer 확인
- lock 커밋 뒤 npm ci·uv sync --locked 강제
- 다음 범위를 실기기 검증·STT 실측·최종 Export로 제한


## 0.9.3-beta.1 완료

- 삭제 파일 재유입을 ignore·Git 인덱스·hook·CI·패치 실행기로 차단
- 실기기 벤치마크 기록 API와 STT CER·WER 측정
- WAV 병합, 실제 시간 SRT·VTT, 선택적 MP3와 Web 다운로드 동선
- 실제 장치 성능 증거와 실패 문장 제한 재생성은 beta.2로 이관

## 0.9.3-beta.2 완료

- npm registry 일시 장애의 재시도, cache 보존, 시도별 진단 artifact를 추가했다.
- 실기기 15개 시나리오의 증거 진행률을 API와 Quality 화면에서 확인한다.
- Faster Whisper 일괄 검수 결과를 타임라인에 연결하고 실패한 문장만 제한 재생성한다.
- 다음은 실제 장치 수치, 재생성 전후 개선율, 30·60분 Export soak다.

## 0.9.3-beta.3 완료

- STT 선택 재생성 전후 개선 증거 저장·요약·redacted JSON bundle
- 장문 Export 청크 스트리밍, 원자적 파일 교체, FFmpeg timeout·부분 파일 정리
- 10·30·60분 WAV·MP3 soak 6개 시나리오 실행기와 실제 컨테이너·자막 길이 검증
- 다음: 실제 장치 15개 시나리오와 실제 Faster Whisper·CosyVoice 증거를 채워 RC gate를 통과

