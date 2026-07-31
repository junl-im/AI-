# SoriON AI 0.5.2 Stability Report

## 목적

0.5.1 배포 후 확인된 GitHub Actions 중복 실행, Python 3.10 API import 실패, Web 컴포넌트 테스트 격리 실패를 수정한다.

## 원인

### 워크플로 중복

- `ci.yml`의 모든 브랜치 Push와 Pull Request 트리거가 열린 PR의 같은 커밋을 두 번 실행할 수 있었다.
- 품질 검사와 Pages 배포를 별도 워크플로로 두면 `main` Push당 프로젝트 실행이 두 개 생겼다.
- 저장소 Pages Source가 브랜치 배포이면 GitHub 관리 `pages-build-deployment`도 별도로 실행된다.

### API quality

프로젝트는 Python 3.10을 지원하지만 `datetime.UTC`는 Python 3.11 이상에서만 제공된다. 모듈 import 단계에서 테스트가 시작되기 전에 실패했다.

### Web quality

Vitest globals가 비활성인 구성에서는 Testing Library 자동 cleanup이 등록되지 않았다. `BrandMasthead.test.tsx`의 첫 번째 렌더가 두 번째 테스트까지 남아 동일 문구가 복수로 검색됐다.

## 수정

- 단일 `SoriON CI & Pages` 워크플로
- Push: `main`; PR 대상: `main`, `develop`
- Web·API 성공 뒤 `main`만 Pages 배포
- Python 3.10 명시 실행과 Ruff 검사
- `timezone.utc` 적용
- `afterEach(cleanup)` 적용
- 단일 워크플로·UTC 호환성 자동 규칙 검사

## 검증

- `npm run quality:rules`: 통과
- FastAPI pytest: 30개 통과
- Python compileall: 통과
- 프로젝트 파일 500줄 제한: 통과
- SVG·비밀키 패턴: 통과
- npm registry 제한으로 정식 Web 의존성 설치와 Vitest·ESLint·Vite build는 로컬 미실행

## 적용 후 필수 설정

GitHub `Settings → Pages → Build and deployment → Source`를 `GitHub Actions`로 설정한다. 패치 사용 시 `node docs/patches/0.5.2/remove-obsolete-files.mjs`를 실행한다.
