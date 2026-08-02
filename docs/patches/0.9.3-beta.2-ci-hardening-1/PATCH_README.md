# SoriON AI 0.9.3-beta.2 CI Hardening 1 Patch

기준: `0.9.3-beta.2`
목표: lock 생성 단일 장애점 제거와 CI failure-domain 분리

## 적용

1. 패치 ZIP을 기존 프로젝트 폴더에 덮어씁니다.
2. Windows는 `APPLY_PATCH.cmd`, macOS·Linux는 `APPLY_PATCH.sh`를 한 번 실행합니다.
3. GitHub Desktop에서 삭제 3개와 변경 파일 전체를 확인하고 Commit·Push합니다.
4. npm registry가 실패해도 preflight·API·Worker 결과가 독립적으로 표시되는지 확인합니다.
5. registry가 정상화되면 검증된 세 lock은 main 전용 작업이 자동 커밋합니다.

자동 커밋이 branch protection에 막혀도 품질 작업은 실패하지 않으며 component lock artifact가 남습니다.
