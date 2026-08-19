# NEXT UPDATE

Current baseline: `0.11.27 R2 · Recovery Scene Selection Stabilization`

## 선행 gate

- GitHub Actions에서 R2 desktop/mobile multi-scene recovery scene이 모두 통과하고 Web quality final gate와 Pages 경로가 green이어야 새 음성 품질 기능을 시작합니다.
- 실패가 남아 있으면 기능 추가보다 해당 CI 실패를 우선 안정화합니다.

## 목표 버전

`0.11.28 · Voice Naturalness & Preview Quality`

### 핵심 기능

1. 혜린을 우선 대상으로 Browser Speech preview의 과도한 pitch 변조를 줄여 얇고 금속성/전자음처럼 들리는 현상을 완화합니다. 현재 `1.00×` 자연 속도 보정은 유지하고 pitch와 음색 역할을 분리합니다.
2. 5개 SoriON preset의 browser fallback pitch/rate 범위를 다시 청취 가능한 안전 범위로 정리하고, 프리셋 캐릭터 차이는 pitch 과변조보다 실제 neural voice/reference를 우선하도록 계약을 명확히 합니다.
3. Browser Speech는 `빠른 로컬 fallback/미리듣기`로, 실제 고품질 성우 결과는 CosyVoice 등 neural TTS WAV/reference path로 구분해 UI와 evidence에서 동일 음질처럼 오인되지 않게 합니다.
4. 전용 reference WAV/동의/사람 검수가 준비된 preset만 neural preview 승격을 허용하고, 준비되지 않은 경우 synthetic/시스템 음성을 실제 성우 품질로 표시하지 않습니다.
5. PC/모바일 Voice Drawer/Picker에서 같은 문장·같은 preset의 preview source와 effective rate/pitch를 privacy-safe evidence로 비교할 수 있는 regression/diagnostic 계약을 추가합니다.

### 예상 변경 영역

- `src/tts/voicePresets.ts`, `src/tts/browserSpeech.ts` 및 관련 테스트
- `services/api/app/services/voice_presets.py`와 preset parity 테스트
- Voice preview source/diagnostic UI 및 Quality Lab evidence
- `docs/VOICE_PRESETS.md`, 새 Voice Naturalness 설계 문서, HANDOVER/CHANGELOG

### 선행 조건과 위험

- 0.11.27 R2의 multi-scene CI가 실제 green이어야 합니다.
- 실제 neural reference WAV가 없는 preset은 Browser Speech 음질 한계를 완전히 제거할 수 없으며, pitch 보정만으로 실제 AI 성우 품질을 가장하지 않습니다.
- 혜린의 전자음 개선을 위해 pitch를 낮추더라도 사용자 설정 `높낮이`와 preset 기본값의 의미가 뒤섞이지 않도록 frontend/API 계약을 함께 조정해야 합니다.
- MY VOICE clone cadence는 built-in preset 보정과 별도이며 이번 목표에서 무리하게 함께 조정하지 않습니다.

## 후속 보류 항목

이전에 계획한 `Certification Intake & Release Readiness`는 Voice Naturalness 패치 뒤로 순서를 조정합니다. 기존 field-device/Chromium/MY VOICE certification schema와 verifier는 그대로 유지하며 evidence가 없으면 pending입니다.
