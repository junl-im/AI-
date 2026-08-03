# Voice Presets

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.4 · Signed Audio Rehydration & Device Certification`

SoriON AI의 프리셋은 Web의 선택 항목, Browser/System/Melo 운율 프로필, CosyVoice 기준 WAV 파일명을 하나의 ID로 연결합니다. 성별 표시는 탐색용 메타데이터이며 실제 화자의 정체성이나 음질을 보증하지 않습니다.

## 기본 프리셋 5종

| ID | 표시 이름 | 분류 | 권장 용도 | 기본 속도 | 기본 높낮이 | CosyVoice WAV |
| --- | --- | --- | --- | ---: | ---: | --- |
| `sori-warm` | 혜린 | 여성 | 따뜻한 내레이션·안내 | 0.96 | 1.5 | `sori-warm.wav` |
| `on-clear` | 도윤 | 남성 | 또렷한 설명·교육 | 1.04 | -1.5 | `on-clear.wav` |
| `dam-calm` | 소리 | 중성 | 차분한 장문·명상 | 0.90 | -0.5 | `dam-calm.wav` |
| `jun-deep` | 준호 | 남성 | 저음 다큐·오디오북 | 0.92 | -2.5 | `jun-deep.wav` |
| `min-energetic` | 민준 | 남성 | 활력 광고·숏폼 | 1.08 | -0.5 | `min-energetic.wav` |

모바일 목소리 선택 Sheet는 전체·남성·여성·중성 필터를 제공하며, 필터 뒤에도 radio 선택과 방향키 이동 순서를 유지합니다.

## 엔진별 적용 방식

- Browser Speech와 System Voice는 기기에 설치된 한국어 음성 후보와 속도·높낮이 값을 조합합니다. 기기에 한국어 음성이 하나뿐이면 프리셋 차이는 주로 운율에 한정됩니다.
- MeloTTS는 같은 속도·높낮이 프로필을 사용합니다.
- CosyVoice는 `voice-presets` 폴더에 같은 ID의 검증된 WAV가 있을 때 해당 기준 음성을 사용합니다. 파일이 없거나 검사를 통과하지 못하면 준비되지 않은 상태로 표시하거나 안전한 기본 경로로 폴백합니다.

## 실제 WAV 준비 조건

릴리스 ZIP에는 모델 가중치와 실제 화자 WAV를 포함하지 않습니다. 운영자가 준비하는 모든 프리셋 WAV는 다음 조건을 만족해야 합니다.

- 화자의 명시적 동의와 사용 범위 기록
- 재배포·상업 이용 등 필요한 권리 확인
- 1~30초 PCM WAV
- 16~48kHz, 모노 또는 스테레오
- 과도한 선행·후행 무음 없음
- 과도한 클리핑·무음 비율 없음
- 개인 정보나 제3자 저작물이 포함되지 않은 문장

구체적인 파일 배치와 검사 기준은 `voice-presets/README.md`와 Engine Doctor 결과를 따릅니다.

## 운영 점검

1. 프로젝트 루트의 `voice-presets` 폴더에 필요한 WAV를 배치합니다.
2. `START_ENGINE.cmd` 또는 API 실행 환경에서 해당 폴더를 연결합니다.
3. Engine Doctor에서 `5/5` 준비 상태와 각 파일의 차단 사유를 확인합니다.
4. 실제 모델·GPU 환경에서 짧은 문장과 장문 첫 구간을 각각 시험합니다.
5. 실제 화자·장치 증거가 없으면 특정 성별 음색, 품질, 지연 성능을 보증 문구로 사용하지 않습니다.

## 변경 계약

프리셋을 추가하거나 ID를 바꿀 때는 다음을 동시에 수정해야 합니다.

- `src/tts/voicePresets.ts`
- `services/api/app/services/voice_presets.py`
- Web/API/Worker 회귀 테스트
- `voice-presets/README.md`
- 이 문서

`scripts/check-voice-preset-contracts.mjs`가 현재 5개 ID와 남성 3종, 공통 API 목록, 모바일 필터와 테스트 계약을 preflight에서 검사합니다.
