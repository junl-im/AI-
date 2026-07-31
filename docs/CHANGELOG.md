# CHANGELOG

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
