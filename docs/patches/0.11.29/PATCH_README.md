# 0.11.29 · Certification Intake & Release Readiness Patch

Base: `0.11.28 · Voice Naturalness & Preview Quality`
Target: `0.11.29 · Certification Intake & Release Readiness`

## 적용 순서

GitHub main이 아직 `0.11.27 R2`라면 먼저 0.11.28 PATCH를 적용·검증한 뒤 이 PATCH를 저장소 루트에 덮어씁니다. 이 PATCH를 0.11.27 계열에 직접 적용하지 않습니다.

## 핵심 변경

- Quality Lab에 Release Readiness 카드 추가
- Web quality / Kakao Android / Kakao iOS / Chromium desktop / Chromium mobile / MY VOICE 6개 evidence 슬롯
- READY / PENDING / BLOCKED 독립 판정과 Overall CERTIFIED gate
- Web quality report 내부 `reportSha256` / `evidenceSha256` 재계산
- Chromium 9/9 capture + SHA-256 + `realWorkerClaimed=false` 검증
- MY VOICE observed-runtime / consent / Worker/model / completed playback 검증
- raw profile/sample data 없는 `release-readiness/1` checksum summary
- 동일 계약의 CLI verifier와 preflight contract 추가

## 주의

- 실제 Kakao Android/iOS 또는 실제 MY VOICE evidence가 없으면 Overall은 의도적으로 PENDING입니다.
- synthetic Chromium recovery fixture는 실제 MY VOICE 성공으로 간주하지 않습니다.
- 0.11.29 dependency 기반 Web lint/Vitest/typecheck/build/Chromium은 Push 후 GitHub Actions가 최종 gate입니다.
