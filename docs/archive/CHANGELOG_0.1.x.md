# CHANGELOG 0.1.x Archive

초기 0.1.x 릴리스 기록이다. 최신 변경 이력은 `../CHANGELOG.md`를 참조한다.

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
