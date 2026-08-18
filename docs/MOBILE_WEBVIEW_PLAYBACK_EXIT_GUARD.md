# Mobile WebView Playback & Exit Guard

기준: `0.11.25 R1`

## 문제

PC에서는 preset Browser Speech 미리듣기가 정상인데 카카오톡 모바일 인앱브라우저에서 ▶ 상태만 바뀌고 음성이 시작되지 않는 사례가 확인됐습니다. 기존 구현은 preview 결과를 player queue에 넣은 뒤 React effect와 `setTimeout(0)`을 거쳐 `speechSynthesis.speak()`를 호출했습니다. 모바일 WebView는 audio/speech user activation을 더 엄격히 처리할 수 있으므로 최초 탭과 실제 `speak()` 사이의 비동기 경계가 위험했습니다.

동시에 앱 종료 확인은 guard entry에서 Back → `popstate` → 즉시 guard 재삽입 → 종료 시 `history.go(-2)` 구조였습니다. 인앱브라우저의 자체 back stack과 결합할 때 `계속 만들기`/종료 동작이 불안정할 수 있어 단순화가 필요했습니다.

## 결정

1. `KAKAOTALK` 인앱브라우저 + preset + Browser Speech route에서는 preview 탭 call stack 안에서 `speechSynthesis.speak()`를 직접 호출합니다.
2. `onstart` 전에는 실제 playing으로 확정하지 않습니다. 1.8초 안에 start 응답이 없으면 cancel하고 UI를 idle로 돌린 뒤 외부 브라우저 안내를 표시합니다.
3. 공용 player Browser Speech에도 동일한 watchdog을 둡니다.
4. AppShell의 카카오 전용 안내는 API 객체가 보이더라도 WebView 정책상 재생이 제한될 수 있음을 명시합니다. 외부 브라우저 custom scheme 이동은 clipboard promise를 기다리지 않고 원래 탭 안에서 실행합니다.
5. Exit guard는 `base -> guard` 1단계만 유지합니다. 첫 Back은 base로 이동하며 dialog만 표시합니다. `계속 만들기`는 guard를 다시 push하고 dialog를 닫습니다. `종료`는 base에서 `history.back()` 한 번만 실행합니다.

## 비목표

- 카카오 WebView에서 Web Speech 성공을 보장한다고 주장하지 않습니다.
- MY VOICE clone runtime이나 preset 음질/속도 정책을 변경하지 않습니다.
- 외부 브라우저 이동을 강제하지 않습니다. 사용자가 카카오 안에서 시도할 수 있고, 실패 시 명확한 복구 동선을 제공합니다.

## 검증 계약

- `test:web-critical`은 Browser Speech, `LinkedPlayerDock`, exit confirmation, in-app browser detection, Voice Drawer, Timeline recovery를 포함합니다.
- `check-mobile-studio-flow.mjs`는 카카오 direct speech, start watchdog, 외부 브라우저 gesture preservation, 새 exit guard를 dependency-free로 검사합니다.
- 실제 Kakao Android/iOS 성공은 실기기에서 별도 확인해야 하며 synthetic/jsdom 결과를 observed-device 성공으로 기록하지 않습니다.
