# Field Device & MY VOICE Runtime Certification

기준 버전: `0.11.27 · Field Device & MY VOICE Runtime Certification`

## 목적

0.11.25 R1에서 보강한 카카오 모바일 WebView의 preset 미리듣기와 뒤로가기 종료 guard를 실제 기기에서 닫고,
0.11.26의 Chromium multi-scene UI evidence와 실제 MY VOICE Worker runtime evidence를 서로 다른 증거 등급으로 유지합니다.
저장소와 CI는 실기기 성공 또는 Voice Clone 성공을 합성하지 않습니다.

## 카카오 실기기 증거 `field-device-certification/1`

앱은 카카오톡 Android/iOS에서 실제로 발생한 다음 이벤트만 localStorage에 누적합니다.

- preset 미리듣기 탭 시도
- Speech Synthesis `onstart` 도달
- unsupported / voice-unavailable / blocked / watchdog-timeout / exception 실패 원인
- 사용자가 `외부 브라우저로 열기`를 실제로 누른 요청
- 하드웨어/브라우저 뒤로가기로 종료 dialog가 실제 열린 이벤트
- `계속 만들기`를 눌러 dialog가 닫힌 이벤트

전체 User-Agent, 실제 기기 이름, 프로젝트 문장, 음성 바이트, 샘플 경로는 저장하지 않습니다.
Quality Lab의 `카카오 실기기 동작 인증` 카드에서 JSON을 내려받을 수 있습니다.

### READY 규칙

- surface는 `kakao-android` 또는 `kakao-ios`여야 합니다.
- preview는 직접 `onstart`가 관찰되거나, WebView 차단 원인과 외부 브라우저 요청이 함께 관찰되어야 합니다.
- 종료 dialog 열림과 `계속 만들기` 닫힘이 모두 관찰되어야 합니다.
- 마지막으로 `operatorConfirmed=true`가 필요합니다. 이 값은 실제 기기에서 직접 수행한 사람이 Quality Lab에서 확인할 때만 설정합니다.
- synthetic evidence는 READY에 사용할 수 없습니다.

검증:

```text
npm run quality:field-device-evidence -- --input <file> --require-ready
```

## 릴리스 단위 통합 인증

Android와 iOS 실기기 증거를 함께 검증합니다. Chromium multi-scene manifest와 MY VOICE observed runtime은 실제 파일이 있을 때 추가합니다.

```text
npm run quality:field-runtime-certification -- \
  --android <kakao-android.json> \
  --ios <kakao-ios.json> \
  --desktop-scenes <multi-scene-desktop/manifest.json> \
  --mobile-scenes <multi-scene-mobile/manifest.json> \
  --my-voice <my-voice-runtime.json> \
  --require-all
```

`--require-all`은 다음을 모두 요구합니다.

1. 카카오톡 Android READY
2. 카카오톡 iOS READY
3. desktop Chromium 9 scene capture PASS + SHA-256
4. mobile Chromium 9 scene capture PASS + SHA-256
5. `my-voice-recovery-runtime/1` 실제 MY VOICE completed evidence

MY VOICE 파일이 없으면 field-device 결과와 Chromium 결과를 검증할 수는 있지만 전체 상태는 pending입니다.
Chromium recovery fixture의 `realWorkerClaimed=false`는 그대로 유지하며 synthetic/UI fixture를 실제 Voice Clone 성공으로 승격하지 않습니다.
