# SoriON AI 0.11.34 -> 0.11.35 Patch

기존 `0.11.34 · Natural Voice Engine & Field Playback Gate` 프로젝트 루트에 덮어씁니다.
삭제 대상 파일은 없습니다.

검증 권장:
- `npm run quality:preflight`
- `python -m pytest services/api/tests -q`
- `python -m pytest services/worker/tests -q`

실제 rights-cleared 성우 reference WAV가 없으면 Neural 5/5 READY를 주장하지 않습니다.
