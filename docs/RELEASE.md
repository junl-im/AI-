# RELEASE

## 브랜치

- `main`: 운영 배포 가능
- `develop`: 다음 배포 통합
- `feature/*`: 기능
- `fix/*`: 수정
- `docs/*`: 문서

## 배포 조건

- Pull Request 승인
- 웹 lint, typecheck, test, build 통과
- API test와 lint 통과
- 모바일 핵심 폭 수동 확인
- HANDOVER와 CHANGELOG 갱신
- 보안·개인정보 영향 검토

## 버전

Semantic Versioning을 사용한다.

사용자 화면 버전은 `0.9.5`, `0.9.6`처럼 단순 증가시키며 내부 Heartbeat·revision은 고급 진단에만 표시한다.
다음 버전은 `npm run version:set -- 0.10.5` 형식으로 갱신하고 `npm run quality:version-sync`로 확인한다.

- Patch: 호환되는 수정
- Minor: 호환되는 기능 추가
- Major: API나 데이터 계약의 파괴적 변경

## GitHub Pages

- 게시 소스는 **GitHub Actions**를 사용한다.
- `.github/workflows/ci.yml` 하나가 품질 검사와 `main` Pages 배포를 함께 관리한다.
- 저장소 경로 `/AI-/`를 Vite base와 PWA scope에 적용한다.
- 소스 루트가 아니라 빌드 결과 `dist/`만 배포한다.
- 배포 성공 전에는 이전 Pages 릴리스가 계속 서비스될 수 있다.

## Firebase Hosting

오직 `dist`만 배포한다. `index.html`, Service Worker, Manifest에는 장기 immutable 캐시를 적용하지 않는다.

## 롤백

- 이전 Hosting 릴리스 보존
- 데이터 스키마 변경 전 복구 방법 작성
- AI 엔진은 설정으로 이전 어댑터를 다시 선택할 수 있게 유지

## 필수 전달 산출물

모든 코드 업데이트는 다음을 한 묶음으로 전달한다.

- `1. 결과` 설명
- 현재 버전 **전체 통파일 ZIP**
- 직전 기준 버전용 **덮어쓰기용 패치 ZIP**
- 두 ZIP의 SHA-256 체크섬
- 갱신된 `docs/HANDOVER.md`
- 갱신된 `docs/CHANGELOG.md`
- 갱신된 `docs/NEXT_UPDATE.md`
- `3. 다음 예상 업데이트 내역` 설명

패치 ZIP은 저장소 루트 기준 경로를 사용하며 `.git`을 포함하지 않는다. 세부 기준은 루트의 `DELIVERY_RULES.md`를 따른다.

## 음성 결과 릴리스 조건

- 브라우저 Demo를 실제 AI 음성으로 표현하지 않는다.
- 결과 카드에 `DEMO WAV`, `MOCK`, `AI AUDIO` 출처가 명확해야 한다.
- 오디오 자동 재생을 사용하지 않는다.
- 다운로드 파일명에 운영체제 금지 문자가 없어야 한다.
- Blob Object URL은 화면 생명주기에 맞춰 해제해야 한다.


## 0.6.0 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.6.0-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.5.8-to-0.6.0-patch.zip`
- 패치 기준 버전: `0.5.8`
- 삭제 파일: 없음
- `.git`, `node_modules`, `dist`, `.sorion`, 가상환경, Python 캐시, 테스트 캐시는 포함하지 않는다.
- 배포 전 `quality:rules`, Web quality, API quality · Python 3.10, Pages 배포를 확인한다.


## 0.6.1 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.6.1-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.6.0-to-0.6.1-patch.zip`
- 패치 기준 버전: `0.6.0`
- 삭제 파일: 없음
- 목적: Web quality의 배너 기대값과 JSDOM Blob 호환성 회귀 수정

## 0.6.2 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.6.2-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.6.1-to-0.6.2-patch.zip`
- 핵심 확인: 설정의 5경로 연결 검사, `/api/v1/connectivity`, CORS, Worker health
- 삭제 파일: 없음


## 0.6.3 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.6.3-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.6.2-to-0.6.3-patch.zip`
- 핵심 확인: 빈 상태 메뉴 전용 Dock, 음성 준비 후 플레이어 상단 표시, 적응형 하단 여백
- 삭제 파일: 없음

## 0.6.4 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.6.4-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.6.3-to-0.6.4-patch.zip`
- 핵심 확인: 500자 입력창, 발음 보정 토글, 가로 목소리 칩, 동적 CTA, 문장별 생성 리스트, Dock 상단 이동
- 패치 기준 버전: `0.6.3`
- 삭제 파일: 없음


## 0.7.0 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.7.0-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.6.4-to-0.7.0-patch.zip`
- 패치 기준 버전: `0.6.4`
- 핵심 확인: Worker health/readiness, GPU 진단, 작업 생성·취소·재시도, Dock 자동 연결
- 모델 가중치, torch, torchaudio, CosyVoice 저장소 의존성은 ZIP에 포함하지 않는다.
- 삭제 파일: 없음


## 0.7.1 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.7.1-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.7.0-to-0.7.1-patch.zip`
- 체크섬: `SoriON-AI-0.7.1-artifacts.sha256`
- 보안 Secret과 모델 가중치는 ZIP에 포함하지 않는다.
- 패치 기준 버전은 정확히 `0.7.0`이며 삭제 대상은 없다.


## 0.7.2 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.7.2-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.7.1-to-0.7.2-patch.zip`
- 체크섬: `SoriON-AI-0.7.2-artifacts.sha256`
- 패치 기준 버전: `0.7.1`
- 핵심 확인: Worker Ruff 4건, API Ruff 1건, Web test 1건, Hook warning 1건 수정
- 삭제 파일: 없음

## 0.7.3 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.7.3-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.7.2-to-0.7.3-patch.zip`
- 체크섬: `SoriON-AI-0.7.3-artifacts.sha256`
- 패치 기준 버전: `0.7.2`
- 핵심 확인: MASTER HANDOVER 필독, 기능 코드는 0.7.2와 동일
- 삭제 파일: 없음



## 0.8.0 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.8.0-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.7.3-to-0.8.0-patch.zip`
- 핵심 확인: 초기 랜딩 유지, ChatGPT형 composer, CapCut형 타임라인, 첫 블록 재생
- 패치 기준 버전: `0.7.3`
- 삭제 파일: 없음


## 0.8.1 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.8.1-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.8.0-to-0.8.1-patch.zip`
- 체크섬: `SoriON-AI-0.8.1-artifacts.sha256`
- 핵심 확인: 모바일 API 주소 복구, 네 계층 엔진 상태, TTS job 결과 복구, PNA CORS
- 패치 기준 버전: `0.8.0`
- Secret, 사용자 음성, 모델 가중치, `.git`, 캐시와 빌드 산출물은 포함하지 않는다.

## 0.8.2 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.8.2-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.8.1-to-0.8.2-patch.zip`
- 체크섬: `SoriON-AI-0.8.2-artifacts.sha256`
- 핵심 확인: job 단일 실행·완료 결과 재사용·payload 충돌 차단·모바일 recover-first
- 패치 기준 버전: `0.8.1`
- 삭제 파일: 없음
- Secret, 사용자 음성, 모델 가중치, `.git`, 캐시와 빌드 산출물은 포함하지 않는다.

## 0.8.2 API PNA CI 핫픽스

- 전체 통파일 ZIP: `SoriON-AI-0.8.2-full-pna-hotfix.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.8.2-pna-hotfix-patch.zip`
- 체크섬: `SoriON-AI-0.8.2-pna-hotfix-artifacts.sha256`
- 패치 기준: 첫 0.8.2 CI 핫픽스 적용본
- 핵심 확인: Python 3.10 PNA preflight 200, 잘못된 Origin·비활성화 400
- 삭제 파일: 없음

## 0.8.3 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.8.3-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.8.2-to-0.8.3-patch.zip`
- 체크섬: `SoriON-AI-0.8.3-artifacts.sha256`
- 패치 기준: `0.8.2`이며 직전 CI 안정화 수정도 포함한다.
- 주요 변경: SQLite JobStore, API 재시작 결과 복구, 원자적 claim, TTL tombstone,
  cross-process 취소, TTL 조회 정리, 77개 API 회귀 테스트.
- 삭제 대상: 없음. 저장소에 별도로 존재하는 모델·DB archive ZIP은 패치에 포함하지 않는다.

## 0.8.4 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.8.4-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.8.3-to-0.8.4-patch.zip`
- 체크섬: `SoriON-AI-0.8.4-artifacts.sha256`
- 패치 기준: `0.8.3`
- 주요 변경: 자동 API·엔진 bootstrap, 수동 연결 UI 제거, 첫 랜딩 Dock 비노출,
  프로젝트 클릭 복원과 저장 job 결과 recover-first
- 삭제 대상: `ApiSetupWizard.tsx`, `ConnectionBottomSheet.tsx`, `EngineStatusCard.tsx`,
  `connection-sheet.css`
- Secret, 사용자 음성, 모델 가중치, `.git`, 캐시, 실행 DB와 빌드 산출물은 포함하지 않는다.

## 0.8.5 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.8.5-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.8.4-to-0.8.5-patch.zip`
- 체크섬: `SoriON-AI-0.8.5-artifacts.sha256`
- 기준 버전: `0.8.4`
- 주요 범위: 공통 작업공간 UX·IA, 엔진 자동 fallback, circuit breaker와 진단

## 0.8.5 CI 핫픽스

- 전체 통파일 ZIP: `SoriON-AI-0.8.5-ci-hotfix-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.8.5-ci-hotfix-patch.zip`
- 체크섬: `SoriON-AI-0.8.5-ci-hotfix-artifacts.sha256`
- 기준 버전: `0.8.5`
- 주요 변경: Ruff UP035, HomePage Effect 의존성, 누적 저장소의 수동 연결 UI 잔존 파일 정리
- 삭제 대상: `ApiSetupWizard.tsx`, `ConnectionBottomSheet.tsx`, `EngineStatusCard.tsx`, `connection-sheet.css`

## 0.8.6 릴리스

- 기준: `SoriON-AI-0.8.5-ci-hotfix-full.zip`
- 장문 내용 편집기, 공식 아이콘, 상단 브랜드 홈 이동과 종료 확인 UX
- GitHub Pages API 오탐 차단과 Actions 공개 API 변수 주입
- IndexedDB 작업공간 세션·revision·recover-first 복원
- 삭제 대상: ChatComposer, ConversationPanel, mobile-workspace.css, CHAT_TIMELINE_WORKSPACE.md
- API 90개·Worker 9개 및 Web quality 통과 후 배포
- 전체 통파일 ZIP과 덮어쓰기용 패치 ZIP, 검증 보고서, SHA-256을 함께 전달

## 0.8.7 릴리스

- 기준: `SoriON-AI-0.8.6-full.zip`
- 전체 통파일 ZIP: `SoriON-AI-0.8.7-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.8.6-to-0.8.7-patch.zip`
- 프로젝트 상단바, 화자·설정 Sheet, 세로형 대사 블록과 하단 고정 플레이어
- 장문·세션·자동 엔진 연결 계약 유지
- 삭제 대상 없음

## 0.8.7 Web quality CI 핫픽스

- 전체 통파일 ZIP: `SoriON-AI-0.8.7-ci-hotfix-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.8.7-ci-hotfix-patch.zip`
- 패치 기준 버전: `0.8.7`
- 목적: TimelineEditor의 중복 접근성 이름으로 인한 Vitest 단일 요소 조회 실패 수정
- 삭제 파일: 없음

## 0.8.7 Web quality CI 핫픽스 2

- 전체 통파일 ZIP: `SoriON-AI-0.8.7-ci-hotfix-2-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.8.7-ci-hotfix-to-0.8.7-ci-hotfix-2-patch.zip`
- 패치 기준 버전: `0.8.7-ci-hotfix`
- 목적: 현재 화자 선택과 미리듣기 버튼의 부분 접근성 이름 충돌 수정
- 삭제 파일: 없음
## 0.8.7 Web quality CI 핫픽스 3

- 전체 통파일 ZIP: `SoriON-AI-0.8.7-ci-hotfix-3-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.8.7-ci-hotfix-2-to-0.8.7-ci-hotfix-3-patch.zip`
- 패치 기준 버전: `0.8.7-ci-hotfix-2`
- 목적: `details/summary` 메뉴의 JSDOM 열림 상태 불일치로 인한 Header Vitest 실패 수정
- 추가 보호: 프로젝트·대사 메뉴를 명시적 상태 버튼으로 통일하고 재도입 방지 규칙 추가
- 삭제 파일: 없음

## 0.8.7 Web quality CI 핫픽스 4

- 전체 통파일 ZIP: `SoriON-AI-0.8.7-ci-hotfix-4-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.8.7-ci-hotfix-3-to-0.8.7-ci-hotfix-4-patch.zip`
- 패치 기준 버전: `0.8.7-ci-hotfix-3`
- 목적: popstate React 상태 갱신 타이밍과 장문 placeholder 카피 결합으로 인한 Vitest 실패 수정
- 추가 보호: Web 테스트 계약 정적 검사 추가
- 삭제 파일: 없음

## 0.8.8 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.8.8-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.8.7-ci-hotfix-4-to-0.8.8-patch.zip`
- 패치 기준 버전: `0.8.7-ci-hotfix-4`
- 범위: 공통 상단 배너 복원, 사용자 제공 PNG 공식 로고, Browser Voice 자동 대체 재생
- 삭제 파일: `public/sorion-icon.svg`
- 실제 AI·WAV·복제 기능은 별도 공개 HTTPS Voice API가 필요

## 0.8.9 릴리스

- 기준: `SoriON-AI-0.8.8-full.zip`
- 전체 통파일 ZIP: `SoriON-AI-0.8.9-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.8.8-to-0.8.9-patch.zip`
- 범위: 공통 제품 셸, 한국어 Premium TTS Adapter Mesh, 자동 API 다중 후보 장애 전환
- 삭제 파일: 없음

## 0.9.0 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.9.0-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.8.9-to-0.9.0-patch.zip`
- 패치 기준 버전: `0.8.9`
- 핵심 확인: 무료 전용 엔진 정책, 과금형 Adapter opt-in, TTS job SSE와 polling fallback
- 삭제 파일: 없음
- 모델 가중치, Secret, 사용자 음성, 실행 DB와 캐시는 포함하지 않는다.

## 0.9.1 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.9.1-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.9.0-to-0.9.1-patch.zip`
- 패치 기준 버전: `0.9.0`
- 범위: 무료 전용 Adapter 허용 목록, Firebase Hosting Spark 경계, 데스크톱 localhost 자동 연결
- 삭제 대상: 외부 음성 Adapter 5개, 관련 테스트 1개, 이전 무료 우선 정책 문서 1개
- 모델 가중치, Secret, 사용자 음성, 실행 DB와 캐시는 포함하지 않는다.


## 0.9.2 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.9.2-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.9.1-to-0.9.2-patch.zip`
- 패치 기준 버전: `0.9.1`
- 범위: 무료 한국어 엔진 카탈로그, Rule Director, 설정 화면 blueprint, 라이선스·자동 후보 게이트
- 삭제 파일: 없음
- 모델 가중치, Secret, 사용자 음성, 실행 DB와 캐시는 포함하지 않는다.

## 0.9.2 CI Hotfix 2

- 전체 통파일 ZIP: `SoriON-AI-0.9.2-ci-hotfix-2-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.9.2-ci-hotfix-to-0.9.2-ci-hotfix-2-patch.zip`
- 패치 기준 버전: `0.9.2-ci-hotfix`
- 목적: 누적 저장소에 남은 `public/sorion-icon.svg`로 인한 Web quality 규칙 실패 제거
- 삭제 파일: `public/sorion-icon.svg`
- 적용 스크립트: `docs/patches/0.9.2-ci-hotfix-2/APPLY_HOTFIX.cmd` 또는 `.sh`

## 0.9.3-alpha.1 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.9.3-alpha.1-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.9.2-ci-hotfix-2-to-0.9.3-alpha.1-patch.zip`
- 패치 기준 버전: `0.9.2 CI Hotfix 2`
- 범위: 모델 매니페스트·라이선스 동의·SHA-256·하드웨어 프로필 기반 Worker readiness
- 삭제 파일: 없음
- 실제 모델 가중치, 사용자 동의값, Secret, 사용자 음성, 실행 DB와 캐시는 포함하지 않는다.
- alpha 단계에서는 모델 다운로드를 자동 실행하지 않으며 사용자가 확인한 로컬 파일만 검증한다.

## 0.9.3-alpha.2 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.9.3-alpha.2-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.9.3-alpha.1-to-0.9.3-alpha.2-patch.zip`
- 패치 기준 버전: `0.9.3-alpha.1`
- 목적: Vite 8 중심 Web quality 의존성·peer·CI 설치 그래프 안정화
- 삭제 파일: 없음
- 실제 npm install·lint·typecheck·Vitest·build는 공용 registry가 가능한 GitHub Actions에서 최종 확인


## 0.9.3-alpha.3 lock 전환 패치

- 전체 후보본 ZIP: `SoriON-AI-0.9.3-alpha.3-lock-bootstrap-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.9.3-alpha.2-to-0.9.3-alpha.3-lock-bootstrap-patch.zip`
- 패치 기준 버전: `0.9.3-alpha.2`
- 목적: 실제 registry 설치 증거로 npm·uv lock을 생성하고 일반 CI를 frozen install로 전환
- 당시 최초 적용은 `generate_lockfiles=true` 수동 실행을 요구했다.
- 이 동작은 `0.9.3-beta.1 CI Hotfix 1`에서 누락 lock 자동 bootstrap으로 대체됐다.
- 삭제 파일: 없음


## 0.9.3-beta.1 릴리스 후보

- 전체 통파일 ZIP: `SoriON-AI-0.9.3-beta.1-full.zip`
- 누적 패치 ZIP: `SoriON-AI-0.9.3-alpha.2-to-0.9.3-beta.1-patch.zip`
- 기준 버전: 사용자의 현재 CI 로그 기준 `0.9.3-alpha.2`
- 범위: 삭제 파일 재발 차단, 실기기 측정 기록, STT CER·WER, WAV·MP3·SRT·VTT Export
- 삭제 파일: `public/sorion-icon.svg`
- 패치는 반드시 `APPLY_PATCH.cmd` 또는 `APPLY_PATCH.sh`로 적용한다.
- 실제 실기기 수치와 Faster Whisper 모델은 포함하지 않는다.


## 0.9.3-beta.1 CI Hotfix 1

- 전체 후보본 ZIP: `SoriON-AI-0.9.3-beta.1-ci-hotfix-1-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.9.3-beta.1-to-0.9.3-beta.1-ci-hotfix-1-patch.zip`
- 기준 버전: `0.9.3-beta.1`
- 목적: lock 파일이 없는 최초 push에서 CI가 생성 전에 실패하는 bootstrap deadlock 제거
- 누락 lock은 Actions에서 자동 생성·감사해 같은 workflow에 전달
- 기존 lock은 자동 재작성하지 않고 strict verify
- 삭제 파일: 없음


## 0.9.3-beta.1 CI Hotfix 2

- 전체 통파일 ZIP: `SoriON-AI-0.9.3-beta.1-ci-hotfix-2-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.9.3-beta.1-ci-hotfix-1-to-ci-hotfix-2-patch.zip`
- 기준 버전: `0.9.3-beta.1 CI Hotfix 1`
- 목적: Ruff I001, Web TypeScript mock 호출 타입, React Hook 의존성과 Node 20 Artifact Action 경고 수정
- Artifact Action: `actions/upload-artifact@v7`, `actions/download-artifact@v8`
- 삭제 파일: 없음

## 0.9.3-beta.2

- 전체 통파일 ZIP: `SoriON-AI-0.9.3-beta.2-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.9.3-beta.1-ci-hotfix-2-to-0.9.3-beta.2-patch.zip`
- 기준 버전: `0.9.3-beta.1 CI Hotfix 2`
- 핵심: registry 일시 장애 재시도·부분 npm cache 보존, 실기기 측정표, 실패 문장 선택 STT 재생성.
- 패치에는 stale SVG 삭제 목록과 Windows·macOS/Linux 적용 스크립트를 포함한다.

## 0.9.5 Benchmark Baseline & Privacy-Safe Audit Bundle

- 전체 통파일 ZIP: `SoriON-AI-0.9.5-benchmark-privacy-audit-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.9.4-to-0.9.5-benchmark-privacy-audit-patch.zip`
- 기준 버전: `0.9.4`
- 핵심: Worker 비중첩 기준선·회귀 경보, 개인정보 제외 승인·신뢰 키·성능 감사 JSON
- 삭제 파일: 없음
- 다음 제품 버전: `0.9.6`

## 0.9.7 Natural Playback Controls

- 전체 통파일 ZIP: `SoriON-AI-0.9.7-natural-playback-controls-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.9.6-to-0.9.7-natural-playback-controls-patch.zip`
- 기준 버전: `0.9.6`
- 핵심: 재생 클릭 즉시 일시정지 전환, 준비 중 재생 취소, Browser Speech 늦은 callback 차단
- 삭제 파일: 없음
- 다음 제품 버전: `0.9.8`


## 0.9.8 Quality Gate Compatibility

- 전체 통파일 ZIP: `SoriON-AI-0.9.8-quality-gate-compatibility-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.9.7-to-0.9.8-quality-gate-compatibility-patch.zip`
- 기준 버전: `0.9.7`
- 핵심: Ruff 최신 규칙 10건, Web TypeScript 계약 2건, 재유입 preflight
- 삭제 파일: 없음
- 다음 제품 버전: `0.9.9`
## 0.10.0 Always-on Preset Runtime & PC Three-Pane

- 전체 통파일 ZIP: `SoriON-AI-0.10.0-always-on-preset-pc-three-pane-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.9.9-to-0.10.0-always-on-preset-pc-three-pane-patch.zip`
- 프리셋 미리듣기 내부 대기열·자동 재연결·점진 재시도
- 일반 화면 엔진 연결 상태 비노출
- 12초/45초 heartbeat와 60초 전체 점검
- 1024px PC 3분할과 v2 기본 펼침 레이아웃

## 0.9.9 CI Quality Hotfix

- 전체 통파일 ZIP: `SoriON-AI-0.9.9-ci-quality-hotfix-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.9.8-to-0.9.9-ci-quality-hotfix-patch.zip`
- 기준 버전: `0.9.8`
- 핵심: Ruff I001 import 순서 복구, LinkedPlayerDock mock 기준점 분리, 재발 방지 preflight
- 삭제 파일: 없음
- 다음 제품 버전: `0.10.0`

## 0.10.1 Approval Modularization & Operator Baselines

- 전체 통파일 ZIP: `SoriON-AI-0.10.1-approval-modularization-operator-baselines-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.10.0-to-0.10.1-approval-modularization-operator-baselines-patch.zip`
- 기준 버전: `0.10.0`
- 핵심: 승인 서비스 책임 분리, 운영자 확정 최근 5건 기준선, 교체·폐기 history, 자동 기준선과 별도 회귀 판정
- 삭제 파일: 없음
- 다음 제품 버전: `0.10.2`


## 0.10.1 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.10.1-approval-modularization-operator-baselines-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.10.0-to-0.10.1-approval-modularization-operator-baselines-patch.zip`
- 패치 기준 버전: `0.10.0`
- 핵심 확인: 승인 서비스 책임 분리, 기존 writer 안전 계약 유지, 운영자 기준선 확정·교체·폐기와 자동 기준선 분리 표시
- 삭제 파일: 없음

## 0.10.2 Recovery Soak & Managed Lock Interface

- 전체 통파일 ZIP: `SoriON-AI-0.10.2-recovery-soak-managed-lock-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.10.1-to-0.10.2-recovery-soak-managed-lock-patch.zip`
- 기준 버전: `0.10.1`
- 핵심: 이전 soak 비교, Worker 실제 재시작 복구, writer lease backend interface, PC 3분할 폭 회귀 계약
- 삭제 파일: 없음
- 다음 제품 버전: `0.10.3`


## 0.11.14 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.11.14-all-workflows-hardening-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.11.13-to-0.11.14-all-workflows-hardening-patch.zip`
- 기준 버전: `0.11.13 · Focused Creation Surface`
- 핵심 확인: GitHub Actions major 갱신, ref-safe manual concurrency, committed API/Worker uv lock gate, lock-hash npm cache, Dependabot uv/Actions 추적, 실패 evidence 보존
- 삭제 대상: 없음
## 0.11.15 릴리스

- 전체 통파일 ZIP: `SoriON-AI-0.11.15-pc-editor-clarity-full.zip`
- 덮어쓰기용 패치 ZIP: `SoriON-AI-0.11.14-to-0.11.15-pc-editor-clarity-patch.zip`
- 기준 버전: `0.11.14 · All Workflows Reliability Hardening` + Web quality test hotfix
- 핵심 확인: compact Voice Core/Voice Picker, dialogue track 우선 순서, Dock과 동일 store를 쓰는 Timeline Linked Player, 겹침 없는 sidebar toggle, Timeline에서 분리된 상단 final export
- 삭제 대상: 없음
- 다음 제품 버전: `0.11.16`

