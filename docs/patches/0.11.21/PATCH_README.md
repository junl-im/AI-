# SoriON AI 0.11.20 → 0.11.21 Patch

대상: `0.11.20 · Linkage & Convenience`  
결과: `0.11.21 · Selection Continuity & Convenience`

## 핵심 변경

- Timeline quick editor에서 다른 클립을 직접 선택하기 전에 dirty draft를 먼저 저장합니다.
- 단일/범위/Ctrl·Cmd 토글 선택 모두 같은 저장 경로를 사용합니다.
- Timeline 성우 탐색으로 바뀐 현재 Voice가 이미 확인한 Multi-Speaker 배정을 다시 미확인으로 만들지 않습니다.
- Timeline 적용 대상이 없는 상태에서 사용자가 기본 목소리를 직접 바꾼 경우에만 Multi-Speaker 추천 seed를 갱신합니다.
- 제품 버전과 HANDOVER/CHANGELOG/NEXT_UPDATE 기준을 0.11.21로 동기화합니다.

## 적용

1. 현재 프로젝트가 0.11.20 기준인지 확인합니다.
2. 작업 중 변경사항을 커밋하거나 별도 백업합니다.
3. 이 ZIP의 내용을 저장소 루트에 그대로 압축 해제해 덮어씁니다.
4. `.git`은 건드리지 않습니다.
5. `node scripts/run-preflight.mjs`와 가능한 Web quality를 실행합니다.

삭제 파일은 없습니다.

## 검증

- Repository preflight: 47/47 PASS
- API pytest: 220/220 PASS
- Worker pytest: 14/14 PASS
- Product version sync: 0.11.21 PASS
- 변경 TS/TSX dependency-free transpile: 4/4 PASS
- 전체 Web lint/Vitest/semantic typecheck/Vite build: npm 의존성 설치가 제한 시간 안에 완료되지 않아 GitHub Actions Web quality에서 최종 확인
