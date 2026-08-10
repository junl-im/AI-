# One-Flow Dubbing UX

대상 버전: `0.11.7`

## 목표

처음 방문한 사용자는 엔진·프로젝트 구조·타임라인을 먼저 배우지 않고도 `목소리 → 대본 → 바로 더빙 → 듣기`만으로 첫 결과를 만들 수 있어야 한다. 동시에 숙련자는 기존 프로젝트 패널, Voice Drawer, 다중 선택, 키보드 명령, 실패 복구, 엔진 진단을 잃지 않아야 한다.

## 기본 화면

- PC 1024px 이상도 3분할 DOM 계약은 유지하되 좌우 패널을 기본 접힘으로 시작한다.
- 중앙 One-Flow Composer에 빠른 목소리 선택과 대본 편집/가져오기/생성을 모은다.
- 빈 프로젝트의 타임라인은 숨기고 생성하거나 `빈 대사부터 직접 편집`할 때만 보여준다.
- 제작 기록은 접힌 details로 시작한다.
- 헤더 `프로 패널` 버튼은 좌우 패널을 동시에 펼치거나 다시 집중 모드로 접는다.

## 입력 편의성

- 화면에서 바로 타이핑하면 기존 전역 focus 계약에 따라 대본 editor로 이동한다.
- `Ctrl/Cmd+Enter`는 `바로 더빙 만들기`와 같은 행동이다.
- TXT·MD·SRT·VTT를 파일 선택 또는 drag-and-drop으로 읽는다.
- SRT/VTT의 cue 번호, timestamp, NOTE/STYLE/REGION 메타와 단순 HTML 태그를 제거한다.
- 20,000자 상한과 기존 장문 segment 분할 계약은 유지한다.

## 목소리와 결과

- 기본 5개 프리셋을 중앙에서 즉시 전환한다.
- 전체 Voice Picker와 속도·높낮이·말투는 기존 설정을 그대로 사용한다.
- 사용자가 현재 세션에서 전체 생성을 직접 실행한 경우 첫 준비 음성을 자동 재생한다.
- 세션 복원·새로고침은 기존 autoplay 금지 정책을 유지한다.
- 프로젝트 제목이 아직 `새 프로젝트`이면 첫 대본의 정규화된 앞 36자로 자동 제안한다.

## 안전성과 고급 편집 보존

- 새 단순 화면은 기존 TimelineEditor, batch retry, command bar, recovery evidence, engine routing 기능을 삭제하지 않는다.
- 파일 원본 바이트나 경로는 workspace session에 추가 저장하지 않는다.
- SRT/VTT 정리는 텍스트 intake 편의 기능이며 원본 자막 파일을 변환·덮어쓰지 않는다.
- 사용자가 고급 패널을 펼친 상태와 폭은 `sorion.desktop-studio-layout.v3`에 저장한다.

## 회귀 계약

`scripts/check-one-flow-dubbing-ux.mjs`가 다음을 dependency-free preflight에서 고정한다.

- 중앙 voice controls 연결과 빠른 5 preset 선택
- 기본 양쪽 패널 collapsed + one-click pro toggle
- 빈 timeline 숨김과 blank-edit 진입
- 첫 생성 autoplay 연결
- TXT/MD/SRT/VTT intake와 subtitle normalization
- One-Flow 전용 CSS와 테스트 토큰

실제 ESLint, TypeScript semantic typecheck, Vitest, Vite production build, Chromium visual layout은 GitHub Web quality가 최종 gate다.
