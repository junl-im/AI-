# 0.11.24 PATCH README

기준: 사용자가 전달한 `0.11.23 · Focused Voice Surface & Picker Polish` FULL ZIP  
결과: `0.11.24 · Recovery Batch & Editor Responsibility Split`

## 적용 방식

PATCH ZIP의 내용을 0.11.23 프로젝트 루트에 그대로 덮어씁니다. 삭제 대상 파일은 없습니다. `.git`은 포함하지 않습니다.

## 핵심 변경

- 다중 선택에서 stale/unavailable MY VOICE subset만 일괄 복구
- 사용 불가 개수/원래 Voice 구성/ready audio 영향 확인 dialog 추가
- 명시적 실행 전 기존 ready stale audio 보존
- selection 책임을 `useTimelineEditorSelection.ts`로 분리
- batch/retry/history/recovery 책임을 `useTimelineEditorBatch.ts`로 분리
- recovery 전용 Undo/Redo history label과 queued/no-audio 안전 복원 계약 추가
- 전용 preflight와 기존 static contract를 새 책임 구조에 맞게 갱신

## 검증

자세한 결과는 `VALIDATION.md`를 참고합니다. 현재 환경에서는 Web dependency 기반 Vitest/ESLint/semantic typecheck/Vite build와 실제 Chromium evidence를 실행하지 못했으며 GitHub Actions가 최종 gate입니다.
