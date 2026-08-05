# Voice Review Sync & Selection Telemetry

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.8.2 · Signed Review Approval & Benchmark Dashboard`

## 목적

Quality Lab의 A/B 평가를 다른 환경으로 안전하게 옮기되 로컬 판정이 실제 manifest 승인으로 자동 승격되지 않게 한다. 동시에 Windows System.Speech와 MeloTTS가 실제로 고른 화자를 Engine Doctor에서 확인하고 benchmark를 모델·GPU·프리셋 단위로 분리한다.

## 검수 묶음

- schema: `sorion.voice-preset-review-bundle.v1`
- 전체 canonical payload의 SHA-256을 `payloadSha256`에 저장한다.
- 결정은 `approved`, `needs-review`, `rejected`이며 `approved`는 승인 **후보**일 뿐 manifest 승인 상태가 아니다.
- manifest 초안의 `proposedStatus`는 항상 `pending`이다.
- 검수자, 검수 시각, 현재 WAV SHA-256은 자동 입력하지 않는다.
- 가져오기는 checksum을 검증한 뒤 IndexedDB 로컬 평가만 병합한다.
- 과거 일반 Quality JSON은 명시적 migration으로 읽을 수 있지만 manifest를 수정하지 않는다.

## 승인 무효화

manifest v2의 승인된 `human_review.audio_sha256`은 승인 당시 WAV와 결박된다. 현재 파일이 없거나 checksum이 다르면 `stale`로 진단하고 CosyVoice 전용 프리셋을 차단한다. 운영자는 새 WAV를 다시 청취하고 동의·권리·중복 여부를 확인한 뒤 새 checksum으로 명시적 승인을 수행해야 한다.

## 만료 경고

동의 또는 권리 만료일까지 30일 이하이면 Engine Doctor에 남은 일수와 경고를 표시한다. 이미 만료된 경우 기존 계약대로 사용을 차단한다. 경고는 자동 갱신이나 법적 판단이 아니다.

## 실제 화자 선택 진단

- Windows System.Speech: 설치된 한국어 음성의 이름, 문화권, 성별과 프리셋 후보 순번을 기록한다.
- MeloTTS: 로딩된 모델의 speaker ID, speaker 이름, 판정 성별과 이름 우선·성별 후보 순번 등 선택 근거를 기록한다.
- 모델이 로딩되지 않았거나 호환 후보가 부족하면 READY로 표시하지 않는다.
- 운영체제·모델 metadata는 불완전할 수 있으며 특정 인물 일치나 권리를 보증하지 않는다.

## Benchmark 그룹

실기기 기록은 장치·엔진뿐 아니라 `model_id`, `model_version`, `model_digest`, `accelerator_name`, `gpu_name`, `voice_preset_id`로 그룹화한다. 같은 그룹에서 표본 수, first audio, RTF, 실패율, seam과 final handoff 오차 P95를 비교한다. digest나 GPU가 다른 표본을 하나의 성능 수치로 합치지 않는다.

## 보안·개인정보 경계

- 검수 묶음에 실제 WAV, 동의 문서 원문, 로컬 전체 경로와 비밀키를 넣지 않는다.
- SHA-256은 변조 감지이며 전자서명, 운영자 신원, 권리 또는 측정 진실성을 보증하지 않는다.
- 실제 증거 없이 `confirmed`, `approved`, READY 또는 성능 수치를 생성하지 않는다.


## 6.8.2 승인 연결

검수 묶음의 `approved` 결정은 계속 승인 후보입니다. 운영자는 Quality Lab의 수동 승인 카드에서 실제 WAV checksum, manifest digest, 동의·권리 상태와 중복 여부를 다시 계산한 diff를 확인해야 합니다. apply 시 preview가 다시 계산되므로 검토 뒤 파일이 바뀌면 승인을 적용할 수 없습니다.

선택적 HMAC 서명은 `SORION_VOICE_REVIEW_SIGNING_SECRET`과 key ID가 설정된 로컬 운영 환경에서만 생성됩니다. 검수 묶음 자체의 SHA-256과 승인 HMAC은 목적이 다르며, 어느 것도 법적 권리 원본을 대신하지 않습니다.
