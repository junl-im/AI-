# Quality Gate Compatibility

SoriON AI 0.9.8은 기능 변경보다 GitHub Actions 품질 게이트 호환성 복구를 우선합니다.

## Python

- `Iterator`, `Mapping` 같은 protocol type은 `typing`이 아니라 `collections.abc`에서 가져옵니다.
- `from __future__ import annotations`가 있으므로 클래스 반환 annotation에 문자열 따옴표를 사용하지 않습니다.
- `except` 안에서 새 예외로 변환할 때는 `raise ... from error`로 원래 원인을 보존합니다.
- import block은 Ruff isort 순서를 따릅니다.

## Web

- `DubbingVoiceControls`는 엔진 capability를 판단하기 위해 `engine: EngineInfo | null`을 반드시 받습니다.
- 실제 앱에서는 `engineCatalog.selected`를 전달합니다.
- 테스트에서 의도적으로 일부 필드만 만든 fixture를 강제 변환할 때는 `unknown`을 경유합니다.

## 확인

```bash
npm run quality:compatibility
npm run quality:preflight
```

전체 Ruff·ESLint·TypeScript·Vitest·Vite build는 GitHub Actions가 최종 판정합니다.
