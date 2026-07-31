# HANDOVER

## 2026-07-31 10:54 KST — Foundation 시작

### 작업 내용

- 기존 프로젝트를 전면 폐기하고 `SoriON AI`를 새 코드베이스로 생성했다.
- 웹과 AI API를 루트 웹앱과 `services/api`로 분리했다.
- 모바일 홈, 프로젝트, 설정 화면을 만들었다.
- Mock TTS 엔진으로 웹–API 계약을 검증할 수 있게 했다.
- 음성 생성 요청 후 프로젝트 메타데이터를 IndexedDB에 저장하도록 했다.
- Firebase는 환경 변수가 있을 때만 초기화되도록 구성했다.
- PWA Manifest와 PNG 아이콘 구조를 추가했다.
- CI, Git 규칙, 500줄 제한과 SVG 금지 검사를 추가했다.

### 작업 이유

기존 코드의 전역 결합과 누적 패치 문제를 이어받지 않고, 실제 AI 엔진을 안전하게 교체할 수 있는 확장 기반을 먼저 만들기 위해서다.

### 영향 범위

- 신규 저장소 전체
- 아직 운영 데이터와 외부 서비스에는 영향 없음
- Mock 엔진은 음원 파일을 만들지 않음

### 검증 결과

- FastAPI 테스트 통과
- 프로젝트 규칙 검사 통과
- 프런트엔드 소스와 설정 생성 완료
- 작업 환경의 npm 레지스트리 제한으로 의존성 설치와 Vite 빌드는 현 환경에서 실행하지 못함

### 다음 작업

1. 개발 PC에서 `npm install` 후 프런트엔드 품질 검사
2. Firebase 개발 프로젝트 연결
3. `feature/tts-engine-kokoro`에서 첫 실제 TTS 어댑터 구현
4. WAV 플레이어와 다운로드 구현

### 주의사항

- `MockTtsEngine`의 응답을 실제 음성 생성 완료로 표시하지 않는다.
- 음성 복제 기능을 추가할 때 동의 증빙과 삭제 정책을 먼저 설계한다.
- 모델 파일과 사용자 음성 파일은 Git에 커밋하지 않는다.

## 2026-07-31 11:25 KST - 0.1.1 구조 수정

- 변경: `apps/web` 아래에 있던 웹앱을 저장소 루트로 이동했다.
- 이유: 첫 전달본에서 `index.html` 위치가 직관적이지 않았고 사용자가 누락으로 인식할 수 있었다.
- 영향: 이제 압축 해제 후 루트의 `index.html`과 `src/`를 바로 확인할 수 있다.
- 실행: 루트에서 `npm install` 후 `npm run dev`를 사용한다.
- 배포: Firebase Hosting은 루트 빌드 결과인 `dist/`만 배포한다.

## 2026-07-31 11:38 KST - GitHub Actions 트리거 수정

- 변경: `.github/workflows/ci.yml`에 `workflow_dispatch`와 전체 브랜치 `push` 트리거를 추가했다.
- 이유: 초기 커밋이 `main` 또는 기존 브랜치에 push될 때 CI가 실행되지 않아 Actions의 All workflows가 비어 보였다.
- 영향: 앞으로 어떤 브랜치에 push해도 CI 실행 기록이 생성된다. PR 검사는 `main`, `develop` 대상으로 유지한다.
- 추가: package-lock이 없는 상태에서 npm 캐시 탐색이 실패할 수 있어 초기 단계에서는 cache 옵션을 제거했다.

## 2026-07-31 11:45 KST - 0.1.3 브랜드 상단 계승

### 변경 내용

- 기존 프로젝트의 코드와 기능은 가져오지 않고 상단 디자인의 시각 문법만 새 React 컴포넌트로 다시 작성했다.
- 상단 왼쪽에 `BUILD v0.1.3`, `모바일 · PC 호환`을 배치했다.
- 상단 오른쪽에 `DESIGNED BY 곰같은여우`를 배치했다.
- 대문 공식 명칭을 `곰같은여우 SoriON AI`로 적용했다.
- 모바일에서는 브랜드와 4단계 흐름만 간결하게 표시하고, 760px 이상에서는 Voice Core 장식 패널을 추가한다.

### 변경 이유

기존 프로젝트의 인지 자산인 빌드 정보, 호환성 표시, 제작자 서명을 계승하면서도 새로운 음성 플랫폼의 독립적인 브랜드를 만들기 위해서다.

### 영향 범위

- 앱 공통 레이아웃
- 홈 첫 화면 문구
- 브라우저 제목과 PWA Manifest
- 브랜드 렌더링 테스트

### 주의사항

- 기존 프로젝트의 CSS, 이미지, 스크립트는 복사하지 않았다.
- 장식 패널은 CSS로만 만들었으며 SVG 금지 원칙을 유지했다.
- 실제 엔진 상태를 의미하지 않도록 Voice Core 패널은 `aria-hidden` 장식 요소로 처리했다.

## 2026-07-31 11:51 KST - 0.1.4 전달·인수인계 절대 규칙 확정

### 대상 버전과 기준 버전

- 기준 버전: `0.1.3`
- 대상 버전: `0.1.4`

### 변경 내용

- 모든 최종 결과를 `1. 결과`, `2. 전체 통파일 ZIP과 덮어쓰기용 패치 ZIP`, `3. 다음 예상 업데이트 내역` 순서로 전달하도록 영구 규칙을 추가했다.
- 루트에 `DELIVERY_RULES.md`를 추가했다.
- 다음 개발 계획을 지속적으로 보존하는 `docs/NEXT_UPDATE.md`를 추가했다.
- 프로젝트 규칙 검사에서 전달 규칙 문서, 현재 버전의 HANDOVER·CHANGELOG, 다음 업데이트 문서를 확인하도록 강화했다.
- Pull Request와 Release 문서에 인수인계·전체 ZIP·패치 ZIP 확인 항목을 추가했다.

### 변경 이유

결과 파일의 누락, 구조 혼동, 다음 대화에서의 작업 단절을 방지하고 사용자가 항상 전체본과 안전한 덮어쓰기 패치를 함께 받을 수 있게 하기 위해서다.

### 영향 범위

- 결과 전달 형식
- 릴리스 산출물
- 인수인계 문서
- 프로젝트 자동 규칙 검사
- Pull Request 검토 절차

### 변경·추가된 주요 파일

- `DELIVERY_RULES.md`
- `docs/NEXT_UPDATE.md`
- `docs/HANDOVER.md`
- `docs/CHANGELOG.md`
- `docs/RELEASE.md`
- `docs/CODING_RULE.md`
- `.github/pull_request_template.md`
- `scripts/check-project-rules.mjs`
- 버전 표시 및 API 버전 파일

### 검증 결과

- 프로젝트 규칙 검사 통과
- FastAPI 테스트 통과
- 전체 ZIP에 `.git`, `node_modules`, `dist`가 포함되지 않음을 확인
- 패치 ZIP이 저장소 루트 기준 경로로 구성됐음을 확인

### 알려진 제한과 주의사항

- 패치 ZIP은 `0.1.3`을 기준으로 한다. 더 오래된 버전에는 전체 통파일 사용을 권장한다.
- 로컬에서 수정 중인 파일이 있으면 패치 적용 전에 커밋하거나 백업해야 한다.
- npm 의존성 설치와 프런트 빌드는 기존과 동일하게 일반 개발 PC에서 추가 확인이 필요하다.

### 생성 산출물

- 전체: `SoriON-AI-0.1.4-full.zip`
- 패치: `SoriON-AI-0.1.3-to-0.1.4-patch.zip`
- 체크섬: `SoriON-AI-0.1.4-artifacts.sha256`

### 다음 예상 업데이트

`0.2.0 Mobile Voice Workspace`에서 모바일 텍스트 입력, 한국어 음성 프리셋, 생성 상태, 오디오 플레이어 셸, WAV 다운로드 흐름을 구축한다.

## 2026-07-31 12:00 KST - 0.1.5 GitHub Pages 배포 복구

### 대상 버전과 기준 버전

- 실제 GitHub 기준 버전: `0.1.2`
- 전체 프로젝트 기준 버전: `0.1.4`
- 대상 버전: `0.1.5`

### 변경 내용

- `main` Push에서 Vite 앱을 빌드하고 `dist/`를 GitHub Pages에 배포하는 전용 워크플로를 추가했다.
- 저장소명 `AI-`에 맞춰 배포 base를 `/AI-/`로 설정했다.
- PWA Manifest, 아이콘, Service Worker 탐색 fallback을 프로젝트 하위 경로에 맞췄다.
- 이전 PWA 캐시를 정리하고 새 서비스워커가 즉시 활성화되도록 설정했다.
- GitHub Pages 게시 소스를 `GitHub Actions`로 선택하는 최초 1회 절차를 문서화했다.

### 변경 이유

새 SoriON 소스와 CI는 GitHub에 반영됐지만 Pages 배포 작업이 없어 마지막 성공 배포본인 AI 쇼츠 스튜디오가 계속 서비스되고 있었다. `.git` 폴더는 원인이 아니며, 배포 산출물과 프로젝트 하위 경로 설정이 빠진 것이 원인이었다.

### 영향 범위

- GitHub Actions 배포
- Vite production base 경로
- PWA Manifest와 Service Worker
- favicon과 정적 자산 경로
- 릴리스·시작·배포 문서

### 변경·추가된 주요 파일

- `.github/workflows/deploy-pages.yml`
- `vite.config.ts`
- `index.html`
- `docs/GITHUB_PAGES.md`
- `docs/HANDOVER.md`
- `docs/CHANGELOG.md`
- `docs/NEXT_UPDATE.md`
- `docs/RELEASE.md`
- `README.md`
- `START_HERE.md`

### 검증 결과

- 프로젝트 규칙 검사 통과
- FastAPI 테스트 통과
- YAML 구조와 Pages 필수 권한·아티팩트 경로 검사 통과
- 전체 ZIP과 실제 GitHub `0.1.2` 기준 패치 ZIP 경로 검사 통과
- 실제 GitHub 원격 배포는 사용자의 Push와 Pages Source 설정 후 확인해야 함

### 알려진 제한과 주의사항

- GitHub의 `Settings → Pages → Source`가 반드시 `GitHub Actions`여야 한다.
- 배포 성공 후 특정 기기에서만 이전 화면이 남으면 기존 서비스워커 사이트 데이터를 한 번 삭제해야 한다.
- 저장소명을 변경하면 워크플로의 `VITE_BASE_PATH`도 함께 변경해야 한다.
- GitHub 원격에는 현재 `0.1.2`까지만 확인되어 패치는 `0.1.2 → 0.1.5` 기준으로 제작한다.

### 생성 산출물

- 전체: `SoriON-AI-0.1.5-full.zip`
- 패치: `SoriON-AI-0.1.2-to-0.1.5-pages-fix-patch.zip`
- 체크섬: `SoriON-AI-0.1.5-artifacts.sha256`

### 다음 예상 업데이트

GitHub Pages 실제 배포 성공과 모바일 캐시 교체를 확인한 뒤 `0.2.0 Mobile Voice Workspace` 개발로 진행한다.

