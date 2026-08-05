# Voice Preset Evidence Review

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.8.2 · Signed Review Approval & Benchmark Dashboard`

## 목적

프리셋 파일명이 존재한다는 이유만으로 특정 인물·성별의 승인된 음성이라고 간주하지 않는다. 전용 CosyVoice 음성은 WAV 품질, 동의, 이용 권리, 사람 청취 검수, 파일 무결성과 프리셋별 고유성을 모두 확인한 뒤에만 사용한다.

## 파일 한 쌍

각 프리셋은 같은 ID의 두 파일을 사용한다.

```text
voice-presets/on-clear.wav
voice-presets/on-clear.manifest.json
```

5개 기본 ID는 `sori-warm`, `on-clear`, `dam-calm`, `jun-deep`, `min-energetic`이다. manifest의 `voice_id`, `display_name`, `declared_gender`, `reference_file`은 코드의 프리셋 계약과 정확히 일치해야 한다.

## 승인 순서

1. 화자와 권리자로부터 실제 사용 범위를 확인하고 원본 근거 위치를 내부 기록에 남긴다.
2. 깨끗한 한국어 WAV를 만들고 파일명과 프리셋 ID를 맞춘다.
3. SHA-256과 파일 크기를 계산해 manifest `integrity`에 기록한다.
4. 같은 WAV를 다른 인물 프리셋에 복사하지 않았는지 checksum으로 확인한다.
5. Quality Lab에서 해당 프리셋을 선택하고 동일 문장 A/B를 실제 모델로 청취한다.
6. 운영자가 인물 구분·발음·톤·안전성을 확인한 뒤 `human_review`를 승인한다.
7. Engine Doctor에서 WAV, manifest, 최종 사용 가능이 모두 READY인지 확인한다.
8. WAV를 바꾸면 SHA-256과 파일 크기를 다시 기록하고 사람 검수를 재수행한다.

## 상태 계약

- `consent.status`: 실제 동의가 확인되기 전에는 `pending`; 철회·거부는 `rejected`; 만료는 `expired`
- `rights.allowed_uses`: 실제 허용된 경우에만 `tts-inference` 추가
- `human_review.status`: 사람이 실제 결과를 청취하기 전에는 `pending`
- `integrity.sha256`: 소문자 64자리 SHA-256이며 실제 WAV 바이트와 일치해야 함
- 만료 시각이 현재보다 과거면 차단
- 같은 실제 SHA-256이 둘 이상의 인물 ID에 있으면 모든 관련 ID 차단


## Manifest v3와 명시적 승인

- 기존 pending 템플릿과 과거 v2는 읽을 수 있지만, 새 수동 승인을 적용하면 `schema_version=3`으로 기록한다.
- 승인 API는 현재 WAV SHA-256, 현재 manifest SHA-256, 검수 묶음 SHA-256, 동의·권리·중복·만료 상태를 다시 확인한 preview를 만든다.
- apply 요청은 preview ID와 정확히 같은 입력을 다시 계산하며 WAV·manifest가 바뀌었으면 거부한다.
- 승인 전후 manifest 전체 snapshot과 digest를 로컬 approval JSONL에 보존한다. 실제 WAV와 동의 문서 원문은 기록하지 않는다.
- `approval.mode=hmac-sha256`은 설정된 로컬 secret으로 canonical approval payload를 서명한 경우에만 사용한다. secret이 없으면 `unsigned`이다.
- signed manifest는 같은 key ID·secret으로 검증되지 않으면 Engine Doctor와 CosyVoice에서 READY가 아니다.
- 롤백은 현재 manifest가 해당 승인 직후 digest와 일치할 때만 허용하며, 사유와 관련 approval ID를 별도 event로 남긴다.
- checksum은 파일 변경 탐지, HMAC은 공유 secret 보유 확인이다. 어느 것도 화자 신원, 동의 진위 또는 법적 권리를 자동 증명하지 않는다.

## Manifest v2와 검수 checksum

- `schema_version`은 2이다.
- `human_review.status=approved`이면 승인 당시 실제 WAV의 소문자 64자리 SHA-256을 `human_review.audio_sha256`에 기록한다.
- 현재 WAV SHA-256이 승인 당시 값과 다르면 진단 상태는 `stale`이며 다시 청취·승인하기 전까지 사용할 수 없다.
- 검수 묶음에서 시작한 승인 검토라면 `source_review_bundle_sha256`에 해당 묶음 checksum을 기록할 수 있다. 이는 출처 연결용이며 자동 승인 또는 운영자 신원 증명이 아니다.
- 동의·권리 만료일까지 30일 이하이면 경고한다. 만료된 경우 계속 차단한다.

## 검수 묶음 안전 흐름

Quality Lab은 `sorion.voice-preset-review-bundle.v1` JSON을 내보낸다. 묶음은 canonical payload SHA-256을 포함하고 가져오기 전에 다시 계산해 비교한다. 각 manifest 초안의 상태는 항상 `pending`이며 검수자, 검수 시각과 WAV checksum을 비워 둔다. 가져오기는 로컬 평가만 병합하고 실제 manifest 파일을 자동 변경하지 않는다.

운영자는 별도 승인 단계에서 현재 WAV, 동의·권리 원본, 표시 이름·성별, 청취 결과와 checksum을 다시 확인해야 한다. checksum은 파일 변경 탐지 수단이지 전자서명, 권리 증명 또는 화자 신원 인증이 아니다.

## Engine Doctor 해석

- **WAV 검사**: 파일 존재, PCM 형식, 길이, 샘플레이트, 무음과 클리핑 검사
- **manifest 인증**: 구조, ID·이름·성별·파일명, 동의, 권리, 사람 검수, checksum 검사
- **최종 사용 가능**: WAV와 manifest가 모두 통과하고 다른 인물과 checksum이 중복되지 않은 상태

진단 복사본에는 실제 WAV 바이트, 로컬 전체 경로, 원본 문장과 동의 문서 내용은 포함하지 않는다. 상태·checksum 일치 여부·중복 프리셋 ID만 공유한다.

## 제공 템플릿의 의미

릴리스 ZIP의 5개 manifest는 `pending`, `unknown`, 빈 checksum으로 제공된다. 이는 누락된 실제 증거를 임의로 만들지 않기 위한 안전한 기본값이다. 템플릿이 존재해도 실제 WAV와 검증 자료가 없으면 READY가 아니다.

## 금지

- 파일명만 바꿔 같은 사람 WAV를 여러 인물로 등록
- 동의·권리 원본을 확인하지 않고 `confirmed`로 변경
- 실제 청취 없이 `approved`로 변경
- WAV 교체 후 이전 checksum·검수 기록 재사용
- Browser/System 근사 음성을 특정 실존 인물의 전용 음성으로 표현
- 성별·신원·동의를 파형 또는 파일명만으로 자동 확정
