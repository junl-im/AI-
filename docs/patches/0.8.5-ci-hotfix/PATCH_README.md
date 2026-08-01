# SoriON AI 0.8.5 CI Hotfix

## 적용 기준

- `package.json` 버전이 `0.8.5`인 저장소에 적용합니다.
- 0.8.4→0.8.5 패치를 누적 적용해 예전 연결 UI 파일이 남은 저장소도 지원합니다.

## 적용 방법

1. 저장소 루트에 패치 ZIP을 압축 해제해 덮어씁니다.
2. `DELETE_LIST.txt`의 네 파일을 삭제합니다. 패치에 포함된 stub 상태로도 CI는 통과하지만 삭제가 최종 상태입니다.
3. `npm run lint`, `npm run typecheck`, API Ruff와 pytest를 실행합니다.
4. GitHub Actions에서 Web·API·Worker가 모두 녹색인지 확인합니다.

## 수정 내용

- Ruff UP035: `Awaitable`, `Callable`을 `collections.abc`에서 import
- React Hook: 프로젝트 복원 함수의 안정적인 참조를 Effect 의존성으로 사용
- 오래된 수동 연결 UI 파일 제거
