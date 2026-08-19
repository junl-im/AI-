# REPRODUCIBLE WEB QUALITY

## 목적

Web quality를 여러 CI step의 흩어진 성공 표시가 아니라 동일 입력과 동일 명령으로 재실행 가능한 증거 report로 남긴다. 현재 제품 버전은 `0.11.29`, heartbeat는 `6.7`이다.

## 고정 단계

1. npm lock structure
2. 설치된 Web toolchain
3. npm dependency tree
4. ESLint
5. TypeScript semantic typecheck
6. Critical voice/recovery regression (`npm run test:web-critical`)
7. 전체 Vitest
8. Vite production build

로컬과 GitHub Actions는 `npm run quality:web-repro`를 사용한다. 실행 결과는 `.sorion/web-quality/report.json`과 `logs/*.log`에 저장된다. 첫 실패가 있으면 phase/command/exit code/로그 tail을 `.sorion/web-quality/failure-summary.txt`에도 기록한다.

## report 증거

- package.json과 package-lock.json SHA-256
- Node·npm·OS·architecture
- repository, commit SHA, run ID와 attempt
- 단계별 명령·종료 코드·실행 시간·로그 SHA-256
- dist 파일의 경로·크기·SHA-256
- timestamp와 duration을 제외한 재현 입력 중심 evidence SHA-256
- 전체 report SHA-256

`npm run quality:web-report:verify`는 JSON 내부 hash만 다시 계산하지 않는다. 실제 로그 파일, 현재 package manifest·lock과 dist manifest를 report와 대조한다.

## lock 정책

일반 Push·PR은 커밋된 `package-lock.json`이 없거나 manifest와 stale이면 실패한다. CI가 lock을 생성해 source branch에 자동 커밋하지 않는다. 의도적인 갱신은 수동 workflow 또는 로컬 생성 스크립트로 만든 뒤 의존성 diff와 lock proof를 사람이 검토해 커밋한다.

## 보안 경계

SHA-256은 artifact 변경을 탐지하지만 GitHub 계정, 실행자 또는 측정 장치의 신원을 증명하는 전자서명이 아니다. 신뢰 판단에는 commit 보호, Actions 권한, artifact 보존 정책과 실제 기기 기록을 함께 사용한다.

## Heartbeat 6.7 Intake

Heartbeat 6.7 report는 `heartbeat: "6.7"`을 기록한다. Quality Lab은 완료된 `mode: "run"` report만 받아 8개 phase 순서·명령·성공 상태, package manifest·lock SHA, log·dist SHA, evidence SHA와 report SHA를 다시 계산한다. JSON만 가져오는 경로는 실제 log·dist 파일 자체를 다시 읽을 수 없으므로, 원 artifact의 `quality:web-report:verify` 통과 여부와 함께 검토한다.

