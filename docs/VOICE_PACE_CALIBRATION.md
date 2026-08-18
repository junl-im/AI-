# Voice Pace Calibration

릴리스: **0.11.24 R1**  
제품 semver: **0.11.24**

## 목적

기존 프리셋 중 일부는 UI가 `1.00×`여도 내부 multiplier 때문에 실제 합성 속도가 0.90~0.96 수준으로 내려가 한국어 일상 발화보다 지나치게 느리게 들릴 수 있었습니다. R1은 `1.00×`를 자연스러운 기본 발화 기준으로 다시 정의합니다.

## 보정표

| Voice | 이전 | R1 | 자연 속도 범위 |
| --- | ---: | ---: | ---: |
| 혜린 (`sori-warm`) | 0.96 | 1.00 | 0.95~1.15 |
| 도윤 (`on-clear`) | 1.04 | 1.04 | 0.95~1.20 |
| 소리 (`dam-calm`) | 0.90 | 0.98 | 0.95~1.15 |
| 준호 (`jun-deep`) | 0.92 | 0.98 | 0.95~1.12 |
| 민준 (`min-energetic`) | 1.08 | 1.08 | 1.00~1.20 |

## 계약

1. Browser Speech, System TTS, MeloTTS는 사용자 `speed × preset multiplier`를 사용하므로 프론트/API multiplier는 반드시 동일해야 합니다.
2. 차분함/저음은 지속적인 과감속보다 pitch, voice identity, 문장 호흡으로 표현합니다.
3. Voice 변경 시 `naturalSpeedRange` clamp가 사용자의 빠른 속도를 과도하게 되돌리지 않아야 합니다.
4. MY VOICE는 이 multiplier 표를 사용하지 않습니다. 실제 sample cadence와 clone engine 특성은 별도 runtime evidence로 판단합니다.
5. 실제 한국어 청취 평가가 확보되기 전까지 이 값은 product calibration이며 품질 benchmark로 표현하지 않습니다.

## 회귀 보호

- `src/tts/voicePresets.test.ts`: 프론트 pace 표와 차분/저음 자연 속도 범위 검증.
- `services/api/tests/test_voice_presets.py`: API pace 표 검증.
- `services/api/tests/test_melo_tts.py`: 합성 요청 speed에 0.98 calm multiplier가 적용되는지 검증.
- `scripts/check-voice-preset-contracts.mjs`: 프론트/API source의 pace calibration 동기화 검증.
