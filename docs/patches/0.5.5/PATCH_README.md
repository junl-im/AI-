# SoriON AI 0.5.4 → 0.5.5 패치

## 적용 조건

- 현재 `package.json` 버전: `0.5.4`
- 적용 후 버전: `0.5.5`
- 기존 `.git` 폴더 유지

## 적용 방법

1. GitHub Desktop에서 현재 변경사항을 커밋하거나 백업합니다.
2. 패치 ZIP을 저장소 최상위 폴더에 압축 해제합니다.
3. 같은 이름의 파일을 모두 덮어씁니다.
4. 이번 패치에는 삭제 파일이 없습니다.
5. 아래 검사를 실행합니다.

```bash
npm run quality:rules
cd services/api
uv sync --dev --python 3.10
uv run --python 3.10 ruff check app tests --output-format=github
uv run --python 3.10 pytest tests -q
```

## 핵심 확인

- Ruff E501과 I001 오류가 0건인지 확인합니다.
- `/api/v1/engines/strategy` 응답에서 `cosyvoice3`가 주력 엔진인지 확인합니다.
- 공개 사이트 상단에 `BUILD v0.5.5`가 표시되는지 확인합니다.

## 권장 커밋

```text
fix: pass API lint and define engine strategy
```
