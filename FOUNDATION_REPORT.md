# SoriON AI 0.9.3-beta.2 CI Hardening Report

결과 버전: **0.9.3-beta.2 · CI Failure-Domain Hardening & Selective STT Regeneration**

## 완료

- npm, API uv, Worker uv lock을 독립 job으로 분리해 하나의 registry 장애가 전체 품질 결과를 가리지 않습니다.
- cache-only 우선, 최대 2회 online retry, 명령 hard timeout으로 중첩 재시도와 장시간 정지를 제거했습니다.
- lock과 manifest SHA-256 증명을 통과한 파일만 품질 job과 main 자동 커밋에 사용합니다.
- 전역 권한은 read-only이며 lock 커밋과 Pages 배포에만 최소 쓰기 권한을 부여합니다.
- 실기기 5개 프로필 × 10·30·60분의 측정 증거 진행률 API와 Quality 화면을 추가했습니다.
- 서버 WAV를 Faster Whisper로 검수하고 CER·WER·핵심 토큰 기준에 실패한 문장 ID만 재생성합니다.
- 문장별 재생성 횟수를 작업공간에 보존하며 기본 최대 2회 이후에는 자동 재생성을 차단합니다.

## 검증

- API pytest 112개 통과
- Worker pytest 14개 통과
- Python compileall 통과
- 프로젝트 규칙, 폐기 파일, Web manifest, free-only, engine blueprint, 모델 onboarding 검사 통과
- GitHub Actions YAML, CI failure-domain, lock proof 손상 fixture와 네트워크 재시도 계약 검사 통과
- TypeScript·TSX 144개 파일 parser 검사 통과

## 제한

현재 샌드박스는 npm registry에 연결할 수 없어 실제 lock 생성, `npm ci`, ESLint, TypeScript semantic typecheck, Vitest, Vite build는 GitHub Actions에서 최종 확인해야 합니다. 실제 장치 성능 수치와 Faster Whisper 모델 결과는 포함하지 않았습니다.
