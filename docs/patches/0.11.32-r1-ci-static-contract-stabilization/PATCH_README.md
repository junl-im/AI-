# 0.11.32 R1 · CI Static Contract Stabilization PATCH

## Base / target

- Base: `0.11.32 · Neural Voice Runtime Certification & Shared Preview Cache`
- Target: `0.11.32 R1 · CI Static Contract Stabilization`
- Product semver: `0.11.32` 유지

이 PATCH는 GitHub `main`의 0.11.32 위에 저장소 루트 기준으로 직접 덮어씁니다.

## Changes

- API Ruff UP012: `text.encode("utf-8")` → `text.encode()`
- Browser Speech stale assertion: 준호 `-1.2 semitone`의 실제 pitch `0.9330329915368074`를 새 안전 범위 `0.92~1.08`에 맞춰 `0.92 < pitch < 0.95`로 검증
- production neural cache/voice/Kakao/MY VOICE 로직은 변경하지 않음

## Validation

- Repository preflight: 55/55 PASS
- Targeted neural preview API: 4/4 PASS
- API full pytest: 232/232 PASS
- Worker pytest: 14/14 PASS
- Python compileall: PASS
- All TS/TSX dependency-free syntax: 261/261 PASS
- Local Ruff/Vitest executables: unavailable; GitHub Actions final gate

## Delete list

삭제 파일 없음. `DELETE_LIST.txt` 참고.
