# SoriON AI 0.9.3-alpha.3 Result Report

작성 시각: 2026-08-02 10:22 KST
결과 버전: **0.9.3-alpha.3 · Reproducible CI Lock Evidence Gate**
기준: **0.9.3-alpha.2 · Web Quality Toolchain Stabilization**

## 결과

- 프로젝트 Node 22.18.0과 npm 10.9.3을 nvm, node-version, packageManager, Volta, CI에 고정했다.
- `vite-plugin-pwa 1.3.0`의 설치된 peer 범위가 Vite 8을 포함하는지 검사한다.
- `npm ls --all --json --long`을 파싱해 missing, invalid, extraneous와 복수 Vite를 차단한다.
- Actions 수동 입력으로 package-lock, API uv.lock, Worker uv.lock과 설치 감사 로그를 생성한다.
- 생성 lock을 같은 workflow의 Web·API·Worker에 전달해 npm ci와 locked uv sync로 재검증한다.
- 다음 기능 목표를 실기기 검증, STT 실측, 최종 Export 완성으로 제한했다.
- CosyVoice 모델 업그레이드에 병행 설치, canary, rollback 절차를 문서화했다.

## 확인 완료

- 새 Node 스크립트 4개 구문 검사
- GitHub Actions YAML 파싱
- 프로젝트 정적 규칙, free-only, engine blueprint, model onboarding 검사
- 기존 API와 Worker 회귀 테스트
- 정상·오류 npm tree fixture를 이용한 dependency audit 양·음성 검사

## 현재 환경 제한

현재 실행 환경은 npm·PyPI 외부 registry DNS가 차단되고 캐시도 없어 실제 lock을 신뢰성 있게
생성할 수 없다. 따라서 lock 파일을 조작하거나 추정하지 않았다. GitHub Actions에서
`generate_lockfiles=true`로 생성한 artifact의 경고 로그를 검토한 뒤 세 lock을 커밋해야 한다.
일반 push·PR은 그 전까지 의도적으로 lock 단계에서 실패한다.

## 다음 목표

1. 실제 장치별 CosyVoice·Faster Whisper·FFmpeg 실행 측정
2. 한국어 CER·WER와 중요 토큰 오류율 실측
3. WAV·MP3·SRT·VTT 최종 Export 완성
