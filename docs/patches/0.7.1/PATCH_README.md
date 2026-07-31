# SoriON AI 0.7.0 → 0.7.1 Patch

1. 현재 `package.json` 버전이 `0.7.0`인지 확인한다.
2. `.git` 폴더를 유지한다.
3. `SoriON-AI-0.7.0-to-0.7.1-patch.zip`을 저장소 루트에 푼다.
4. 같은 이름의 파일을 모두 덮어쓴다.
5. 삭제 대상은 없다.
6. API와 Worker Secret은 파일에 쓰지 말고 배포 환경 Secret으로 설정한다.
7. `npm run quality:rules`, API pytest, Worker pytest를 실행한다.
