# SoriON AI 0.11.34 · Natural Voice Engine & Field Playback Gate

## 목표

0.11.34는 성우별 차이를 과도한 배속으로 만드는 대신, 실제 사람이 듣기에 부드러운 속도 범위 안에서 음색·호흡·명료도·문장 종결의 차이를 유지한다. Neural preset은 실제 PC/mobile 재생 완료 evidence 없이는 출시 인증 READY가 될 수 없다.

## 5인 성우 자연 속도 정책

| Preset | 성우 | 기본 페이스 | 자연 속도 범위 | 핵심 차별점 |
| --- | --- | ---: | ---: | --- |
| sori-warm | 혜린 | 1.02× | 0.96–1.08× | 높은 부드러움, 짧고 자연스러운 연결, 친근한 종결 |
| on-clear | 도윤 | 1.04× | 0.98–1.10× | 높은 명료도, 숫자/설명 자음 전달, 깨끗한 쉼 |
| dam-calm | 소리 | 0.99× | 0.94–1.05× | 가장 부드러운 장문 호흡, 낮은 피로도, 균형 쉼 |
| jun-deep | 준호 | 1.00× | 0.95–1.06× | 저음 안정감, 단단한 종결, 무게감 있는 중간 호흡 |
| min-energetic | 민준 | 1.07× | 1.00–1.13× | 경쾌함과 명료도, 짧은 쉼, CTA 에너지 |

기존 +6~14% 가속 중심 정책은 폐기한다. 모든 backend는 프리셋별 natural range를 넘지 않도록 clamp한다.

## Neural / CosyVoice

- 전용 rights-cleared reference WAV 및 evidence manifest 원칙은 그대로 유지한다.
- Cross-lingual inference 결과에 안정적인 speed parameter가 없는 런타임을 위해 API handoff 후 FFmpeg `atempo`를 사용한다.
- `atempo`는 pitch를 보존하면서 tempo만 조절한다.
- FFmpeg가 없으면 reference cadence를 유지하며, 엔진은 speed 지원을 READY로 주장하지 않는다.
- 반대 성별 또는 다른 성우 reference로 자동 대체하지 않는다.

## Browser / Melo / System TTS

- Browser Speech도 `request speed × preset base pace`를 계산한 뒤 natural range로 clamp한다.
- MeloTTS와 Windows/macOS/eSpeak도 backend 공통 `effective_rate()`를 사용한다.
- pitch 변조는 기존 안전 범위를 유지하며, 프리셋의 개성은 속도보다 reference / cadence / pitch / articulation 차이에 더 크게 의존한다.

## Release Readiness 0.11.34

기존 6개 evidence에 `neural-runtime`을 추가해 총 7개 필수 슬롯으로 확장한다.

Neural runtime READY 조건:

1. 5개 preset 모두 실제 observed-runtime record가 존재한다.
2. 각 preset이 desktop-browser와 mobile-browser에서 `playbackStartedAt`과 `playbackCompletedAt`을 가진다.
3. PC/mobile의 cacheId, audio SHA-256, model fingerprint, reference fingerprint가 모두 동일하다.
4. synthetic fixture는 인증에 사용할 수 없다.

즉 API 200, WAV 생성 완료, cache hit만으로는 Neural release READY가 아니다. 실제 `playing → ended` 완료가 필요하다.

## 제한

실제 rights-cleared 5성우 reference WAV/model이 저장소에 없다면 5/5 Neural READY를 표시하지 않는다. 이 문서는 엔진과 인증 계약을 강화하지만 실제 성우 자산을 위조하거나 대체하지 않는다.
