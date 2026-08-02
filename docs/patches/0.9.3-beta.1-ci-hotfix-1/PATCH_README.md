# SoriON AI 0.9.3-beta.1 CI Hotfix 1

기준 버전: `0.9.3-beta.1`
목표 상태: `0.9.3-beta.1 CI Hotfix 1 · Automatic Lock Bootstrap`

## 수정 목적

기존 workflow는 lock 파일이 없는 일반 push에서 `npm run locks:check`를 먼저 실행해 실패했다.
그 결과 lock을 생성할 수 있는 Actions 환경까지 도달하지 못했다.

이 패치는 다음 방식으로 deadlock을 제거한다.

1. 세 lock의 존재 여부를 먼저 판별한다.
2. 하나라도 없으면 CI가 실제 registry에서 자동 생성·감사한다.
3. 생성된 lock을 artifact로 같은 실행의 Web·API·Worker에 전달한다.
4. 세 lock이 모두 있으면 자동 재생성하지 않고 strict verify만 수행한다.
5. 의도적인 갱신은 수동 `generate_lockfiles=true`로 강제한다.

## 적용

1. 현재 저장소가 `0.9.3-beta.1`인지 확인한다.
2. 작업 중인 변경을 커밋하거나 백업한다.
3. 패치 ZIP을 저장소 루트에 압축 해제해 덮어쓴다.
4. `git status`로 변경 파일을 확인한다.
5. `git add -A`, commit, push한다.
6. Actions에서 lock 작업이 `generate` 모드로 진행되는지 확인한다.
7. 성공한 `sorion-verified-lockfiles` artifact의 세 lock을 저장소에 커밋한다.

삭제 파일은 없다.
