# SoriON AI 0.10.5 Verification Report

결과 버전: **0.10.5 · Compact Dock & Practical Clip Editor**
기준 버전: **0.10.4 · Voice Preset Engine Reliability Hotfix**

## 적용 범위

- 일반 Dock의 재생/일시정지 버튼 우선 배치와 바로 옆 진행바
- 만들기 전용 Dock의 한 줄 Compact transport와 장식 파형 제거
- 타임라인 카드 textarea 제거 및 선택 클립 빠른 편집기 추가
- 빠른 편집기의 저장·미리듣기·재생성·분할·삭제와 Enter / Ctrl·Cmd+Enter 동선
- Dock 순서·빠른 편집 진입 회귀 테스트와 dependency-free Studio UX 계약 강화
- 0.10.4 음성 프리셋 엔진 신뢰성 정책 유지

## 검증 결과

- `node scripts/check-version-sync.mjs`: 통과 · v0.10.5
- `node scripts/check-playback-control-flow.mjs`: 통과
- `node scripts/check-studio-playback-timeline-ux.mjs`: 통과
- `node scripts/run-preflight.mjs`: 통과 · 36/36
- TypeScript global compiler를 사용한 `src` TS/TSX dependency-free transpile: 통과 · 191/191 (`.d.ts` 제외)
- `PYTHONPATH=services/api python -m pytest -q services/api/tests`: 통과 · 198/198
- `PYTHONPATH=services/worker python -m pytest -q services/worker/tests`: 통과 · 14/14
- `python -m compileall -q services/api/app services/worker/app`: 통과
- Web ESLint·Vitest·semantic typecheck·Vite build: `npm ci`가 현재 전달 환경의 내부 registry에서 `zustand@5.0.8` 404로 중단되어 미실행. GitHub Actions의 검증된 lock 기반 Web quality 단계에서 최종 확인 필요.
- API 테스트에는 FastAPI의 기존 `HTTP_422_UNPROCESSABLE_ENTITY` 상수 deprecation 경고 1건이 있으나 테스트 실패는 없습니다.

## 변경 수

- 추가 3개
- 수정 31개
- 삭제 0개
- 총 34개

## 제한

- 브라우저 렌더러가 없는 현재 환경에서는 1024·1280·1440px 실제 화면 스크린샷 비교를 수행하지 못했습니다.
- 모바일 일반 Dock은 좁은 폭에서 일부 보조 제어가 별도 행을 사용할 수 있습니다. 만들기 전용 Dock은 모바일에서 보조 제어를 숨겨 핵심 재생/진행 한 줄을 유지합니다.
- 실제 5개 CosyVoice WAV·동의/권리 자료·모델 가중치는 릴리스 ZIP에 포함하지 않으며 0.10.4의 프리셋 안전 정책을 변경하지 않습니다.
