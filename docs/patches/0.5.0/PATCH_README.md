# 0.4.0 → 0.5.0 패치

1. 적용 전 현재 `package.json` 버전이 `0.4.0`인지 확인한다.
2. 변경 작업을 커밋하거나 별도 백업한다.
3. `.git` 폴더를 유지한 채 패치 ZIP의 내용을 저장소 루트에 덮어쓴다.
4. 이번 패치에서 삭제할 파일은 없다.
5. `npm install`, `npm run quality`, GitHub Actions를 확인한다.

주요 변화는 Voice API 연결 마법사, 실제 작업 진행률, 품질 평가 IndexedDB 저장과 JSON·CSV 내보내기다.
