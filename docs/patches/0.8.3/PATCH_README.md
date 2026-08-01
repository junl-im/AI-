# SoriON AI 0.8.2 → 0.8.3 패치

## 목적

FastAPI TTS job의 요청 fingerprint, 진행 상태와 완료 결과를 SQLite에 저장해 API 재시작과
다중 프로세스에서도 같은 job ID를 안전하게 복구한다. 직전 0.8.2 CI 안정화 수정인 PNA
middleware import 정렬과 Web Vitest 직렬 실행도 함께 포함한다.

## 적용 조건

현재 저장소의 `package.json` 버전이 정확히 `0.8.2`일 때만 적용한다. 작업 중 변경사항은
먼저 커밋하거나 백업하고 `.git` 폴더는 유지한다.

## 적용 방법

1. 패치 ZIP을 저장소 최상위에 압축 해제한다.
2. 같은 이름의 파일을 모두 덮어쓴다.
3. `docs/patches/0.8.3/DELETE_LIST.txt`를 확인한다. 삭제 대상은 없다.
4. `.env.example`의 새 JobStore 환경 변수를 운영 `.env`에 검토해 반영한다.
5. `package.json` 버전이 `0.8.3`인지 확인한다.
6. 아래 품질 검사를 실행하고 GitHub Actions가 모두 성공한 뒤 병합한다.

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

## 새 환경 변수

```env
SORION_JOB_STORE_PATH=.sorion/jobs.sqlite3
SORION_JOB_CLAIM_TTL_SECONDS=120
SORION_JOB_RESULT_TTL_MINUTES=30
SORION_JOB_HISTORY_TTL_HOURS=24
SORION_JOB_POLL_INTERVAL_SECONDS=0.1
```

여러 API 프로세스는 같은 로컬 SQLite 파일을 공유해야 한다. 네트워크 파일시스템이나 여러
서버 노드에서는 SQLite locking과 공유 경로를 별도로 검증한다.

## 핵심 확인

- API 재시작 뒤 완료 job의 `/jobs/{id}`와 `/result`가 복구된다.
- 같은 DB를 쓰는 두 API 프로세스에서 동일 job factory가 한 번만 실행된다.
- 같은 job ID·다른 payload는 409 `SOA-4009`로 차단된다.
- 완료 결과 TTL이 지나면 410 `SOA-4012`를 반환한다.
- 서버를 재시작하지 않아도 조회·재요청 시 만료 결과와 이력이 정리된다.
- 다른 API 프로세스로 전달된 취소 요청이 owner Task를 취소한다.

## 알려진 제한

모바일 채팅·타임라인 자체의 IndexedDB 자동 복원은 0.8.4 범위다. 실제 CosyVoice 모델,
CUDA, GPU benchmark와 실제 LLM은 이 패치에 포함되지 않는다.

## 권장 브랜치와 커밋

```text
feature/persistent-job-store
```

```text
feat: persist TTS jobs with atomic SQLite claims
```
