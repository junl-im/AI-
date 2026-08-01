# SoriON AI 0.8.5 CI Hotfix Result Report

작업 일시: 2026-08-01 17:21 KST
기준 버전: 0.8.4 Automatic Engine Bootstrap & Project Restore
결과 버전: 0.8.5 Unified Workspace UX & Engine Orchestration + CI Hotfix

## 1. 결과

이번 패치는 화면을 개별 페이지 모음이 아니라 하나의 연속된 음성 제작 작업공간으로 정리했다.
만들기 화면은 메뉴 이동 중에도 유지되므로 작성 중인 채팅과 타임라인이 사라지지 않는다.
품질·프로젝트·설정에는 공통 헤더, 같은 배경과 제목 계층을 적용하고 설정 진입 경로와 프로젝트
로딩·오류·빈 상태를 명시했다. 하단 메뉴와 상단 헤더는 동일한 내비게이션 정의를 공유한다.

엔진 실행은 `EngineOrchestrator`가 담당한다. Web은 일반 합성을 `auto`로 요청하고 API는 준비된
엔진을 운영 우선순위와 기능 적합성으로 정렬한다. 첫 엔진 실패 시 다음 후보로 자동 전환하고,
반복 실패 엔진은 circuit breaker cooldown 동안 제외한다. 품질 진단에는 현재 자동 우선 엔진,
성공·실패·연속 실패와 남은 cooldown이 표시된다.

## 1.1 CI 핫픽스

- Ruff UP035에 맞춰 `Awaitable`, `Callable`을 `collections.abc`로 이동했습니다.
- HomePage 프로젝트 복원 Effect는 안정적인 함수 참조만 의존하도록 수정했습니다.
- 누적 덮어쓰기 설치에 남은 수동 연결 UI 네 파일을 삭제 대상으로 고정했습니다.
- 패치 ZIP은 삭제 전에도 CI가 실패하지 않도록 같은 경로에 무해한 stub을 제공합니다.

## 2. 구현 내용

### 공통 UI·UX·IA

- HomePage를 작업공간 수명 동안 유지해 메뉴 이동 뒤 초안·메시지·타임라인 보존
- 품질·프로젝트·설정에 `WorkspacePageHeader` 공통 컴포넌트 적용
- Compact Header에서 설정 직접 접근, 브랜드 클릭은 만들기로 복귀, `처음`만 랜딩 종료
- 프로젝트 loading, error+retry, empty와 loaded 상태 분리
- `navigationItems.ts`를 메뉴 명칭·순서·페이지 라벨의 단일 원본으로 사용
- 다크 작업공간 안의 이전 라이트 카드 색상 충돌 보정

### 엔진 자동 오케스트레이션

- 준비 상태, AI·Local·Mock 모드, 설정 순서와 요청 기능으로 후보 정렬
- 같은 요청 안에서 엔진 fallback, 실제 시도 순서와 fallback 여부 응답
- 연속 실패 임계치와 cooldown circuit breaker
- `/engines`에 recommended, health, 성공·실패와 마지막 오류 메타데이터 제공
- 품질 연구소에 자동 우선·대체 준비·자동 제외 상태 표시
- 명시 엔진 요청은 해당 엔진만 사용하고 일반 제품 흐름은 `auto`만 사용

## 3. 주요 변경 파일

- `services/api/app/services/engine_orchestrator.py`
- `services/api/app/api/routes/tts.py`
- `services/api/app/api/routes/engines.py`
- `services/api/app/services/engine_diagnostics.py`
- `services/api/app/schemas/engine.py`
- `src/app/App.tsx`
- `src/components/layout/WorkspacePageHeader.tsx`
- `src/components/layout/CompactWorkspaceHeader.tsx`
- `src/navigation/navigationItems.ts`
- `src/pages/ProjectsPage.tsx`
- `src/pages/QualityPage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/components/evaluation/QualityDiagnosticsCard.tsx`
- `src/styles/workspace-shell.css`

## 4. 검증

통과:

- FastAPI pytest: 89 passed
- CosyVoice Worker pytest: 9 passed
- 프로젝트 규칙 검사
- Python compileall과 Python 3.10 AST 호환성 검사
- TypeScript·TSX 110개 파일 구문 파싱
- 상대 import 82개 파일 연결 검사
- 외부 의존성 shim 기반 TypeScript strict 의미·참조 검사
- 생성 화면 상태 보존, 설정 접근, 엔진 fallback·circuit breaker 회귀 테스트
- JSON·YAML 문법, diff whitespace와 패치 동등성 검사

환경 제한:

- 현재 런타임에 Web npm 의존성과 Ruff가 없고 패키지 저장소 DNS 접근이 불가해 공식
  ESLint, TypeScript project build, Vitest, Vite build와 Ruff 명령은 실행하지 못했다.
- 위 항목은 GitHub Actions에서 최종 확인해야 한다.

## 5. 운영 경계

- circuit breaker 상태는 현재 API 프로세스 메모리에 있으며 다중 프로세스 공용 통계는 후속 대상이다.
- 실제 CosyVoice 모델, CUDA와 모델 가중치는 릴리스 ZIP에 포함하지 않는다.
- 등록되지 않았거나 ready가 아닌 전략 엔진을 자동 성공으로 가장하지 않는다.
- 마지막 열린 브라우저 작업공간의 IndexedDB 자동 저장·앱 재시작 복원은 0.8.6 대상이다.

## 6. 산출물

- `SoriON-AI-0.8.5-ci-hotfix-full.zip`
- `SoriON-AI-0.8.5-ci-hotfix-patch.zip`
- `SoriON-AI-0.8.5-ci-hotfix-artifacts.sha256`
- `SoriON-AI-0.8.5-ci-hotfix-verification-report.txt`
- `docs/patches/0.8.5-ci-hotfix/PATCH_README.md`
- `docs/patches/0.8.5-ci-hotfix/PATCH_MANIFEST.txt`
- `docs/patches/0.8.5-ci-hotfix/DELETE_LIST.txt`

## 7. 다음 목표

`0.8.6 Mobile Workspace Session Persistence`

- 열린 채팅·타임라인의 IndexedDB 자동 저장
- 새로고침·PWA 종료 후 마지막 작업공간 자동 복원
- 서버 job, 편집 revision과 Object URL 안전 재연결
- quota, private mode, iOS 저장소 정리 fallback
