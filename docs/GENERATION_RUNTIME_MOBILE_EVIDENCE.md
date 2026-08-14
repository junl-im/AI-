# Generation Runtime Split & Mobile Evidence · 0.11.17

## 목적

`useTimelineGeneration` 한 파일에 집중되어 있던 네트워크 generation runtime 책임을 분리하고, 모바일 회귀를 정적 CSS 토큰이 아닌 실제 Chromium viewport에서 확인합니다.

## Runtime boundary

`src/hooks/useTimelineGeneration.ts`는 Timeline 상태, edit history, staging, batch orchestration, restore/edit command의 public controller 역할을 유지합니다.

`src/timeline/generationRuntime.ts`는 다음 실행 책임을 소유합니다.

- synthesis/recovery job 실행
- SSE + polling progress 수신
- signed ready-segment refresh
- segment fetch / first-byte telemetry
- out-of-order segment의 순서 보장
- progressive track publish와 최종 WAV handoff
- browser speech / mock fallback
- revision mismatch와 abort safety

Hook의 외부 API는 변경하지 않아 `HomePage`, STT recovery, 기존 Timeline 테스트가 같은 controller 계약을 사용합니다.

## Mobile Chromium gate

`npm run quality:mobile-layout`은 기존 dependency-free CDP runner를 `--mobile`로 실행합니다.

검사 viewport:

- 360×800
- 390×844
- 430×932

주요 assertion:

- document horizontal overflow 없음
- 모바일 player dock / 주요 메뉴 표시
- 주요 메뉴 touch target 높이 44px 이상
- Timeline `＋ / ✓` touch selector 실제 표시
- 장문 editor와 Timeline outer frame이 viewport 밖으로 이탈하지 않음
- 다중 선택 batch editor가 실제로 열리고 controls가 card 안에 포함됨
- 고정 Dock을 위한 하단 clearance가 118px 이상 확보됨

GitHub Actions는 desktop visual regression과 mobile visual regression을 각각 실행하고 어느 하나라도 실패하면 screenshot/manifest evidence를 업로드한 뒤 Web quality를 실패 처리합니다.

## 성능 관련 변경

`LinkedPlayerDock`의 주요 메뉴는 memoized component로 분리해 200ms 단위 browser-speech progress나 audio timeupdate가 발생해도 navigation subtree가 불필요하게 다시 계산되지 않도록 했습니다. 페이지 이동 후 scroll은 smooth animation 대신 다음 animation frame에서 top으로 정렬해 새 workspace layout과 scroll animation의 경쟁을 줄입니다.

## 유지되는 제한

- generation concurrency 상한은 2 유지
- 실제 음질 평가는 별도 실기기/승인 WAV 증거 필요
- mobile Chromium gate는 layout/interactivity 회귀용이며 실제 iOS/Android 오디오 정책 인증을 대체하지 않음
