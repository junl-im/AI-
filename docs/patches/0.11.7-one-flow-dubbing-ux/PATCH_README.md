# SoriON AI 0.11.7 One-Flow Dubbing UX

기준 버전은 **0.11.6 Recovery Evidence Classification & Session Safety**입니다.

## 적용 내용

- 새 프로젝트는 좌우 프로 패널을 접은 중앙 집중 모드로 시작
- `목소리 → 대본 → 바로 더빙 → 첫 결과 듣기` One-Flow Composer
- 기본 5개 프리셋 즉시 선택 + 전체 Voice Picker/세부 설정 보존
- 빈 프로젝트 타임라인 숨김 + `빈 대사부터 직접 편집` 진입
- 제작 기록 접힘, 헤더 `프로 패널` 일괄 펼치기/접기
- TXT·MD·SRT·VTT 선택/drag-and-drop과 subtitle 타임코드 정리
- `Ctrl/Cmd+Enter`, 첫 결과 자동 재생, 대본 기반 새 프로젝트 제목 제안
- desktop layout storage v3 + one-flow dependency-free preflight 계약

## 적용

0.11.6 프로젝트 루트에 패치 ZIP 내용을 그대로 덮어쓴 뒤 `APPLY_PATCH.cmd` 또는 `APPLY_PATCH.sh`를 실행합니다.

삭제 파일은 없습니다. 기존 recovery evidence provenance, session privacy, engine routing, batch editing 계약은 유지합니다. 전체 Web ESLint·semantic typecheck·Vitest·Vite build·Chromium layout은 GitHub Actions Web quality가 최종 판정합니다.
