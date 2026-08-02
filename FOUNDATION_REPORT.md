# SoriON AI 0.9.3-alpha.2 Result Report

작업 일시: 2026-08-02 10:25 KST  
기준 버전: **0.9.3-alpha.1 · Verified Local Model Readiness Foundation**  
결과 버전: **0.9.3-alpha.2 · Web Quality Toolchain Stabilization**

## 원인 진단

- Vite 8.2.0과 Vitest 3.1.0의 지원 범위가 맞지 않았다.
- Tailwind Vite plugin 4.1.10은 Vite 8을 peer dependency로 지원하지 않았다.
- TypeScript 5.9.3은 typescript-eslint 8.26.0의 지원 상한 밖이었다.
- React Testing Library 16의 peer dependency인 `@testing-library/dom`이 직접 선언되지 않았다.
- lockfile 없이 caret·tilde 범위를 사용해 같은 커밋도 설치 시점에 따라 상단 의존성이 바뀔 수 있었다.

## 완료

- 직접 npm 의존성을 정확한 버전으로 고정했다.
- Vitest 4.1.10, Tailwind 4.3.3, typescript-eslint 8.65.0으로 호환 조합을 맞췄다.
- `@eslint/js`와 `@testing-library/dom`을 직접 의존성으로 선언했다.
- Node 22.18.0 CI, strict peer dependency, Vite override와 설치 그래프 검사를 추가했다.
- Web 도구체인 manifest·설치 상태 검사 스크립트를 추가했다.
- 136개 TypeScript·TSX 파일의 구문과 상대 import를 별도 검사했다.

## 검증

- Web 도구체인 manifest 검사 통과
- 프로젝트 규칙·무료 전용·엔진 Blueprint·모델 온보딩 검사 통과
- TypeScript·TSX 136개 구문 및 상대 import 검사 통과
- API 100개, Worker 14개 테스트 통과
- 현재 실행 환경의 npm 미러가 패키지를 제공하지 않아 실제 npm install·lint·typecheck·Vitest·Vite build는 GitHub Actions에서 최종 확인해야 한다.

## 제한

- 완전한 transitive dependency 재현을 위한 `package-lock.json`은 네트워크 가능한 환경에서 생성·커밋해야 한다.
- 이번 패치는 직접 의존성 exact pin과 `overrides.vite`로 상단 그래프를 고정하고, lockfile 부재를 CI 경고로 남긴다.
