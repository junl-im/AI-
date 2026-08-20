# Neural Voice Runtime Certification & Shared Preview Cache

Current basis: `0.11.32 · Neural Voice Runtime Certification & Shared Preview Cache`

## 목적

0.11.30의 preset v4 provenance가 `reference/model이 등록상 READY`인지를 확인했다면 0.11.32는 실제 미리듣기 요청 시점에 같은 provenance를 다시 확인하고 PC와 모바일이 같은 neural WAV asset을 재사용했는지를 증거로 남깁니다.

## 서버 runtime gate

`POST /api/v1/tts/neural-preview`는 다음 조건을 모두 만족해야 실행됩니다.

1. 현재 preset evidence가 `neural_preview_ready=true`입니다.
2. 클라이언트가 본 `expected_preview_cache_key`와 서버가 현재 다시 계산한 `preview_cache_key`가 같습니다.
3. CosyVoice Worker가 강제 probe에서 READY입니다.
4. Worker runtime diagnostics의 `model_digest`가 승인 manifest의 `model_fingerprint`와 정확히 같습니다.
5. reference fingerprint는 현재 WAV SHA-256과 일치하는 기존 v4 gate를 계속 통과합니다.
6. 생성은 explicit `cosyvoice3` 단일 엔진으로 수행하며 fallback 결과는 neural cache로 저장하지 않습니다.

조건이 하나라도 다르면 `SOA-4030~4035` 계열 오류로 neural 승격을 거부하고 Web은 기존 기기 음성 fallback을 사용할 수 있습니다.

## Shared preview cache

서버 cache identity는 다음 검증 identity를 결합합니다.

- preset `preview_cache_key`
- 정규화된 대본의 SHA-256 (`text_sha256`)
- emotion/speed/pitch의 canonical SHA-256 (`style_sha256`)

실제 cache ID는 위 identity를 SHA-256으로 다시 묶습니다. 동일 preset provenance, 동일 대본, 동일 발화 설정이면 PC와 모바일이 같은 cache ID와 같은 WAV를 사용합니다.

Cache metadata에는 raw 대본이나 reference WAV 경로를 저장하지 않고 digest와 다음 runtime 정보만 보존합니다.

- voice ID
- cache ID / preview cache key
- text/style SHA-256
- generated WAV SHA-256
- model/reference fingerprint
- generation first-audio / processing timing
- 생성 시각

WAV를 읽을 때 metadata의 `audio_sha256`을 다시 계산해 변조되었으면 cache hit로 인정하지 않습니다. Cache 생성은 기존 `JobManager`의 동시 생성 제한과 deterministic job ID를 사용해 같은 cache 요청이 겹쳐도 동일 작업으로 조정됩니다.

## Browser runtime evidence

실제 `<audio>`가 `playing`에 진입하면 playback start를, `ended`를 관찰하면 playback completion을 기록합니다. 단순 API 성공이나 enqueue만으로 완료 인증을 만들지 않습니다.

Evidence schema: `neural-voice-runtime-certification/1`

저장하는 항목:

- `evidenceClass=observed-runtime`
- `synthetic=false`
- coarse surface (`desktop-browser` / `mobile-browser`)
- cache/audio/model/reference SHA identity
- generation first-audio
- playback started/completed timestamp

저장하지 않는 항목:

- 전체 User-Agent
- 기기 이름
- 원문 대본
- audio URL/blob
- reference/sample 경로
- 사용자 식별자

## PC / Mobile SHARED READY

Quality Lab의 `PC·모바일 동일 neural preview 인증`은 한 성우에 대해 다음 두 observed record가 모두 있어야 합니다.

- desktop-browser playback completed
- mobile-browser playback completed

그리고 두 record의 다음 값이 모두 동일해야 `SHARED READY`입니다.

- cache ID
- audio SHA-256
- model fingerprint
- reference fingerprint

다른 기기의 JSON을 가져와 로컬 evidence와 병합할 수 있습니다. synthetic evidence는 importer가 거부합니다.

CLI:

```text
npm run quality:neural-runtime-evidence -- --input <bundle.json>
npm run quality:neural-runtime-evidence -- --input <bundle.json> --require-shared
```

`--require-shared`는 혜린·도윤·소리·준호·민준 5명 모두 PC/mobile 동일 source가 확인되어야 PASS합니다.

## 현재 한계

저장소에는 실제 rights-cleared reference WAV/model을 포함하지 않습니다. 따라서 개발 fixture로 verifier 계약을 검증할 수는 있지만 실제 5/5 SHARED READY 또는 neural 음질 성공을 주장하지 않습니다. 실제 운영 asset과 Worker가 준비된 후 실기기 재생으로 인증해야 합니다.
