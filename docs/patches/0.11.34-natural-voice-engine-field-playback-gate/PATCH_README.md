# SoriON AI 0.11.33 R1 -> 0.11.34 Patch

- 기준: `0.11.33 R1 · Baseline Integrity Repair`
- 결과: `0.11.34 · Natural Voice Engine & Field Playback Gate`
- 적용: 저장소 루트에 ZIP 내용을 덮어씁니다.
- 삭제 파일: 없음.

## 핵심 변경

1. 5성우 속도를 현실적인 좁은 범위로 재보정하고 softness/articulation/pause identity를 추가합니다.
2. Browser/Melo/System이 같은 natural speed clamp를 사용합니다.
3. CosyVoice는 FFmpeg가 있을 때 pitch 보존 `atempo`로 실제 WAV tempo를 적용합니다.
4. Release Readiness에 5성우 PC/mobile `playing -> ended` Neural runtime 증거를 필수 7번째 슬롯으로 추가합니다.
5. 실제 rights-cleared reference/model이 없으면 Neural READY를 주장하지 않습니다.

## 검증

- Repository preflight: 55/55 PASS
- Live Voice / MY VOICE: 51/51 PASS
- API pytest: 238/238 PASS
- Worker pytest: 16/16 PASS
- Web dependency install: local 120s timeout; GitHub Actions final gate
