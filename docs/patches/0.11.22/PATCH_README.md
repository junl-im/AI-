# 0.11.22 PATCH README

기준: `0.11.21 · Selection Continuity & Convenience`
결과: `0.11.22 · Timeline Voice Recovery & Quick Navigation`

## 적용 방식

PATCH ZIP의 내용을 0.11.21 프로젝트 루트에 그대로 덮어씁니다. 삭제 대상 파일은 없습니다.

## 핵심 변경

- stale/unavailable MY VOICE Timeline 상태 및 명시적 대체 UI
- ready 음원 비자동 삭제 / 재생 유지
- 빠른 편집 이전·다음 대사 + Alt+↑/↓
- 혼합 voice 다중 선택 구성/현재 작업 Voice 분리 표시
- quick editor / selection / CSS 책임 분리
- 신규 repository preflight 계약 검사

## 검증

Repository preflight **48/48**, API **220/220**, Worker **14/14**, Python compileall, TS/TSX transpile **240/240**, CSS balance **27/27**을 통과했습니다. 0.11.21 기준본에 36개 패치 파일을 overlay한 SHA 비교도 **1002/1002 files · missing 0 · extra 0 · changed 0**으로 통과했습니다. npm dependency 설치가 불완전해 로컬 Vitest/ESLint/semantic typecheck/Vite build는 실행하지 못했으며 GitHub Actions Web quality가 최종 gate입니다.
