# SoriON AI 0.6.0 → 0.6.1 패치 안내

## 적용 대상

현재 저장소 루트의 `package.json` 버전이 정확히 `0.6.0`일 때 사용한다.

## 적용 방법

1. GitHub Desktop에서 현재 변경사항을 커밋하거나 백업한다.
2. `.git` 폴더는 유지한다.
3. 패치 ZIP을 저장소 루트에 압축 해제한다.
4. 모든 파일을 덮어쓴다.
5. 이번 패치의 삭제 파일은 없다.
6. `npm run quality:rules`를 실행한다.
7. 커밋·Push 후 Web quality, API quality, Pages 배포를 확인한다.

## 수정 목적

- Compact Brand Banner의 현재 문구와 Web 테스트 기대값 동기화
- 제목·Voice Core 마이크 회귀 표식 복원
- JSDOM Blob 환경 차이에 독립적인 Mock WAV 테스트 적용

## 권장 커밋

```text
fix: stabilize masthead and WAV web tests
```
