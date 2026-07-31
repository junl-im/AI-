# HANDOVER

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
