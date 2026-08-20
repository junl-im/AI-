# 0.11.32 R2 · CI Static Contract Completion PATCH

## Base / target

- Base: `0.11.32 R1 · CI Static Contract Stabilization`
- Target: `0.11.32 R2 · CI Static Contract Completion`
- Product semver: `0.11.32` 유지
- GitHub base head observed before patch: `f9d2e8d86f516f6e8aac0141c452830653c2e19b`

이 PATCH는 **0.11.32 R1** 저장소 루트에 직접 덮어씁니다. plain 0.11.32 또는 0.11.31에는 직접 적용하지 않습니다.

## Changes

- `neural_preview_cache.py`의 remaining explicit UTF-8 `encode`를 기본 `str.encode()`로 통일해 Ruff UP012 연쇄 실패를 차단합니다.
- `dam-calm` natural speed upper bound `1.16`과 `voiceRecommendation.test.ts`의 stale `1.15` 기대값을 동기화합니다.
- preflight가 neural cache explicit UTF-8 encode 재유입과 소리 `1.16` clamp 계약을 직접 검사합니다.
- runtime neural cache identity, 5개 성우 production pace/cadence/pitch, Kakao/MY VOICE/Timeline 동작은 변경하지 않습니다.
- HANDOVER 1200줄 안전 상한 유지를 위해 v0.11.4~0.11.9 상세 이력을 archive로 이동하며 기록은 삭제하지 않습니다.

## Validation

- Repository preflight: 55/55 PASS
- API full pytest: 232/232 PASS
- Worker pytest: 14/14 PASS
- Python compileall: PASS
- All TS/TSX dependency-free syntax: 261/261 PASS
- `dam-calm` clamp runtime smoke: `{ speed: 1.16, pitch: 1 }` PASS
- `neural_preview_cache.py` explicit `.encode("utf-8")`: 0
- Actual Ruff 0.15.22/Vitest: local Python 3.10/Ruff package and Web `node_modules` unavailable; network blocked; GitHub Actions final gate

## Delete list

삭제 파일 없음. `DELETE_LIST.txt` 참고.
