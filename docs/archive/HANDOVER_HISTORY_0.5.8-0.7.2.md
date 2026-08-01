# SoriON AI 상세 인수인계 이력 · 0.5.8–0.7.2

이 문서는 `docs/HANDOVER.md`를 현재 상태 중심의 영구 메모리로 재구성하기 전 보존한 상세 이력이다.

# HANDOVER

## 2026-08-01 08:50 KST · v0.7.2

1. 작업명: CI Zero-Error Patch.
2. 대상·기준 버전: `0.7.1 → 0.7.2`.
3. Worker Ruff `UP035`, `B009`, `B008` 오류를 Python 3.10 기준으로 수정했다.
4. API 테스트의 사용하지 않는 `json` import를 제거해 `F401`을 수정했다.
5. 문장별 결과 UI가 짧은 문장들을 한 구간으로 합치던 문제를 수정했다.
6. `VoiceClonePage` polling effect를 안정적인 job id·status 의존성으로 변경했다.
7. 동일 회귀를 프로젝트 규칙 검사에서 차단하도록 금지·필수 구문 검사를 추가했다.
8. API 56개, Worker 9개 테스트와 compileall, 프로젝트 규칙 검사를 통과했다.
9. 산출물: `SoriON-AI-0.7.2-full.zip`, `SoriON-AI-0.7.1-to-0.7.2-patch.zip`.
10. 다음 예상 업데이트: `0.7.3 GPU Deployment & Progressive Playback`.

## 2026-07-31 23:36 KST · v0.7.1

1. 작업명: Production CosyVoice Adapter & API Security.
2. 대상·기준 버전: `0.7.0 → 0.7.1`.
3. API↔Worker 서비스 토큰과 HMAC-SHA256 요청 서명을 구현했다.
4. API·Worker 요청 제한과 JSONL 감사 로그를 구현했다.
5. production 보안 Secret, 모델 필수 파일, CUDA·VRAM·디스크 진단을 readiness에 연결했다.
6. SSE `Last-Event-ID` 복구와 Worker 작업 TTL 정리를 구현했다.
7. 원본 문장·음성은 감사 로그에 남기지 않는다.
8. 전체본과 패치 적용본의 파일 해시 동등성을 검증한다.
9. 산출물: `SoriON-AI-0.7.1-full.zip`, `SoriON-AI-0.7.0-to-0.7.1-patch.zip`.
10. 다음 예상 업데이트: `0.7.2 GPU Deployment & Progressive Playback`.

## 2026-07-31 22:37 KST · v0.7.0

1. 작업 일시: 2026-07-31 22:37 KST
2. 대상·기준 버전: `0.6.4 → 0.7.0`
3. 변경 내용: 별도 CosyVoice Worker, health·readiness·GPU 진단, 공식 AutoModel adapter, 문장별 작업·SSE·취소·재시도·WAV 병합, FastAPI 프록시, 복제 실행 UI와 Dock 자동 연결을 구현함.
4. 변경 이유: 기존 복제 기능은 샘플 준비와 URL probe만 있었고 실제 작업 생성·상태·음원 전달 계약이 없었기 때문임.
5. 영향 범위: `services/worker`, FastAPI voice clone routes·schemas·store·engine client, 복제 UI·API types, CI, 환경 변수, 테스트·문서.
6. 주요 파일: `services/worker/app/main.py`, `jobs.py`, `runtime.py`, `adapters/cosyvoice3.py`, `voice_clones.py`, `VoiceClonePage.tsx`, `CloneExecutionCard.tsx`.
7. 검증 결과: API 53 tests, Worker 5 tests, Uvicorn Worker와 API↔Worker HTTP smoke, compileall, 프로젝트 규칙, YAML·TS/TSX·CSS 정적 검사, 전체 290개·패치 66개 파일 동등성, ZIP 무결성 통과.
8. 제한·주의: GPU 모델과 대형 의존성은 포함하지 않으며 실제 CosyVoice 음질·지연·VRAM은 GPU 배포에서 검증해야 함. npm registry와 Ruff 설치 제한으로 정식 Web quality·Ruff는 GitHub Actions 최종 확인.
9. 산출물: `SoriON-AI-0.7.0-full.zip`, `SoriON-AI-0.6.4-to-0.7.0-patch.zip`, `SoriON-AI-0.7.0-artifacts.sha256`.
10. 다음 예상 업데이트: `0.7.1 Production CosyVoice Adapter & API Security`.

## 다음 예상 업데이트

- 실제 GPU 설치 자동 진단과 모델 로딩 진행률
- API↔Worker 서비스 인증과 요청 제한
- SSE 재연결·progressive playback·작업 복구
- 실제 한국어 음질·지연·VRAM 벤치마크

## 2026-07-31 22:30 KST · v0.6.4

1. 작업 일시: 2026-07-31 22:30 KST
2. 대상·기준 버전: `0.6.3 → 0.6.4`
3. 변경 내용: 생성 화면 타이포 계층, radial glow, 32px 카드 오버랩, 500자 입력창, 발음 보정 토글, 가로 목소리 칩, 동적 CTA, 문장별 생성 구간 리스트, Dock 상단 이동을 구현함.
4. 변경 이유: 사용자가 첫 화면에서 즉시 입력·생성 흐름을 이해하고 한국어 발음 보정과 긴 문장 자동 분할이라는 제품 강점을 바로 확인하도록 하기 위함.
5. 영향 범위: HomePage, TextComposer, VoicePresetSelector, AudioResultCard, LinkedPlayerDock, TTS API 계약, FastAPI pipeline, CSS, Web·API 테스트, 문서.
6. 주요 파일: `HomePage.tsx`, `TextComposer.tsx`, `creation-workspace.css`, `segmentText.ts`, `SegmentResultList.tsx`, `LinkedPlayerDock.tsx`, `tts_pipeline.py`.
7. 검증 결과: 프로젝트 규칙, FastAPI 50 tests, compileall, TypeScript·TSX 구문 검사, CSS 파싱 통과. npm registry 제한으로 정식 Web quality와 Ruff는 GitHub Actions에서 최종 확인.
8. 제한·주의: CTA의 약 3초 표시는 짧은 문장 목표 안내이며 실제 시간은 엔진·장비·문장 길이에 따라 달라질 수 있음.
9. 산출물: `SoriON-AI-0.6.4-full.zip`, `SoriON-AI-0.6.3-to-0.6.4-patch.zip`, `SoriON-AI-0.6.4-artifacts.sha256`.
10. 다음 예상 업데이트: `0.7.0 CosyVoice Worker Streaming & Clone Execution`.

## 다음 예상 업데이트

- 실제 CosyVoice Worker와 GPU·CUDA·VRAM·모델 readiness
- 제로샷 복제 실행과 스트리밍 음성 조각
- 문장별 진행률·재시도·Dock 즉시 재생 연결
- 공개 API 인증과 요청 제한 기본 경계

## 2026-07-31 21:24 KST · v0.6.3

1. 작업 일시: 2026-07-31 21:24 KST
2. 대상·기준 버전: `0.6.2 → 0.6.3`
3. 변경 내용: Dock의 기존 어두운 배경 톤을 유지하고, 완성 음성이 있을 때만 플레이어를 메뉴 위에 표시하도록 변경함.
4. 변경 이유: 빈 플레이어가 항상 공간을 차지했고 PC에서 메뉴와 플레이어 순서가 사용자 의도와 반대로 보였기 때문임.
5. 영향 범위: AppShell 적응형 하단 여백, LinkedPlayerDock 조건부 렌더링, Dock CSS, Web 회귀 테스트, 릴리스 문서.
6. 주요 파일: `AppShell.tsx`, `LinkedPlayerDock.tsx`, `LinkedPlayerDock.test.tsx`, `player-dock.css`, `index.css`.
7. 검증 결과: 프로젝트 규칙 통과, FastAPI 49 tests passed, Python compileall 통과, 변경 TypeScript·CSS 정적 검사 통과, 패치 적용본과 전체본 260개 파일 완전 일치, ZIP 무결성 통과.
8. 제한·주의: sandbox npm registry에 `@tailwindcss/vite`가 없어 정식 Vitest·ESLint·Vite build는 GitHub Actions 확인이 필요함.
9. 산출물: `SoriON-AI-0.6.3-full.zip`, `SoriON-AI-0.6.2-to-0.6.3-patch.zip`, `SoriON-AI-0.6.3-artifacts.sha256`.
10. 다음 예상 업데이트: `0.7.0 CosyVoice Worker Streaming & Clone Execution`.

## 다음 예상 업데이트

- 실제 CosyVoice Worker와 health·readiness 분리
- GPU·CUDA·VRAM·모델 로딩 진단
- 제로샷 복제 실행과 스트리밍 음성 조각
- 완료 음원을 적응형 Dock 플레이어에 즉시 연결

## 2026-07-31 21:12 KST · v0.6.2

1. 작업 일시: 2026-07-31 21:12 KST
2. 대상·기준 버전: `0.6.1 → 0.6.2`
3. 변경 내용: GitHub Pages와 Python API 배포 경계를 명확히 하고, API 기본 주소·CORS·Python 진단·음원 URL·CosyVoice Worker health·통합 연결 검사 화면을 수정함.
4. 변경 이유: 공개 웹은 정적 파일만 제공하는데 `/api/v1`을 같은 Origin에서 암묵적으로 찾았고, 실패가 Demo WAV로 전환되어 실제 연결 장애가 숨겨졌기 때문임.
5. 영향 범위: HTTP client, API setup wizard, engine catalog, Home engine status, FastAPI config·router·connectivity schema, CosyVoice Worker adapter, 실행 스크립트, 테스트·문서.
6. 주요 파일: `src/api/httpClient.ts`, `src/settings/connectivityApi.ts`, `ApiSetupWizard.tsx`, `useEngineCatalog.ts`, `services/api/app/api/routes/connectivity.py`, `cosyvoice_worker.py`, `scripts/start-api.mjs`.
7. 검증 결과: FastAPI 49 tests passed, compileall passed, TypeScript·TSX syntax passed, 실제 Uvicorn health·connectivity·CORS 통과, Linux 시스템 TTS 4.3초 WAV 생성·다운로드 통과.
8. 제한·주의: GitHub Pages는 Python을 실행하지 않으므로 실제 모바일 서비스에는 별도 공개 HTTPS API와 GPU Worker 배포가 필요함. sandbox npm registry에 `@tailwindcss/vite`가 없어 정식 npm build는 GitHub Actions 확인이 필요함.
9. 산출물: `SoriON-AI-0.6.2-full.zip`, `SoriON-AI-0.6.1-to-0.6.2-patch.zip`, `SoriON-AI-0.6.2-artifacts.sha256`.
10. 다음 예상 업데이트: `0.7.0 CosyVoice Worker Streaming & Clone Execution`.

## 다음 예상 업데이트

- 실제 CosyVoice Worker 서비스와 GPU·CUDA·VRAM·모델 진단
- 제로샷 복제 실행과 스트리밍 음성 조각
- Worker 작업 취소·재연결·실패 구간 재시도
- 공개 HTTPS FastAPI 배포 프로필과 비밀·인증 경계

## 2026-07-31 20:55 KST · v0.6.1

1. 작업 일시: 2026-07-31 20:55 KST
2. 대상·기준 버전: `0.6.0 → 0.6.1`
3. 변경 내용: BrandMasthead의 현재 배너 문구·마이크 표식에 맞춰 Web 테스트를 갱신하고, JSDOM Blob 변환 fallback을 테스트 내부와 setup에 강화함.
4. 변경 이유: 0.6.0 UI는 정상 렌더링됐지만 테스트가 0.5.x 시기의 짧은 문구와 사라진 test id를 계속 기대해 Web quality가 실패했기 때문임.
5. 영향 범위: BrandMasthead 컴포넌트·테스트, Mock WAV 테스트, Vitest setup, 프로젝트 규칙 검사, 버전·문서.
6. 주요 파일: `BrandMasthead.tsx`, `BrandMasthead.test.tsx`, `mockWave.test.ts`, `src/test/setup.ts`, `check-project-rules.mjs`.
7. 검증 결과: 프로젝트 규칙 통과, FastAPI 44 tests passed, compileall passed, 패치 적용본과 전체본 일치 확인.
8. 제한·주의: sandbox npm registry에 `@tailwindcss/vite`가 없어 정식 Vitest·ESLint·Vite build는 실행하지 못했으며 GitHub Actions 확인이 필요함.
9. 산출물: `SoriON-AI-0.6.1-full.zip`, `SoriON-AI-0.6.0-to-0.6.1-patch.zip`, `SoriON-AI-0.6.1-artifacts.sha256`.
10. 다음 예상 업데이트: `0.7.0 CosyVoice Worker Streaming & Clone Execution`.

## 다음 예상 업데이트

- CI Web·API·Pages가 모두 성공한 뒤 CosyVoice Worker 실제 실행 경계 구현
- Worker health, GPU·CUDA·VRAM·모델 진단
- 스트리밍 TTS·복제, 취소·재시도, Dock 세션 복원

## 2026-07-31 18:39 KST · v0.6.0

1. 작업 일시: 2026-07-31 18:39 KST
2. 대상·기준 버전: `0.5.8 → 0.6.0`
3. 변경 내용: 모바일 음성 녹음·업로드·품질 검사·동의·로컬 프로필, Voice Clone API, CosyVoice Worker 경계, Dock 재생 대기열과 고급 컨트롤을 추가함.
4. 변경 이유: 연구 도구가 아니라 한국인이 모바일에서 10초 안에 음성 복제를 시작하는 플랫폼 목표와, 화면 간 음원을 하나의 플레이어로 연결하는 요구를 반영함.
5. 영향 범위: App page routing, clone UI·hooks·IndexedDB, HTTP FormData, player store·Dock, FastAPI router·schemas·storage·engine registry, 문서·테스트.
6. 주요 파일: `src/pages/VoiceClonePage.tsx`, `src/voiceclone/*`, `src/hooks/useVoiceRecorder.ts`, `src/store/usePlayerStore.ts`, `LinkedPlayerDock.tsx`, `services/api/app/api/routes/voice_clones.py`, `voice_clone_store.py`, `cosyvoice_worker.py`.
7. 검증 결과: FastAPI 44 tests passed, compileall passed, TypeScript strict source and tests passed with local dependency declarations.
8. 제한·주의: 실제 CosyVoice 모델 추론은 아직 실행하지 않으며 Worker URL이 없으면 샘플 준비 상태만 표시함. sandbox npm registry에서 `@tailwindcss/vite`를 찾지 못해 정식 npm install, ESLint, Vitest, Vite build는 GitHub Actions 확인이 필요함.
9. 산출물: `SoriON-AI-0.6.0-full.zip`, `SoriON-AI-0.5.8-to-0.6.0-patch.zip`, `SoriON-AI-0.6.0-artifacts.sha256`.
10. 다음 예상 업데이트: `0.7.0 CosyVoice Worker Streaming & Clone Execution`.

## 다음 예상 업데이트

- Worker health, GPU, CUDA, VRAM, 모델 진단
- 동의된 샘플의 speaker prompt 준비와 제로샷 복제 실행
- 스트리밍 TTS·복제, 첫 음성 지연 측정, 작업 취소·복구
- Dock 세션 저장과 복원

## 2026-07-31 · v0.5.8

- 작업: Compact banner, PC two-frame workspace, fixed linked-player dock.
- 요청 이유: 상단 설명을 작게 묶고 10초 전환, PC 2프레임, 모바일 1프레임, 설정 이동, Dock 플레이어 이식.
- 이식 근거: foxbear-mastering-studio v1.6.47의 playback-link-service, dock-controller, dock waveform 구조를 검토함.
- 이식 원칙: 전역 window 서비스와 누적 CSS는 복사하지 않고 React/Zustand/CSS로 재작성함.
- 변경 영향: AppShell, BrandMasthead, HomePage, navigation, player store, global styles.
- 플레이어: 생성된 음성이 자동으로 Dock에 연결되며 단일 audio element가 재생·탐색·시간 표시를 담당함.
- 반응형: 980px 이상 PC 2프레임, 그 미만 모바일/태블릿 1프레임.
- 설정: Dock에서 제거하고 상단 DESIGNED BY 옆 톱니 버튼으로 이동.
- 제한: 업로드 원본의 A/B 비교·다중 플레이어 orchestration 전체는 아직 이식하지 않음.
- 다음: player queue, previous/next, download shortcut, voice clone capture.

## 다음 예상 업데이트

v0.6.0 Voice Clone + Linked Player.
