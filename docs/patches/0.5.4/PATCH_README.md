# SoriON AI 0.5.3 → 0.5.4 패치

## 적용 조건

- 현재 `package.json` 버전: `0.5.3`
- 적용 후 버전: `0.5.4`
- 기존 `.git` 폴더는 유지

## 적용 방법

1. GitHub Desktop에서 현재 변경사항을 커밋하거나 백업합니다.
2. 이 패치 ZIP의 내용을 저장소 루트에 압축 해제합니다.
3. 모든 파일을 덮어씁니다.
4. 삭제 대상 파일은 없습니다.
5. `npm run quality:rules`를 실행합니다.
6. `fix: pin setup-uv action to verified commit`으로 커밋하고 Push합니다.

## 핵심 확인

`.github/workflows/ci.yml`의 setup-uv 단계가 아래와 같아야 합니다.

```yaml
uses: astral-sh/setup-uv@08807647e7069bb48b6ef5acd8ec9567f424441b # v8.1.0
with:
  version: '0.11.32'
```

Push 후 API quality Job에서 `Set up uv`가 통과하고 Ruff·pytest까지 실행되는지 확인합니다.
