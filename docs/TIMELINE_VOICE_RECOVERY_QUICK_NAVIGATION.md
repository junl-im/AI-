# Timeline Voice Recovery & Quick Navigation

기준 버전: `0.11.22`
기준 릴리스: `0.11.21 · Selection Continuity & Convenience`

## 목표

0.11.21에서 선택 전환 draft 보존을 고정한 뒤, 과거 Timeline 클립이 삭제·유실된 `MY VOICE`를 계속 참조하는 경우에도 기존 완성 음원을 임의로 폐기하지 않고 사용자가 복구 시점을 직접 결정할 수 있게 합니다. 동시에 장문 편집에서 다음 대사로 이동하기 위해 타임라인을 반복 클릭하는 비용과 혼합 성우 일괄 변경의 오적용 가능성을 줄입니다.

## 구현 계약

### 1. 유실 MY VOICE 비파괴 안내

- `myvoice:<profileId>`가 현재 VoiceChoice 목록에서 준비되지 않은 상태면 Timeline에서 `사용 불가 목소리`로 표시합니다.
- 이미 `ready + trackId`인 클립은 복구 UI가 열려도 기존 음원을 자동 제거하지 않습니다.
- 사용자가 `교체만 적용` 또는 `교체 후 재생성`을 명시적으로 누른 시점에만 대체 목소리 적용 경로를 실행합니다.
- 기존 완성 음원이 있는 경우 교체 적용 시 해당 음원이 제거된다는 영향을 UI에서 먼저 고지합니다.
- 사용할 수 없는 MY VOICE로 새 생성·재생성을 바로 실행하지 않습니다. 기존 ready 음원의 미리듣기는 유지합니다.

### 2. 빠른 편집 이전/다음 대사

- 빠른 편집기에 `이전 대사`, `다음 대사` 이동 버튼을 제공합니다.
- 이동은 Timeline의 쉼 블록을 건너뛰고 인접한 voice 블록으로 이동합니다.
- 이동 전에 0.11.21의 선택 전환 autosave 계약을 그대로 사용해 현재 draft를 먼저 저장합니다.
- 키보드에서는 `Alt+↑` / `Alt+↓`로 같은 이동을 수행합니다.
- 첫/마지막 대사에서는 해당 방향 버튼을 비활성화합니다.

### 3. 혼합 성우 다중 선택 표시

- 다중 선택된 voice 블록의 실제 voiceId 분포를 집계합니다.
- 서로 다른 목소리가 섞이면 `혼합 목소리 N종`으로 표시하고, 각 목소리별 적용 개수를 함께 보여줍니다.
- `현재 작업 목소리`와 `선택된 클립의 기존 목소리 구성`을 분리해서 표시합니다.
- 혼합 선택의 일괄 목소리 기본 대상은 가능한 경우 현재 작업 목소리를 사용하되, 실제 적용은 기존 `변경 미리보기` 후 사용자가 실행합니다.

### 4. 책임 분리

- 단일 선택 빠른 편집 UI를 `TimelineQuickEditor.tsx`로 분리했습니다.
- 순수 선택 계산은 `timelineSelection.ts`로 분리해 쉼 건너뛰기와 혼합 voice 요약을 독립 테스트할 수 있게 했습니다.
- 새 스타일은 `timeline-voice-recovery.css`로 분리해 기존 `dubbing-overlays.css`의 1,200줄 안전 상한을 넘기지 않습니다.

## 회귀 방어

- 신규 `scripts/check-timeline-voice-recovery-navigation.mjs`가 stale MY VOICE 보존 문구, 빠른 이동, 혼합 voice 요약, Home의 현재 Voice 연계를 확인합니다.
- 기존 Studio playback 계약 검사는 빠른 편집 책임이 새 컴포넌트로 이동한 구조를 인식하도록 갱신했습니다.
- Repository preflight에 신규 검사를 포함합니다.

## 검증 상태

- API pytest: `220/220 PASS`
- Worker pytest: `14/14 PASS`
- Python compileall: `PASS`
- dependency-free TS/TSX transpile: `240/240 PASS`
- CSS brace balance: `27/27 PASS`
- 실제 Web Vitest/ESLint/semantic typecheck/Vite build: 전달 환경의 npm 설치가 완전하지 않아 로컬 실행 불가. `node_modules/.bin/vitest`가 생성되지 않았으며 GitHub Actions Web quality가 최종 gate입니다.
