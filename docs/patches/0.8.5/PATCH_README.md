# SoriON AI 0.8.4 → 0.8.5 패치

## 목적

화면 간 이동을 하나의 연속된 음성 제작 작업공간으로 통합하고, Web이 특정 엔진을 직접
선택하지 않아도 FastAPI가 준비 상태·운영 우선순위·실패 이력을 기준으로 실행 엔진을 자동
선택하고 전환하도록 강화한다.

## 적용 조건

현재 저장소의 `package.json` 버전이 정확히 `0.8.4`일 때만 적용한다. 작업 중 변경사항을
먼저 커밋하거나 백업하고 `.git` 폴더는 유지한다.

## 적용 방법

1. 패치 ZIP을 저장소 최상위에 압축 해제해 같은 경로의 파일을 덮어쓴다.
2. 이번 패치의 삭제 대상은 없다.
3. `.env.example`의 엔진 순서·실패 임계치·cooldown 값을 운영 환경에 맞게 검토한다.
4. `package.json` 버전이 `0.8.5`인지 확인한다.
5. 아래 품질 검사를 실행하고 GitHub Actions가 모두 성공한 뒤 병합한다.

```bash
npm run quality:rules
npm run lint
npm run typecheck
npm run test:ci
npm run build
cd services/api
uv sync --dev --python 3.10
uv run --python 3.10 ruff check app tests --output-format=github
uv run --python 3.10 pytest tests -q
cd ../worker
uv sync --dev --python 3.10
uv run --python 3.10 ruff check app tests --output-format=github
uv run --python 3.10 pytest tests -q
```

## 핵심 확인

- 만들기에서 복제·품질·프로젝트·설정으로 이동했다 돌아와도 입력과 타임라인이 유지된다.
- 품질·프로젝트·설정의 헤더, 제목 계층, 색상과 여백이 같은 작업공간 규칙을 따른다.
- 상단 설정 버튼과 하단 메뉴의 현재 페이지 상태가 일치한다.
- 프로젝트 저장소 오류는 빈 목록으로 숨기지 않고 오류와 다시 확인 동작을 제공한다.
- 일반 합성은 `engine_id=auto`로 요청한다.
- 첫 엔진 실패 시 같은 job에서 다음 준비 엔진을 시도한다.
- 연속 실패 엔진은 cooldown 동안 자동 후보에서 제외된다.
- 모든 후보 실패 시 `SOA-4013`, 모든 준비 엔진 격리 시 `SOA-4001`을 반환한다.
- `/engines`와 품질 연구소에서 자동 우선 엔진, 성공·실패와 cooldown을 확인할 수 있다.

## 환경 변수

```env
SORION_TTS_ENGINE_ORDER=cosyvoice3,melo,system,mock
SORION_ENGINE_FAILURE_THRESHOLD=2
SORION_ENGINE_COOLDOWN_SECONDS=30
```

실제 Fun-CosyVoice 3 Worker·모델·GPU가 준비되지 않은 상태에서는 전략상 주력이라는 이유만으로
ready 또는 성공으로 표시하지 않는다.

## 알려진 제한

엔진 circuit breaker 통계는 현재 API 프로세스 메모리에 있으며 다중 API 프로세스 공용 health
저장은 후속 운영 확장 대상이다. 현재 열린 브라우저 작업공간의 IndexedDB 자동 저장과 앱 재시작
복원은 0.8.6 범위다. 실제 모델 가중치·CUDA·사용자 음성·비밀키는 패치에 포함하지 않는다.

## 권장 브랜치와 커밋

```text
feat/unified-workspace-engine-orchestration
feat: unify workspace UX and orchestrate TTS engines
```
