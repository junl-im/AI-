# 0.11.32 R2 · CI Static Contract Completion

## Incident

R1 Push 뒤 CI는 두 개의 concrete failure를 더 노출했습니다. API Ruff 0.15.22는 `neural_preview_cache.py`의 `cache_id` f-string에 남아 있던 explicit UTF-8 encoding을 UP012로 거부했고, Web full Vitest는 `dam-calm`의 natural speed upper bound를 예전 `1.15`로 기대해 실제 `1.16`과 불일치했습니다.

## Root cause

R1은 첫 번째 UP012 annotation만 따라 `text_digest()`를 교정했지만 같은 파일에 명시적 UTF-8 encode가 더 남아 있었습니다. Web 쪽은 0.11.31 Voice Character Overhaul에서 소리의 `naturalSpeedRange`가 `[1.00, 1.16]`으로 상향된 뒤 `voiceRecommendation.test.ts` 한 줄만 이전 상한을 유지했습니다.

## Fix

- `neural_preview_cache.py`의 text/style/cache digest 문자열은 모두 기본 `str.encode()`를 사용합니다. Python 기본 encoding은 UTF-8이므로 digest bytes와 cache identity 의미는 동일합니다.
- `voiceRecommendation.test.ts`는 `dam-calm`의 실제 upper bound `1.16`을 기대합니다.
- neural runtime preflight는 해당 파일에 `.encode("utf-8")`가 남으면 실패합니다.
- studio voice preflight는 recommendation test가 `speed: 1.16` 계약을 유지하는지 확인합니다.

## Validation

- Repository preflight: 55/55 PASS
- API pytest: 232/232 PASS
- Worker pytest: 14/14 PASS
- Python compileall: PASS
- TS/TSX dependency-free syntax: 261/261 PASS
- `dam-calm` runtime clamp smoke: `{ speed: 1.16, pitch: 1 }` PASS
- explicit `.encode("utf-8")` in `neural_preview_cache.py`: 0

## Boundary

실제 Ruff/Vitest executables는 로컬에 없고 네트워크도 차단되어 동일 CI binary 재실행은 불가했습니다. R2는 production voice/neural runtime 정책을 변경하지 않으며 GitHub Actions가 최종 gate입니다.
