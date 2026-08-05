# Voice Presets

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.8.2 · Signed Review Approval & Benchmark Dashboard`

SoriON AI의 프리셋은 Web 선택 항목, Browser/System/Melo 운율 프로필, CosyVoice 기준 WAV 파일명을 하나의 ID로 연결합니다. 성별 표시는 탐색용 메타데이터이지만, 이번 Hotfix부터 성별이나 인물 구분을 확인할 수 없는 음성을 조용히 대신 재생하지 않습니다.

## 기본 프리셋 5종

| ID | 표시 이름 | 분류 | 권장 용도 | 기본 속도 | 기본 높낮이 | 후보 순번 | CosyVoice WAV |
| --- | --- | --- | --- | ---: | ---: | ---: | --- |
| `sori-warm` | 혜린 | 여성 | 따뜻한 내레이션·안내 | 0.96 | 1.5 | 여성 1번 | `sori-warm.wav` |
| `on-clear` | 도윤 | 남성 | 또렷한 설명·교육 | 1.04 | -1.5 | 남성 1번 | `on-clear.wav` |
| `dam-calm` | 소리 | 중성 | 차분한 장문·명상 | 0.90 | -0.5 | 중성 1번 | `dam-calm.wav` |
| `jun-deep` | 준호 | 남성 | 저음 다큐·오디오북 | 0.92 | -2.5 | 남성 2번 | `jun-deep.wav` |
| `min-energetic` | 민준 | 남성 | 활력 광고·숏폼 | 1.08 | -0.5 | 남성 3번 | `min-energetic.wav` |

모바일 목소리 선택 Sheet는 전체·남성·여성·중성 필터를 제공하며, 필터 뒤에도 radio 선택과 방향키 이동 순서를 유지합니다.

## 필수 안전 계약

- 알 수 없는 ID를 첫 여성 프리셋으로 바꾸지 않습니다.
- 남성 프리셋을 여성 음성으로, 여성 프리셋을 남성 음성으로 자동 대체하지 않습니다.
- 중성 프리셋을 성별이 명시된 음성으로 자동 대체하지 않습니다.
- 도윤·준호·민준에 필요한 남성 후보가 부족하면 같은 목소리를 순환 재사용하지 않습니다.
- CosyVoice의 전용 WAV가 없으면 공통 기본 WAV 또는 다른 프리셋 WAV를 사용하지 않습니다.
- 전용 WAV가 있어도 동일 ID manifest의 동의·권리·사람 승인·SHA-256이 준비되지 않으면 사용하지 않습니다.
- 같은 실제 WAV checksum을 여러 인물 프리셋에 등록하면 관련 프리셋을 모두 차단합니다.
- 호환 후보 부족은 엔진 고장이 아니므로 circuit breaker 실패 횟수에 포함하지 않습니다.

## 엔진별 적용 방식

- Browser Speech와 System Voice는 기기에 설치된 한국어 음성의 이름·URI·성별 메타데이터를 사용합니다. 해당 프리셋에 필요한 별도 후보가 없으면 오류를 표시하고 다른 성별 또는 같은 후보로 대체하지 않습니다.
- eSpeak는 여성·남성 변형 번호와 운율을 분리하지만, 이는 실제 인물 음색이 아니라 합성 변형입니다.
- MeloTTS는 화자 이름 또는 성별 호환 화자 목록에서 프리셋별 별도 후보를 선택합니다. 단일 `KR` 화자를 여성·남성 프리셋에 공통 사용하지 않습니다.
- CosyVoice는 `voice-presets` 폴더에 같은 ID의 검증된 WAV가 있을 때만 해당 인물 프리셋을 사용합니다. 파일이 없거나 검사에 실패하면 다른 기준 음성으로 대체하지 않습니다.

세부 음성 선택 규칙은 [`VOICE_PRESET_FIDELITY.md`](VOICE_PRESET_FIDELITY.md), 증거 작성·검토 규칙은 [`VOICE_PRESET_EVIDENCE.md`](VOICE_PRESET_EVIDENCE.md)를 따릅니다.


## 실제 선택 화자 텔레메트리

Engine Doctor는 현재 실행 환경에서 Windows System.Speech와 MeloTTS가 각 프리셋에 선택하는 화자 이름, speaker ID, 판정 성별과 선택 근거를 표시한다. Melo 모델이 로딩되지 않았으면 실제 선택 완료로 표시하지 않고 대기 상태를 반환한다. 이 정보는 잘못된 반대 성별·중복 후보를 찾는 운영 진단이며 특정 실존 인물의 목소리 일치를 보증하지 않는다.

## 명시적 승인과 서명 상태

Quality Lab의 수동 승인 도구는 현재 파일을 기준으로 manifest v3 diff를 만들고 `현재 WAV 승인` 확인 뒤에만 적용합니다. 승인 뒤 WAV나 manifest가 달라지면 과거 preview를 사용할 수 없습니다. 서명 secret이 설정된 경우에만 HMAC-SHA256을 기록하며, Engine Doctor와 CosyVoice가 같은 key ID와 신뢰 secret으로 검증합니다. secret이 없는 기본 릴리스는 unsigned가 정상입니다.

## 실제 WAV 준비 조건

릴리스 ZIP에는 모델 가중치와 실제 화자 WAV를 포함하지 않습니다. 운영자가 준비하는 모든 프리셋 WAV는 다음 조건을 만족해야 합니다.

- 화자의 명시적 동의와 사용 범위 기록
- 재배포·상업 이용 등 필요한 권리 확인
- 1~30초 PCM WAV
- 16~48kHz, 모노 또는 스테레오
- 과도한 선행·후행 무음 없음
- 과도한 클리핑·무음 비율 없음
- 개인 정보나 제3자 저작물이 포함되지 않은 문장
- 표시 이름·선언 성별·실제 청취 결과의 운영자 확인

WAV 자체만으로 화자 신원이나 성별을 자동 판정하지 않습니다. 구체적인 파일 배치와 검사 기준은 `voice-presets/README.md`와 Engine Doctor 결과를 따릅니다.

## 운영 점검

1. 프로젝트 루트의 `voice-presets` 폴더에 필요한 WAV를 배치합니다.
2. 같은 ID의 `.manifest.json`에 실제 동의·권리·checksum·사람 검수 정보를 기록합니다.
3. `START_ENGINE.cmd` 또는 API 실행 환경에서 해당 폴더를 연결합니다.
4. Engine Doctor에서 WAV, manifest, 최종 사용 가능 상태와 중복 checksum을 각각 확인합니다.
5. Quality Lab에서 5개 프리셋의 동일 문장과 장문 첫 구간을 각각 시험하고 사람이 승인·거부를 기록합니다.
6. 인물별 결과가 실제로 다르고 표시 메타데이터와 맞는지 운영자가 청취 확인합니다.
7. 실제 화자·장치 증거가 없으면 특정 성별 음색, 품질, 지연 성능을 보증 문구로 사용하지 않습니다.

## 변경 계약

프리셋을 추가하거나 ID를 바꿀 때는 다음을 동시에 수정해야 합니다.

- `src/tts/voicePresets.ts`
- `voice-presets/{preset-id}.manifest.json`
- `services/api/app/services/voice_presets.py`
- Browser/System/Melo/CosyVoice 선택 로직
- Web/API/Worker 회귀 테스트
- `voice-presets/README.md`
- 이 문서와 `VOICE_PRESET_FIDELITY.md`

`scripts/check-voice-preset-contracts.mjs`가 현재 5개 ID와 남성 3종, 성별·중복 후보 차단, 공통 API 목록, 모바일 필터와 회귀 테스트 계약을 preflight에서 검사합니다.
