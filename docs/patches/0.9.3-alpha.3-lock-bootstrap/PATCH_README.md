# SoriON AI 0.9.3-alpha.3 Lock Bootstrap Patch

기준 버전: `0.9.3-alpha.2`
목표 버전: `0.9.3-alpha.3 Reproducible CI Lock Evidence Gate`

## 적용

1. 현재 저장소가 `0.9.3-alpha.2`인지 확인한다.
2. `.git`과 사용자 데이터는 유지한 채 패치 ZIP을 저장소 루트에 덮어쓴다.
3. 변경 내용을 기능 브랜치에 커밋하고 GitHub에 push한다.
4. Actions의 `SoriON CI & Pages`를 수동 실행한다.
5. `generate_lockfiles=true`를 선택한다.
6. 성공한 실행의 `sorion-verified-lockfiles` artifact를 내려받는다.
7. `package-lock.json`, `services/api/uv.lock`, `services/worker/uv.lock`을 같은 경로에 복사한다.
8. `.sorion/lock-audit`의 npm warning과 전체 dependency tree 결과를 확인한다.
9. 세 lock을 커밋하고 다시 push해 일반 CI를 통과시킨다.

lock을 커밋하기 전 일반 push·PR이 `Lockfiles · generate or verify`에서 실패하는 것은 의도된
차단이다. 임의의 lock 파일을 만들거나 다른 Node·npm·Python 버전에서 생성하지 않는다.
