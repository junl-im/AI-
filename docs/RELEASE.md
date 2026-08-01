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
- 장문 원고 편집기, 공식 아이콘, 상단 브랜드 홈 이동과 종료 확인 UX
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

