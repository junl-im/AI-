# Neural Voice Reference Intake & Preview Promotion

Version: `0.11.30`

## 목적

SoriON의 5개 기본 성우 프리셋은 Browser/System Speech의 기기별 음색을 최종 품질로 간주하지 않습니다. 실제 neural 미리듣기는 권리·동의·사람 검수·reference 무결성·모델 fingerprint가 모두 확인된 preset만 승격합니다.

이 릴리스는 실제 성우 WAV나 모델 파일을 배포하지 않습니다. 원본 reference WAV, 동의 문서, 개인 식별 자료, 모델 파일은 Git과 전달 ZIP 밖의 운영 저장소에 둡니다.

## Manifest v4

Quality Lab의 `성우 reference intake · 미리듣기 승격` 카드에서 각 preset의 v4 템플릿을 내려받을 수 있습니다. 운영자는 `SORION_COSYVOICE_PRESET_DIRECTORY`에 다음 두 파일을 배치합니다.

- `{voiceId}.wav`
- `{voiceId}.manifest.json`

v4는 기존 동의·권리·무결성·사람 검수·서명 필드에 `neural_preview`를 추가합니다.

- `engine_id`: 현재 승격 가능한 값은 `cosyvoice3`
- `model_id`: 운영 모델 식별용 비밀이 아닌 논리 ID
- `model_fingerprint`: 실제 사용 모델의 SHA-256 fingerprint
- `reference_fingerprint`: 실제 reference WAV SHA-256과 동일해야 함

템플릿은 기본적으로 consent/review를 `pending`, rights source를 `unknown`, fingerprint를 빈 값으로 생성합니다. 템플릿을 내려받았다는 사실만으로 READY가 되지 않습니다.

## 승격 조건

`/setup`의 preset diagnostic이 다음을 모두 만족해야 `neuralPreviewReady=true`가 됩니다.

1. reference WAV 자체의 오디오 품질 검사가 usable임.
2. manifest 동의·권리·사람 검수·승인 검증이 ready임.
3. manifest schema가 v4 이상임.
4. `neural_preview.engine_id == cosyvoice3`임.
5. `model_fingerprint`가 유효한 64자리 SHA-256임.
6. `reference_fingerprint`가 실제 WAV SHA-256과 정확히 일치함.

READY이면 API는 voice ID, reference SHA, model fingerprint, approval ID, signed payload SHA를 묶어 `previewCacheKey`를 생성합니다. PC와 모바일은 같은 READY diagnostic에서 같은 cache identity를 사용합니다.

## 미리듣기 라우팅

Home의 기본 성우 ▶ 미리듣기는 READY가 캐시된 preset에 대해서만 `cosyvoice3`를 명시적으로 요청합니다. v1~v3 manifest는 기존 일반 생성 호환성을 유지하지만 neural preview 기본값으로 승격되지 않습니다.

READY가 아니면 기존의 자연화된 `기기 음성` Browser Speech fallback을 유지합니다. 승격된 neural 요청이 런타임에서 실패해도 Browser Speech가 가능한 환경에서는 기기 음성 fallback을 시도하고, 기존 플레이어 watchdog/카카오 외부 브라우저 복구 규칙은 유지합니다.

## 보안·권리 경계

- reference WAV를 Git/ZIP에 포함하지 않습니다.
- 동의서 원문, 계약서 원문, 사람 이름·연락처를 manifest에 넣지 않습니다.
- `subject_reference`, `evidence_reference`, `source_reference`는 운영 증거의 비민감 식별자/경로만 사용합니다.
- 실제 권리와 동의를 확인하기 전 `confirmed`, `approved`, 상업 사용 권한을 표시하지 않습니다.
- model fingerprint가 있다고 해서 모델 라이선스가 자동으로 확인되는 것은 아닙니다. rights review는 별도로 완료해야 합니다.
- 실제 권리 확인 reference와 모델 runtime이 없으면 neural 음질 성공을 주장하지 않습니다.

## 현재 릴리스의 한계

0.11.30은 intake, provenance 검증, preview promotion/fallback 배관을 제공합니다. 실제 5개 성우 reference WAV와 모델 fingerprint는 제품 ZIP에 포함하지 않으므로 기본 설치에서는 neural READY가 의도적으로 pending일 수 있습니다. 실제 품질·PC/모바일 동일 음색 인증은 다음 단계에서 운영 reference와 Worker/model이 준비된 뒤 수집합니다.
