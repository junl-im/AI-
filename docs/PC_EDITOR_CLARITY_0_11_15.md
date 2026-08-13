# PC Editor Clarity & Linked Timeline Player · 0.11.15

## 목표

PC 편집 화면을 고급 오디오 편집기처럼 정돈하되, 처음 사용하는 사람도 `대사 확인 → 재생 확인 → 선택 클립 편집` 순서를 바로 이해하도록 정보 구조를 단순화합니다.

## 확정 UX

### Voice Core
- 큰 hero/banner가 아니라 낮은 가로형 control strip으로 사용합니다.
- 현재 voice engine 상태와 파형은 보조 정보이며 제작 본문보다 시각적으로 앞서지 않습니다.

### Voice Picker
- PC에서는 centered compact modal을 사용합니다.
- 카드에는 이름, 성별, 한 줄 톤 설명, 미리듣기/선택만 우선 노출합니다.
- 장점·주의·추천 용도 같은 긴 설명은 선택창에서 제거합니다. preset 데이터는 삭제하지 않습니다.

### Timeline Editor
- PC 직접 자식의 기본 흐름은 `header → toolbar → dialogue track → linked player → selected clip editor → batch result → add block`입니다.
- Dialogue track이 선택 클립 편집보다 위에 있어 전체 맥락을 먼저 파악하게 합니다.
- Linked Player는 timeline 문맥 안에서 즉시 재생·일시정지·이전/다음·seek를 제공하지만 별도 audio element를 소유하지 않습니다.

### Playback single source of truth
- Timeline Linked Player와 하단 LinkedPlayerDock은 같은 Zustand player store를 사용합니다.
- queue, currentTrackId, playbackTrackId, playbackPositionSeconds, playbackActive를 공유합니다.
- 재생/seek/이전/다음 명령도 같은 store action을 호출합니다.
- 독립적인 local playback state를 추가하지 않습니다.

### Side panels
- expanded 상태에서는 각 패널 header 안에 `접기`를 둡니다.
- collapsed 상태에서는 해당 rail에 `펼치기` affordance를 남깁니다.
- absolute-positioned toggle이 본문/다른 버튼 위에 겹치지 않도록 합니다.

### Final export
- 최종 WAV/MP3 + SRT/VTT는 Timeline 내부에서 제거합니다.
- 상단 `내보내기` 버튼이 별도 완료 dialog를 엽니다.
- `현재 재생 음성만 다운로드`와 `완성본 내보내기`를 의미상 분리합니다.

## 모바일 경계

이번 패치는 PC 가독성 개선이 중심입니다. Timeline Linked Player는 1024px 미만에서 숨기고 기존 Dock/모바일 흐름을 유지합니다. export dialog는 좁은 화면에서 bottom sheet 형태로 대응합니다.

## 검증 계약

- dependency-free repository preflight 47/47
- one-flow / mobile studio / project rules / studio playback-timeline 계약
- changed TS/TSX syntax transpile
- 전체 Vitest/ESLint/semantic typecheck/Vite build는 dependency가 정상 설치되는 GitHub-hosted CI에서 최종 판정
