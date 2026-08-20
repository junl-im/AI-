# 0.11.32 R1 · CI Static Contract Stabilization

## Incident

GitHub `main` head `f0a2a0d6e081a3e02be6abc80bb31eec297a488b`의 0.11.32 Actions annotations에서 다음 concrete failures가 보고되었습니다.

1. API Ruff `UP012`: `neural_preview_cache.py`에서 `text.encode("utf-8")`의 UTF-8 인자가 불필요합니다.
2. Web Vitest: 준호 기본 Browser Speech pitch `0.9330329915368074`가 이전 테스트의 `> 0.94` 조건을 만족하지 않습니다.

## Root cause

- Python `str.encode()`의 기본 encoding은 UTF-8이므로 explicit argument는 digest 결과에 필요하지 않습니다.
- 0.11.31 voice-character overhaul에서 준호 preset pitch는 `-1.2 semitone`로 의도적으로 설정됐고 Browser Speech의 실제 ratio는 `2 ** (-1.2 / 12) = 0.9330329915368074`입니다. 이는 새 production clamp `0.92~1.08` 안의 정상값입니다. 테스트 assertion만 이전 tuning 기준을 유지했습니다.

## Fix

- `text.encode("utf-8")` → `text.encode()`
- 준호 pitch test → `0.92 < webSpeechPitch < 0.95`

Production neural cache digest, Browser Speech pitch 계산식, preset 값은 변경하지 않습니다.

## Validation

- Repository preflight: 55/55 PASS
- Targeted neural preview API tests: 4/4 PASS
- API full pytest: 232/232 PASS
- Worker pytest: 14/14 PASS
- Python compileall: PASS
- Deep pitch numeric contract: 0.9330329915368074 PASS
- Local Ruff/Vitest executables: not installed; GitHub Actions remains the final gate.
