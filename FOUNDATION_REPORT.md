# SoriON AI 0.11.16 Verification Report

결과 버전: **0.11.16 · Timeline Editor Split & Mobile Quick Creation**  
기준: **0.11.15 · Mobile Voice Linkage & Source Integration FULL**  
검증일: **2026-08-14 KST**

## 핵심 변경

- `TimelineEditor.tsx`의 voice clip 렌더링/키보드/메뉴/STT 표시를 `TimelineVoiceBlockCard.tsx`로 분리했습니다.
- 모바일/터치에서 대사와 쉼을 `＋ / ✓`로 toggle 선택할 수 있어 Ctrl/Cmd modifier가 필요하지 않습니다.
- Voice Picker가 현재 선택된 실제 voice clip 수를 표시하고 성우 선택의 적용 범위를 안내합니다.
- `HomePage`는 pause를 제외한 실제 voice clip ID만 성우 변경 대상으로 전달합니다.
- 모바일의 현재 목소리 control과 `생성 및 재생` CTA를 긴 대본에서도 접근하기 쉬운 sticky 위치로 보강했습니다.
- 관련 static quality gate가 분리된 Timeline voice component와 모바일 linkage 계약을 직접 검사하도록 갱신했습니다.

## 검증 결과

- Repository preflight: **47/47 PASS**
- Product version sync: **0.11.16 PASS**
- Project rules: **PASS**
- Studio playback / timeline UX contract: **PASS**
- PC horizontal timeline contract: **PASS**
- Mobile studio flow contract: **PASS**
- 수정 TS/TSX dependency-free transpile: **7/7 PASS**
- Python compileall: **PASS**
- API pytest: **219/219 PASS**
- Worker pytest: **14/14 PASS**

## 현재 경고

실패는 아니지만 다음 파일은 800줄 권고선을 넘습니다.

- `src/hooks/useTimelineGeneration.ts`: 약 1117줄
- `src/components/workspace/TimelineEditor.tsx`: 약 961줄
- `src/pages/HomePage.tsx`: 약 941줄
- `src/quality/qualityApi.ts`: 약 818줄
- `src/styles/dubbing-overlays.css`: 약 1181줄

다음 0.11.17에서 generation orchestration과 대형 CSS 책임 분리를 우선합니다.

## Web 전체 실행 제한

현재 전달 환경에는 프로젝트 `node_modules`가 포함되어 있지 않으므로 실제 Vitest/ESLint/Vite build 전체 실행은 하지 않았습니다. GitHub Actions `Web quality`가 semantic typecheck와 browser build의 최종 판정입니다.

## 전달 규칙

- **FULL**: 저장소 전체 프로젝트.
- **PATCH**: 저장소 상대 경로 그대로 담긴 변경 파일. 압축 해제 후 프로젝트 루트에 그대로 덮어쓰면 됩니다. 별도 patch runner가 필요하지 않습니다.
