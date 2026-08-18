# MY VOICE Recovery Runtime Evidence

기준 버전: `0.11.26 · Chromium Multi-Scene Evidence & Real MY VOICE Recovery`

## 목적

Timeline의 stale/unavailable MY VOICE 복구 UI 검증과 실제 Voice Clone Worker 성공 증거를 분리합니다.
Chromium multi-scene fixture는 선택 3개 중 stale MY VOICE 2개만 복구 대상으로 표시하는 실제 React UI를 검증하지만,
실제 모델·샘플·Worker를 사용하지 않으므로 **실 MY VOICE 생성 성공 증거가 아닙니다**.

실 runtime 성공을 기록하려면 동의된 프로필과 실제 Worker/model이 준비된 환경에서 별도 JSON 증거를 작성하고
`npm run quality:my-voice-runtime-evidence -- --input <file>`로 검증합니다.
운영 성공 gate까지 닫으려면 `npm run quality:my-voice-runtime-evidence:require -- --input <file>`을 사용합니다.

## 개인정보 경계

증거 JSON에는 원본 profile ID, 샘플 파일 경로, Blob/오디오 원본을 넣지 않습니다.
프로필 식별은 로컬에서 SHA-256으로 만든 64자리 `profileFingerprint`만 사용합니다.
`consentVerified=true`는 해당 실행에 사용한 샘플의 권리·공개·금지용도 동의가 실제로 확인된 경우에만 기록합니다.

## schema `my-voice-recovery-runtime/1`

```json
{
  "schemaVersion": "my-voice-recovery-runtime/1",
  "evidenceClass": "observed-runtime",
  "synthetic": false,
  "capturedAt": "2026-08-18T06:30:00.000Z",
  "startedAt": "2026-08-18T06:29:10.000Z",
  "finishedAt": "2026-08-18T06:29:18.000Z",
  "profileFingerprint": "64-character-sha256-hex-value-replace-me-before-use",
  "consentVerified": true,
  "workerReady": true,
  "modelReady": true,
  "action": "replace-and-regenerate",
  "selectedCount": 3,
  "unavailableCount": 2,
  "changedCount": 2,
  "historicalAudioRestored": false,
  "outcome": "completed",
  "firstAudioMs": 820,
  "audioDurationSeconds": 6.4,
  "playbackCompleted": true,
  "failureReason": ""
}
```

위 예시는 필드 형식을 설명하기 위한 문서 예시이며 실제 운영 증거로 사용하지 않습니다.

## 판정 규칙

- `evidenceClass`는 반드시 `observed-runtime`입니다.
- `synthetic=true`는 거부합니다.
- Worker/model ready와 동의 확인이 모두 필요합니다.
- `changedCount`는 `unavailableCount`와 같아야 하며 선택 전체보다 클 수 없습니다.
- `historicalAudioRestored`는 반드시 `false`여야 합니다. Undo는 Voice 배정 의미만 복원하고 폐기된 과거 audio/job/track을 부활시키지 않는 기존 계약을 유지합니다.
- `completed` 증거에는 `firstAudioMs`, 양수 `audioDurationSeconds`, `playbackCompleted=true`가 필요합니다.
- `failed`/`cancelled` 증거도 보존할 수 있지만 `--require-success` gate를 통과하지 못합니다.

## Chromium evidence와의 관계

`.sorion/web-quality/multi-scene-desktop`과 `.sorion/web-quality/multi-scene-mobile`은
`workspace`, `voice-surface`, `recovery-impact` scene의 PNG, SHA-256, layout/interaction assertion을 보존합니다.
recovery fixture manifest는 `realWorkerClaimed=false`를 명시합니다. 실제 runtime JSON이 없으면 0.11.26을
MY VOICE 실운영 성공으로 표현하지 않습니다.
