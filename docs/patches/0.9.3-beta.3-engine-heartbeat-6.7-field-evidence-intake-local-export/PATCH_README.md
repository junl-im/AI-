# Engine Heartbeat 6.7 Field Evidence Intake & Local Export Bundle

기준본: `0.9.3-beta.3 · Engine Heartbeat 6.6 · Field Evidence & Reproducible Web Quality`
결과본: `0.9.3-beta.3 · Engine Heartbeat 6.7 · Field Evidence Intake & Local Export Bundle`

field evidence v2와 Web quality run report의 preview·checksum 재검증·중복 차단, 가져오기 이력, 브라우저 로컬 음원·자막·JSON ZIP과 npm lock preflight gate를 추가하는 덮어쓰기 패치입니다. 제품 버전 `0.9.3-beta.3`은 변경하지 않습니다.

이 패치는 저장소의 기존 `package-lock.json`을 덮어쓰거나 삭제하지 않습니다. 검증 lock이 있는 Heartbeat 6.6 저장소 루트에 ZIP을 덮어쓴 뒤 `APPLY_PATCH.cmd` 또는 `./APPLY_PATCH.sh`를 실행하고 Commit·Push합니다.
