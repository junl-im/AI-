# Release Readiness · 0.11.29

`release-readiness/1`은 SoriON AI의 출시 준비 상태를 한 화면과 한 JSON summary에서 확인하기 위한 인증 집계 계약입니다.

## 원칙

- 파일이 존재한다는 이유만으로 READY가 되지 않습니다.
- GitHub Actions, Kakao Android, Kakao iOS, Chromium desktop, Chromium mobile, MY VOICE를 서로 독립적으로 판정합니다.
- 하나라도 누락되거나 BLOCKED이면 Overall은 `PENDING`입니다.
- 모든 슬롯이 READY일 때만 Overall `CERTIFIED`를 허용합니다.
- Chromium recovery fixture의 `realWorkerClaimed=false`를 유지하며 synthetic UI fixture를 실제 MY VOICE 성공으로 승격하지 않습니다.
- MY VOICE는 `observed-runtime`, 사용자 동의, Worker/model ready, 실제 completed playback이 있어야 READY입니다.

## 필수 6개 evidence

1. **GitHub Actions Web quality**
   - `.sorion/web-quality/report.json`
   - `mode=run`, 현재 app version 일치, 8개 phase 전부 PASS
   - `reportSha256`와 `evidenceSha256` 재계산 일치
2. **Kakao Android**
   - `field-device-certification/1`
   - `observed-device`, `synthetic=false`, `surface=kakao-android`
   - direct preview 또는 실패 + 외부 브라우저 fallback 관찰
   - exit dialog open + `계속 만들기` close + operator confirmation
3. **Kakao iOS**
   - Android와 같은 계약, `surface=kakao-ios`
4. **Chromium Desktop**
   - `chromium-multi-scene/1`, mode `desktop`
   - workspace / voice-surface / recovery-impact 3 scene × 3 viewport = 9 captures
   - 9개 모두 PASS + SHA-256
5. **Chromium Mobile**
   - `chromium-multi-scene/1`, mode `mobile`
   - 9개 captures 모두 PASS + SHA-256
6. **MY VOICE**
   - `my-voice-recovery-runtime/1`
   - `evidenceClass=observed-runtime`
   - consent verified, Worker/model ready, replace-and-regenerate, completed playback
   - raw profile ID, sample path, sample blob은 evidence에 포함 금지

## Quality Lab 사용법

Quality Lab의 **출시 인증 상태** 카드에서 6개 JSON을 각각 선택합니다. 각 슬롯은 `READY`, `PENDING`, `BLOCKED`로 표시되고 상단에서 다음 그룹을 별도로 보여줍니다.

- `CI READY`
- `DEVICE READY`
- `CHROMIUM READY`
- `MY VOICE READY`
- `Overall CERTIFIED` 또는 `PENDING`

`readiness JSON 저장`은 원본 audio/sample/profile data를 포함하지 않고 파일 SHA-256, app version, commit/run metadata, 판정 결과만 저장합니다.

## CLI verifier

```text
node scripts/verify-release-readiness.mjs \
  --web-quality .sorion/web-quality/report.json \
  --android kakao-android.json \
  --ios kakao-ios.json \
  --desktop-scenes desktop/manifest.json \
  --mobile-scenes mobile/manifest.json \
  --my-voice my-voice-runtime.json \
  --output release-readiness.json \
  --require-certified
```

`--require-certified`가 없으면 미수집 슬롯을 `pending`으로 보존한 summary를 만들 수 있습니다. 이 옵션이 있으면 여섯 슬롯이 모두 READY가 아니면 non-zero exit로 실패합니다.

## GitHub Actions 연결

Web quality report의 `source.commitSha`와 `source.runId`는 readiness summary에 전달됩니다. CI 녹색 표시를 단순 사용자 입력으로 만들지 않고, 해당 run report의 phase/status/version/checksum을 검증해서 판정합니다.

## 제한

- 브라우저 UI는 GitHub API에 직접 로그인하거나 Actions를 원격 제어하지 않습니다. Actions artifact에서 내려받은 JSON을 사용합니다.
- Kakao WebView가 Speech Synthesis를 차단하는 기기는 direct preview가 아니라 실제 fallback 관찰로 READY가 될 수 있으며, 두 경로를 detail에서 구분합니다.
- 실제 MY VOICE runtime evidence가 없으면 Overall은 계속 `PENDING`입니다.
