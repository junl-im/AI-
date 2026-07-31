# SoriON AI Foundation Report

작성 시각: 2026-07-31 10:54 KST
버전: 0.1.0

## 완료

- 기존 프로젝트 코드와 분리된 신규 저장소 구조
- 모바일 우선 React PWA 화면
- 한국어 TTS 요청 폼과 Advanced 설정
- FastAPI 엔진 레지스트리와 Mock TTS 어댑터
- IndexedDB 프로젝트 자동 저장
- Firebase Google 로그인용 선택형 어댑터
- PWA PNG 아이콘과 Manifest
- Firebase Hosting의 `dist` 전용 배포 설정
- GitHub Actions, Dependabot, Pull Request 템플릿
- 500줄 제한, SVG 금지, 대표 비밀키 패턴 자동 검사
- 필수 프로젝트 문서 13종과 GitHub Desktop 안내

## 검증

- `node scripts/check-project-rules.mjs`: 통과
- `python -m pytest services/api/tests -q`: 3개 통과
- TypeScript/TSX 구문 변환 검사: 통과
- PNG 아이콘 형식 확인: 통과

## 현 환경에서 실행하지 못한 항목

작업 컨테이너의 npm 레지스트리가 패키지를 제공하지 않아 `npm install`, 정식 TypeScript typecheck, Vitest, Vite production build는 실행하지 못했다. 소스 구문은 전역 TypeScript 컴파일러의 `transpileModule`로 별도 검사했다.

개발 PC에서 최초로 다음 명령을 실행해야 한다.

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

## 다음 브랜치

`feature/tts-engine-kokoro`

목표는 실제 한국어 TTS 한 개를 공통 엔진 계약에 연결하고 WAV 재생·다운로드까지 완성하는 것이다.

## 0.1.1 전달 구조 수정

웹 시작 파일은 저장소 루트의 `index.html`이다. 웹 소스는 루트 `src/`, 정적 파일은 루트 `public/`에 있다. 실행은 루트에서 `npm install` 후 `npm run dev`로 한다.
