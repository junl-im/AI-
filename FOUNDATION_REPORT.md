# SoriON AI 0.11.14 Verification Report

결과 버전: **0.11.14 · All Workflows Reliability Hardening**  
기준 버전: **0.11.13 · Focused Creation Surface**

## 분석 결과

활성 GitHub Actions workflow는 `.github/workflows/ci.yml` 하나이며 Web/API/Worker/Pages를 한 파일에서 관리합니다.
이번 점검에서 다음 운영 위험을 확인하고 수정했습니다.

- 일부 GitHub 공식 Action major가 현재 채택 세대보다 뒤처짐
- manual dispatch concurrency가 서로 다른 ref를 충분히 격리하지 못하고 lock 생성 run도 취소될 수 있음
- npm cache가 run id/attempt마다 새 key를 만들어 동일 lock에서도 불필요하게 누적될 수 있음
- API·Worker uv lock 누락을 일반 CI가 자동 생성해 source reproducibility 문제를 가릴 수 있음
- Dependabot이 Worker uv dependencies와 GitHub Actions를 추적하지 않음
- setup/install 조기 실패 시 evidence 경로 부재가 artifact 업로드의 2차 실패를 만들 수 있음
- Worker recovery drill이 시작되지 않아도 evidence wait가 최대 60초 실행될 수 있음
- 0.11.13 CHANGELOG 누락으로 repository preflight가 작업 시작 시 46/47 상태로 실패함

## 0.11.14 변경

- checkout v7, setup-python v7, upload-artifact v7, download-artifact v8, cache v6으로 갱신
- manual concurrency를 ref/PR 단위로 격리하고 lock 생성/soak를 취소하지 않는 maintenance run으로 분류
- npm cache를 lock hash 기반 안정 key + exact-hit save skip으로 변경
- API/Worker uv lock을 일반 Push/PR에서 committed-lock 필수로 변경
- Dependabot API/Worker를 `uv` ecosystem으로 전환하고 GitHub Actions 추적 추가
- preflight/Web/runtime soak evidence placeholder를 조기 생성
- recovery drill wait를 실제 drill 시작 성공 시에만 실행
- CI/project rule self-check를 새 계약에 맞게 강화
- 0.11.13 CHANGELOG/HANDOVER 누락 보강 및 오래된 HANDOVER 상세 이력 archive 이동

## 검증 결과

- Repository dependency-free preflight: **47/47 PASS**
- CI failure-domain / lock proof contract: **PASS**
- Project rules: **PASS**
- Product version sync: **v0.11.14 PASS**
- npm/API/Worker lock structure check: **PASS**
- `.github/workflows/ci.yml` YAML parse: **PASS**
- `.github/dependabot.yml` YAML parse: **PASS**
- Local Python 3.13.5 compileall (API/Worker): **PASS**
- Local Python 3.13.5 API pytest: **219/219 PASS**
- Local Python 3.13.5 Worker pytest: **14/14 PASS**
- 0.11.13 baseline + patch 재적용 비교: **963/963 files MATCH**
- full ZIP 재압축 해제 비교: **963/963 files MATCH**
- API test warning: FastAPI `HTTP_422_UNPROCESSABLE_ENTITY` deprecation warning 1건 유지

## 실행하지 못한 Web 전체 검사

`npm run deps:ci`를 실행했으나 현재 전달 환경(Node 22.16.0 / npm 10.9.2)에서 npm 자체가 `Exit handler never called!` 오류로 종료되어 Web 의존성을 설치하지 못했습니다. 프로젝트 CI 고정값은 Node 22.18.0 / npm 10.9.3입니다.
따라서 ESLint, semantic TypeScript typecheck, Vitest, Vite production build, Chromium visual regression은 이 환경에서 실행하지 못했습니다. 또한 Python 3.10 런타임이 이 sandbox에 없어 API/Worker 테스트는 로컬 Python 3.13.5에서 실행했습니다.
GitHub-hosted runner의 실제 Node 22.18.0 / Python 3.10 workflow run이 최종 판정입니다.

## 알려진 제한

- 실제 GitHub Pages environment 보호 규칙과 Pages service 상태는 로컬에서 검증할 수 없습니다.
- 5/30/60분 runtime soak는 이번 로컬 분석에서 장시간 실행하지 않았습니다.
- 실제 CosyVoice 승인 WAV/동의/검수/모델 가중치가 없는 제한은 그대로 유지됩니다.

## 다음 우선순위

1. 0.11.14 실제 GitHub Actions Web/API/Worker/Pages chain 확인
2. 장문·다중 화자 2-way bounded parallel soak evidence
3. `TimelineEditor.tsx` selection/history/rendering 책임 분리
4. `useTimelineGeneration.ts` orchestration/recovery/player-sync 책임 분리
5. 모바일 360/390/430px Chromium layout regression
