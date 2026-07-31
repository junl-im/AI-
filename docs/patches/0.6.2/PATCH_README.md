# SoriON AI 0.6.1 → 0.6.2 패치 안내

## 적용 조건

현재 저장소 루트의 `package.json` 버전이 정확히 `0.6.1`일 때 사용합니다.

## 적용 방법

1. GitHub Desktop에서 현재 변경사항을 커밋하거나 백업합니다.
2. `.git` 폴더는 그대로 유지합니다.
3. 패치 ZIP을 저장소 루트에 압축 해제합니다.
4. 모든 파일을 덮어씁니다.
5. 이번 패치에는 삭제 파일이 없습니다.
6. `npm run quality:rules`를 실행합니다.
7. `cd services/api && python -m pytest tests -q`를 실행합니다.
8. `npm run dev:api`로 API를 실행합니다.
9. 설정에서 `전체 연결 검사`를 실행합니다.

## 반드시 확인할 항목

- 공개 GitHub Pages에서 `API 미설정`이 명확히 표시되는지
- 같은 PC에서 `http://127.0.0.1:8000` 연결이 되는지
- `/api/v1/connectivity`가 TTS·CORS·저장소·Worker 상태를 반환하는지
- Setup에서 Python 3.10이 지원 상태인지
- CosyVoice Worker가 꺼져 있으면 준비 완료로 표시되지 않는지
- 실제 API 음원이 Dock에서 재생되는지

## 권장 Git

```text
브랜치: fix/engine-connectivity
커밋: fix: repair API and engine connectivity
```
