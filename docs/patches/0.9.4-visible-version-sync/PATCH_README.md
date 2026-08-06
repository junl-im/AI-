# SoriON AI 0.9.4 Visible Version Sync

기존 `0.9.3-beta.3 · Engine Heartbeat 6.8.4` 기준 프로젝트에 덮어쓰는 패치입니다.

## 적용

1. GitHub Desktop 저장소 루트에 패치 ZIP을 압축 해제합니다.
2. 파일 덮어쓰기를 허용합니다.
3. `node scripts/check-version-sync.mjs`를 실행합니다.
4. 첫 화면의 버전이 `v0.9.4`인지 확인합니다.
5. GitHub Desktop에서 Commit·Push 후 GitHub Actions와 배포를 확인합니다.

## 다음 버전

```bash
npm run version:set -- 0.9.5
npm run quality:version-sync
```

내부 Engine Heartbeat와 revision은 설정의 고급 빌드 정보에서만 확인합니다.
