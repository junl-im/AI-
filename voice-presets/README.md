# SoriON preset reference voices

실제 CosyVoice 인물별 프리셋 음색을 사용하려면 동의받은 한국어 기준 WAV와 같은 ID의 manifest를 이 폴더 또는 `SORION_COSYVOICE_PRESET_DIRECTORY`에 둡니다.

| 프리셋 | WAV | manifest |
| --- | --- | --- |
| 혜린 · 여성 | `sori-warm.wav` | `sori-warm.manifest.json` |
| 도윤 · 남성 | `on-clear.wav` | `on-clear.manifest.json` |
| 소리 · 중성 | `dam-calm.wav` | `dam-calm.manifest.json` |
| 준호 · 남성 | `jun-deep.wav` | `jun-deep.manifest.json` |
| 민준 · 남성 | `min-energetic.wav` | `min-energetic.manifest.json` |

`START_ENGINE.cmd`는 이 폴더를 자동 연결합니다. API를 직접 실행할 때만 환경변수 `SORION_COSYVOICE_PRESET_DIRECTORY`에 폴더 경로를 설정합니다.

## WAV 조건

- 권리자와 화자의 명시적 동의를 받은 한국어 기준 음성
- PCM WAV, 모노 또는 스테레오
- 16kHz~48kHz, 1초~30초, 25MB 이하
- 과도한 무음과 클리핑이 없는 깨끗한 발화
- 파일명에 해당하는 표시 이름·성별·톤을 운영자가 직접 청취 확인

## manifest v2/v3 필수 항목

- `voice_id`, `display_name`, `declared_gender`, `reference_file`이 현재 프리셋과 정확히 일치
- `consent.status`가 실제 근거를 확인한 `confirmed`
- `rights.allowed_uses`에 `tts-inference` 포함
- `integrity.sha256`가 실제 WAV SHA-256과 일치하고 필요하면 파일 크기도 기록
- `human_review.status`가 운영자의 실제 청취 뒤 `approved`
- 승인 시점 실제 WAV SHA-256을 `human_review.audio_sha256`에 기록하며 WAV 교체 뒤에는 재검수
- 검수 묶음에서 시작한 경우 `source_review_bundle_sha256`은 출처 연결에만 사용하며 자동 승인 근거로 사용 금지
- 동의·권리 만료일이 지났거나 원본 근거를 확인할 수 없으면 사용 금지
- 동의·권리 만료일까지 30일 이하이면 Engine Doctor 경고를 확인하고 갱신 전까지 보수적으로 운영

릴리스에 포함된 manifest는 안전한 `pending` 템플릿입니다. 실제 증거를 확인하지 않은 채 상태만 변경하지 마십시오.

새 승인은 Quality Lab의 수동 승인 카드에서 현재 WAV·manifest·검수 묶음 checksum을 다시 계산한 뒤 manifest v3로 적용합니다. `SORION_VOICE_REVIEW_SIGNING_SECRET`이 설정된 운영 환경만 HMAC-SHA256을 기록하며 secret이 비어 있으면 unsigned가 정상입니다. 실제 secret은 이 폴더, manifest, Git 또는 릴리스 ZIP에 넣지 않습니다.

## 중요한 차단 규칙

- 알려진 5개 프리셋은 반드시 같은 ID의 전용 WAV와 인증 manifest만 사용합니다.
- WAV가 없거나 품질 검사에 실패하면 공통 기본 WAV나 다른 인물 WAV로 대체하지 않습니다.
- manifest가 없거나 동의·권리·사람 검수·checksum이 준비되지 않으면 전용 음성으로 사용하지 않습니다.
- 같은 실제 WAV SHA-256을 여러 인물 프리셋에 등록하면 관련 프리셋을 모두 차단합니다.
- 전용 파일이 준비되지 않은 상태는 CosyVoice 전체 장애가 아니라 해당 프리셋 미지원으로 처리합니다.
- `SORION_COSYVOICE_TTS_REFERENCE_PATH`의 기본 기준 음성은 5개 인물 프리셋의 대체재가 아닙니다.

실제 음성 WAV와 원본 동의·권리 자료는 로컬에서 관리하고 저장소·일반 릴리스 ZIP에는 포함하지 않습니다. manifest만으로 화자 신원·성별·권리를 자동 확정하지 않습니다. 자세한 절차는 `docs/VOICE_PRESET_EVIDENCE.md`를 따릅니다.
