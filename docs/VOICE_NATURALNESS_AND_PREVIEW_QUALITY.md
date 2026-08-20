# Voice Naturalness & Preview Quality

릴리스: **0.11.28**

## 문제

Browser Speech는 운영체제/브라우저의 한국어 시스템 음성을 사용합니다. 기존에는 preset의 pitch offset과 사용자 높낮이를 거의 그대로 Web Speech `utterance.pitch`에 더해 혜린처럼 원래 얇은 시스템 음성에서 금속성·전자음이 두드러질 수 있었습니다.

## 보정

| Voice | 이전 preset pitch | 0.11.28 | 기본 의도 |
| --- | ---: | ---: | --- |
| 혜린 | +1.5 | +0.5 | 따뜻함은 voice identity로, 피치 상승은 최소화 |
| 도윤 | -1.5 | -0.5 | 또렷함을 과저음으로 만들지 않음 |
| 소리 | -0.5 | 0 | 중성 시스템 음성의 원형 보존 |
| 준호 | -2.5 | -1.0 | 저음 캐릭터는 유지하되 변조량 축소 |
| 민준 | -0.5 | +0.25 | 젊고 활기찬 인상을 약한 상승으로 표현 |

Browser Speech에서는 사용자 pitch를 `0.4x`로 완화해 preset offset과 합산하고, 12음 평균율 비율로 변환한 뒤 최종 Web Speech pitch를 `0.90~1.12`로 clamp합니다. 속도 보정은 0.11.24 R1 값을 유지합니다.

## 품질 경계

1. Browser Speech/System TTS는 **기기 음성 근사값**입니다. 동일 프리셋이라도 OS와 설치 음성에 따라 결과가 달라질 수 있습니다.
2. 실제 SoriON 성우 품질은 동의·권리·검수·SHA-256이 준비된 전용 reference WAV 또는 검증된 neural multi-speaker 모델에서만 보장 후보가 됩니다.
3. Browser Speech가 동작한다고 neural 성우 품질이 인증된 것으로 표시하지 않습니다.
4. 카카오 WebView에서 Speech Synthesis 자체가 차단되면 앱은 시작 상태를 1.8초 안에 해제하고 외부 브라우저 복구를 안내합니다. WebView 엔진 정책 자체를 앱이 강제할 수는 없습니다.
5. PC와 모바일은 같은 naturalized pitch 계산을 사용하므로 같은 preset/request 설정의 effective rate/pitch 계약은 동일합니다.

## 회귀 보호

- `src/tts/voicePresets.test.ts`: 5개 preset pitch 표와 자연 범위를 고정합니다.
- `src/tts/browserSpeech.test.ts`: 혜린 중립 근접, 준호 저음 근접, 극단 사용자 pitch clamp를 검증합니다.
- `services/api/tests/test_voice_presets.py`: frontend/API preset pitch parity를 고정합니다.
- `scripts/check-voice-preset-contracts.mjs`: pitch 표와 Browser Speech naturalization 상수를 dependency-free preflight에서 검사합니다.
