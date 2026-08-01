# SoriON AI 0.8.4 Result Report

작업 일시: 2026-08-01 15:30 KST
기준 버전: 0.8.3 Persistent Job Store/Atomic Claim
결과 버전: 0.8.4 Automatic Engine Bootstrap & Project Restore

## 1. 결과

이번 패치는 사용자가 API 주소나 음성 엔진을 직접 연결하는 흐름을 제거했다. 앱은 시작과
네트워크·포그라운드 복귀 때 배포 설정과 안전한 후보를 자동 탐색하고, 준비된 실제 엔진을
자동 선택한다. 연결 상태는 진단 정보로만 표시하며 주소 입력창이나 연결 Bottom Sheet는
노출하지 않는다.

초기 브랜드 랜딩에서는 Dock과 메뉴를 렌더링하지 않는다. 사용자가 만들기 작업공간이나
저장 프로젝트에 진입한 뒤에만 Dock을 표시하며, 음성이 준비되면 Player가 메뉴 위에 붙는다.

프로젝트 목록은 단순 표시에서 실제 불러오기 동작으로 변경했다. 저장된 채팅, 선택 보이스,
타임라인과 job ID를 복원하며 유효한 서버 결과가 있으면 새 합성 POST 없이 먼저 회수한다.

## 2. 구현 내용

### 자동 엔진/API 연결

- 같은 Origin의 `/api/v1`, `VITE_API_BASE_URL`, 마지막 성공 주소와 안전한 로컬 후보 순으로 탐색
- 성공한 API 주소를 내부 저장하고 API·TTS·Worker·GPU readiness 검사
- 준비된 실제 TTS 엔진 자동 선택
- online, 네트워크 변경, visibility 복귀와 단계적 backoff에서 자동 재탐색
- 전체 LAN 대역 무단 스캔 금지
- 수동 주소 입력·연결 설정·엔진 선택 Bottom Sheet 제거

### 첫 화면 Dock 비노출

- `workspaceEntered=false`인 브랜드 랜딩에서 Dock 자체를 렌더링하지 않음
- 작업공간 진입 뒤 메뉴 Dock 표시
- ready 음성이 생기면 기존 Linked Player를 메뉴 위에 표시
- 랜딩에 큐 데이터가 남아 있어도 `--has-player` 레이아웃을 적용하지 않음

### 프로젝트 불러오기

- 프로젝트 목록 항목 전체를 접근 가능한 불러오기 버튼으로 변경
- 저장된 메시지, 보이스, 속도, 한국어 정규화 옵션과 타임라인 순서 복원
- 문장 위치와 `jobIds`의 null 자리를 함께 보존해 부분 실패 뒤 ID가 이동하지 않도록 처리
- 복원 시 `/jobs/{id}`와 `/result`를 먼저 조회하고 새 합성은 보내지 않음
- 404·410 또는 만료 결과는 자동 재생성하지 않고 블록별 재생성 안내

## 3. 주요 변경 파일

- `src/api/httpClient.ts`
- `src/hooks/useBackendBootstrap.ts`
- `src/hooks/useEngineCatalog.ts`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/CompactWorkspaceHeader.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/ProjectsPage.tsx`
- `src/hooks/useTimelineGeneration.ts`
- `src/store/useAppStore.ts`
- `src/projects/projectTypes.ts`
- 관련 Web 테스트, 문서와 프로젝트 규칙

삭제 파일:

- `src/components/settings/ApiSetupWizard.tsx`
- `src/components/settings/ConnectionBottomSheet.tsx`
- `src/components/voice/EngineStatusCard.tsx`
- `src/styles/connection-sheet.css`

## 4. 검증

통과:

- FastAPI pytest: 77 passed
- CosyVoice Worker pytest: 9 passed
- 프로젝트 규칙 검사
- Python compileall
- TypeScript·TSX 108개 파일 구문 파싱
- 외부 모듈 shim 기반 strict 타입 참조 검사
- JSON·YAML 구문과 `git diff --check`
- 프로젝트 불러오기, recover-first, 랜딩 Dock 비노출 회귀 테스트 작성

실행하지 못함:

- 공식 ESLint, TypeScript project build, Vitest, Vite build
- 현재 환경의 내부 npm registry는 필수 패키지를 404로 반환했고 public registry 설치는 timeout 됨
- 위 항목은 GitHub Actions의 Web quality 단계에서 최종 확인해야 함

## 5. 알려진 제한

- GitHub Pages에는 FastAPI와 GPU Worker가 포함되지 않으므로 배포 시 `VITE_API_BASE_URL`에
  공개 HTTPS API를 주입하거나 같은 Origin reverse proxy를 구성해야 한다.
- 브라우저 정책상 HTTPS Web에서 HTTP LAN API를 호출할 수 없는 환경은 자동 연결로 우회할 수 없다.
- 실제 CosyVoice 모델, CUDA와 모델 가중치는 릴리스 ZIP에 포함되지 않는다.
- 프로젝트는 저장된 편집 상태를 불러오지만 마지막 열린 작업공간의 자동 저장·자동 복원은 0.8.5 대상이다.

## 6. 산출물

- `SoriON-AI-0.8.4-full.zip`
- `SoriON-AI-0.8.3-to-0.8.4-patch.zip`
- `SoriON-AI-0.8.4-artifacts.sha256`
- `SoriON-AI-0.8.4-verification-report.txt`
- `docs/patches/0.8.4/PATCH_README.md`
- `docs/patches/0.8.4/PATCH_MANIFEST.txt`
- `docs/patches/0.8.4/DELETE_LIST.txt`

## 7. 다음 목표

`0.8.5 Mobile Workspace Session Persistence`

- 열린 채팅·타임라인을 IndexedDB에 자동 저장
- 새로고침·PWA 종료 뒤 마지막 작업공간 자동 복원
- 서버 job 결과와 브라우저 편집 revision 안전 재연결
- quota, private mode, iOS 저장소 정리 fallback
