# SoriON AI 0.5.6 → 0.5.7 패치

## 적용 조건

- 기준 버전: `0.5.6`
- 적용 후 버전: `0.5.7`
- 저장소의 `.git` 폴더는 유지한다.

## 적용 방법

1. GitHub Desktop에서 현재 변경사항을 커밋하거나 백업한다.
2. 패치 ZIP을 저장소 최상위에 압축 해제한다.
3. 모든 파일을 덮어쓴다.
4. 이번 패치에는 삭제 파일이 없다.
5. 아래 검사를 실행한다.

```bash
npm run quality:rules
cd services/api
uv sync --dev --python 3.10
uv run --python 3.10 ruff check app tests --output-format=github
uv run --python 3.10 pytest tests -q
```

## 확인 기준

- Ruff 오류 0건
- pytest 34개 이상 통과
- `test_job_manager_times_out` 통과
- 공개 사이트 상단에 `BUILD v0.5.7` 표시

## 권장 커밋

```text
fix: handle Python 3.10 asyncio timeout
```
