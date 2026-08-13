# SoriON AI 0.11.13 Verification Report

결과 버전: **0.11.13 · Focused Creation Surface**  
기준 버전: **0.11.12 · Editing History, Speaker Memory & Engine Routing Trace**

## 파일 분석 요약

현재 프로젝트는 기능 기반이 이미 강합니다. 핵심 위험은 기능 부족보다 기본 작업 화면의 정보·시각 밀도와 일부 대형 파일의 책임 집중입니다.

- `TimelineEditor.tsx`: 약 1,190줄
- `useTimelineGeneration.ts`: 약 1,110줄
- `HomePage.tsx`: 약 890줄
- `dubbing-overlays.css`: 약 1,180줄
- Web 품질/복구/증거 계약은 매우 촘촘하지만 신규 사용자의 첫 생성 경로보다 운영자 기능의 양이 더 크게 느껴질 수 있습니다.

## 0.11.13 핵심 변경

- 첫 화면의 의미를 `텍스트를 음성으로`로 단순화했습니다.
- 현재 목소리, 텍스트 입력, `생성 및 재생`을 가장 강한 3요소로 유지합니다.
- 파일 불러오기·대본 정리·첫 문장 듣기·빈 대사를 보조 action으로 축소했습니다.
- 프로젝트 header, card border/shadow, 다중 그라디언트를 줄이고 편집 textarea 면적을 늘렸습니다.
- 모바일은 문단 수/파일 형식 같은 2차 통계를 숨기고 action을 한 줄로 유지합니다.
- 기존 첫 음성 자동 재생, 최대 2-way bounded parallel, 다중 화자, Timeline, Engine routing은 변경하지 않았습니다.

## Fish Audio 참고 원칙

Fish Audio의 제품 구조에서 참고한 것은 UI 복제가 아니라 다음 원칙입니다.

- 큰 텍스트 입력 영역
- 현재 voice 선택의 명확한 위치
- `Generate & play`처럼 생성과 청취가 한 행동으로 이해되는 CTA
- advanced settings/history/library/cloning의 보조 배치
- 입력 주변에는 문자 수와 즉시 필요한 상태만 노출

SoriON은 이 원칙을 장문/로컬 엔진 특성에 맞게 적용하고 외부 Fish Audio API 의존성은 추가하지 않았습니다.

## 검증

- Repository dependency-free preflight: **47/47 PASS**
- 제품 버전 sync: **v0.11.13 PASS**
- One-Flow UX contract: **PASS**
- Project rules: **PASS**
- npm semantic typecheck / Vitest / Vite build: **미실행**

이 sandbox에서는 npm registry package를 받을 수 없어 `npm ci`를 완료하지 못했습니다. 따라서 TypeScript semantic/Vitest/build는 dependency 설치가 가능한 로컬 또는 GitHub Actions에서 최종 확인해야 합니다.

## 다음 우선순위

1. 실제 360/390/430px Chromium visual regression
2. 장문 2-way bounded parallel P95/failure/fallback soak
3. `TimelineEditor.tsx` selection/history/rendering 책임 분리
4. `useTimelineGeneration.ts` orchestration/recovery/player-sync 책임 분리
5. Quality Lab과 일반 제작 surface의 정보 구조 분리 강화
