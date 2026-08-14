# R2 Web Quality 점검 추가

- GitHub Actions run 31778799250의 Web quality 실패를 재분석했습니다.
- 제품 `src` 테스트 63개 영역은 정상 수집 대상으로 유지하고, 과거 전달용 `payload/` 테스트는 Vitest 입력에서 제외합니다.
- `LinkedPlayerDock`의 상단 이동 테스트는 현재 구현의 next-frame + `behavior: auto` 계약을 검증합니다.
- Repository preflight에서 Vitest src-only 수집 계약을 고정합니다.

# SoriON AI 0.11.17 Verification Report

결과 버전: **0.11.17 · Generation Runtime Split & Real Mobile Evidence**  
기준: **0.11.16 · Timeline Editor Split & Mobile Quick Creation FULL**  
검증일: **2026-08-14 KST**

## 핵심 변경

- `useTimelineGeneration.ts`의 progressive audio / recovery / SSE-polling / final handoff 실행 책임을 `src/timeline/generationRuntime.ts`로 분리했습니다.
- Hook line count를 약 1,116줄에서 약 679줄로 낮추고 외부 controller API는 유지했습니다.
- partial audio, ordered segment, revision safety static gate가 새 runtime 책임 파일을 직접 확인하도록 갱신했습니다.
- Chromium visual runner에 360×800 / 390×844 / 430×932 실제 모바일 viewport 모드를 추가했습니다.
- GitHub Web quality에 desktop visual과 별도의 mobile visual 단계가 추가됩니다.
- 모바일 workspace bottom clearance에 safe-area를 포함하고 Dock navigation을 memoized component로 분리했습니다.

## 검증 결과

- Repository preflight: **47/47 PASS**
- Product version sync: **0.11.17 PASS**
- Generation hook syntax/transpile: **PASS**
- Generation runtime syntax/transpile: **PASS**
- Chromium visual runner syntax/static contract: **PASS**
- Desktop + mobile visual workflow contract: **PASS**
- Python compileall: **PASS**
- API pytest: **219/219 PASS**
- Worker pytest: **14/14 PASS**

## GitHub Actions 최종 판정 항목

현재 전달 환경에는 프로젝트 `node_modules`가 포함되어 있지 않아 Vitest/ESLint/Vite production build 전체를 여기서 실행하지 않습니다. GitHub `Web quality`가 다음 항목의 최종 판정입니다.

- TypeScript semantic typecheck
- Vitest 전체 회귀
- Vite production build
- Chromium desktop visual 1024/1280/1440
- Chromium mobile visual 360/390/430

## 현재 구조 경고

실패는 아니지만 다음 책임 분리가 후속 우선순위입니다.

- `src/components/workspace/TimelineEditor.tsx`: 약 961줄
- `src/hooks/useTimelineGeneration.test.ts`: 약 890줄
- `src/pages/HomePage.tsx`: 약 941줄
- `src/quality/qualityApi.ts`: 약 818줄
- `src/styles/dubbing-overlays.css`: 약 1,181줄

## 전달 규칙

- **FULL**: 저장소 전체 프로젝트.
- **PATCH**: 저장소 상대 경로 그대로 담긴 변경 파일. 압축 해제 후 프로젝트 루트에 바로 덮어씁니다. 별도 APPLY runner가 필요하지 않습니다.
