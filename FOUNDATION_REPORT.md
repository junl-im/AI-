# SoriON AI 0.11.15 Verification Report

결과 버전: **0.11.15 · PC Editor Clarity & Linked Timeline Player**  
기준 버전: **0.11.14 · All Workflows Reliability Hardening + Web quality test hotfix**

## 사용자 요청 반영

- PC Voice Core를 낮은 control strip으로 재정비
- PC Voice Picker를 compact centered modal로 변경하고 설명 축약
- Timeline PC 순서를 대사 트랙 → 연계 플레이어 → 선택 클립 편집으로 변경
- VOICE 대사 트랙 바로 아래 linked player 추가
- linked player와 하단 Dock의 player store/queue/playback position 연계
- 사이드바 접기/펼치기 affordance 분리 및 overlap 제거
- Timeline 내부 final WAV/subtitle control 제거, 상단 `내보내기` dialog로 이동

## 검증

- Repository preflight: **47/47 PASS**
- One-flow dubbing UX contract: **PASS**
- Mobile studio flow contract: **PASS**
- Project rules: **PASS**
- Studio playback/timeline UX contract: **PASS**
- Product version sync: **v0.11.15 PASS**
- Changed TS/TSX syntax transpile: **20 files PASS**
- API pytest: **219/219 PASS**
- Worker pytest: **14/14 PASS**

검증을 위해 `.env.example`의 Firebase Web public config를 임시 `.env.development` / `.env.production`으로 복제했으며 preflight 직후 삭제했습니다. 전달 ZIP에는 해당 임시 파일을 포함하지 않습니다.

## 실행하지 못한 검사

이 sandbox에서는 npm dependency install이 npm 자체 `Exit handler never called!` 오류로 실패하여 전체 Vitest, ESLint, semantic `tsc`, Vite build, Chromium visual run을 재실행하지 못했습니다. GitHub-hosted Web quality run이 최종 판정입니다.

## 알려진 제한

- `TimelineEditor.tsx` 1,192줄, `useTimelineGeneration.ts` 1,117줄로 책임 분리 필요
- 승인 voice WAV/동의/사람 검수 evidence는 기존과 같이 pending
- Timeline Linked Player는 독립 audio element가 아니라 기존 player runtime의 controller

## 다음

`0.11.16 · Adaptive Longform Soak & Editor Responsibility Split`
