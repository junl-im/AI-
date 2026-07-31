# SoriON AI 0.5.2 → 0.5.3 패치

## 기준

- 적용 전 `package.json` 버전: `0.5.2`
- 적용 후 버전: `0.5.3`

## 적용

1. GitHub Desktop에서 현재 변경을 커밋하거나 백업한다.
2. `.git` 폴더는 유지한다.
3. 패치 ZIP의 파일을 저장소 루트에 덮어쓴다.
4. 이번 패치에는 삭제 대상 파일이 없다.
5. GitHub Desktop에서 `PATCH_MANIFEST.txt`와 변경 파일을 비교한다.
6. `npm run quality:rules`를 실행한다.
7. 커밋·Push 후 `SoriON CI & Pages`에서 Web·API·Deploy 결과를 확인한다.

## 핵심 확인

- `mockWave.test.ts`의 Blob 오류가 사라지는지
- `HomePage.test.tsx`의 `읽을 문장` 중복 오류가 사라지는지
- API Ruff와 pytest가 Python 3.10에서 통과하는지
- checkout·setup-node·setup-uv의 Node.js 20 경고가 사라지는지

## 권장 커밋

```text
fix: stabilize Web and API quality tests
```
