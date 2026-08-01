# SoriON AI 0.8.2 CI Hotfix

## 적용 대상

`SoriON AI 0.8.2` 전체본 또는 0.8.1→0.8.2 패치를 적용한 저장소입니다.

## 수정 내용

- `VoicePresetSelector.test.tsx`가 이전 프리셋 이름을 조회하던 문제 수정
- 현재 접근성 이름 `혜린 추천`, `도윤 또렷함` 기준으로 선택 테스트 갱신
- Python 3.10 비동기 취소 테스트의 임의 polling 루프 제거
- 동일 job ID에 다시 join해 백그라운드 완료를 결정적으로 검증
- API·Worker Ruff 버전을 `0.15.22`로 고정

## 검증 명령

```bash
npm run quality:rules
npm run lint
npm run typecheck
npm run test
npm run build
cd services/api && uv sync --dev --python 3.10
uv run --python 3.10 ruff check app tests --output-format=github
uv run --python 3.10 pytest tests -q
cd ../worker && uv sync --dev --python 3.10
uv run --python 3.10 ruff check app tests --output-format=github
uv run --python 3.10 pytest tests -q
```

## 삭제 대상

없습니다. 같은 경로의 파일을 덮어쓰면 됩니다.
