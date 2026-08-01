# SoriON AI 0.8.3 Result Report

작업 일시: 2026-08-01 15:00 KST
기준 버전: 0.8.2 Mobile Job Recovery/API Idempotency
결과 버전: 0.8.3 Persistent Job Store/Atomic Claim

## 1. 결과

이번 패치는 FastAPI의 TTS job을 프로세스 메모리에서 SQLite 기반 JobStore로 옮겼다.
클라이언트 job ID, 요청 fingerprint, 진행 snapshot과 완료 응답이 API 재시작 뒤에도
남으며 여러 API 프로세스가 같은 DB 파일을 공유할 때 동일 job을 한 번만 실행한다.

사용자에게 보이는 API 계약은 유지된다.

- 같은 job ID·같은 요청: 실행 중 join 또는 완료 결과 재사용
- 같은 job ID·다른 요청: HTTP 409, `SOA-4009`
- 완료 결과 TTL 만료: HTTP 410, `SOA-4012`
- 알 수 없는 job: HTTP 404, `SOA-4010`
- 다른 API 프로세스에서 취소: SQLite 취소 신호를 owner Task가 감지

## 2. 구현 내용

### 교체 가능한 JobStore

- `JobStore` protocol과 `MemoryJobStore`를 분리했다.
- 기본 운영 저장소로 `SQLiteJobStore`를 추가했다.
- 결과 직렬화를 `job_result_codec.py`로 분리했다.
- 파일별 500줄 제한을 지키도록 memory/protocol, SQLite, codec을 나눴다.

### 원자적 claim

- SQLite `BEGIN IMMEDIATE` transaction에서 job ID와 fingerprint를 확인한다.
- owner와 claim 만료 시각을 저장한다.
- 유효 claim이 있으면 다른 manager는 결과를 polling한다.
- owner 프로세스가 사라지면 claim TTL 뒤 다른 manager가 재획득한다.
- claim TTL은 생성 timeout보다 최소 5초 길게 보정한다.

### 결과와 이력 TTL

- 완료 응답 TTL과 job 이력 TTL을 분리했다.
- 기본 결과 TTL: 30분.
- 기본 이력 TTL: 24시간.
- 결과가 사라져도 completed tombstone을 유지해 같은 ID를 조용히 재생성하지 않는다.
- startup cleanup에서 만료 결과와 이력을 정리하고 정리 건수를 감사 로그에 기록한다.

### 취소와 감사 로그

- 취소 요청을 SQLite에 기록한다.
- owner process watcher가 취소 신호를 polling하고 실제 생성 Task를 취소한다.
- job ID payload 충돌과 결과 만료를 별도 audit event로 기록한다.

### CI 안정화 포함

- Ruff I001이 발생한 PNA middleware import block을 정리했다.
- Web CI의 Vitest 파일 병렬 실행을 끄는 `test:ci` 명령을 유지했다.

## 3. 새 환경 변수

```text
SORION_JOB_STORE_PATH=.sorion/jobs.sqlite3
SORION_JOB_CLAIM_TTL_SECONDS=120
SORION_JOB_RESULT_TTL_MINUTES=30
SORION_JOB_HISTORY_TTL_HOURS=24
SORION_JOB_POLL_INTERVAL_SECONDS=0.1
```

여러 API 프로세스는 같은 로컬 SQLite 파일을 사용해야 한다. 네트워크 파일시스템이나
여러 서버 노드에서는 SQLite locking과 공유 스토리지 특성을 별도로 검증해야 한다.

## 4. 검증

통과:

- FastAPI pytest: 77 passed
- CosyVoice Worker pytest: 9 passed
- 프로젝트 절대 규칙
- Python compileall
- Python 3.10 AST parsing
- `git diff --check`
- SQLite API restart recovery
- 두 JobManager 원자적 single execution
- stale claim recovery
- result tombstone expiration
- cross-manager cancellation
- TTL cleanup

실행하지 못함:

- Ruff 0.15.22: 현재 Python package mirror에 배포본이 없어 설치 실패
- Web ESLint/TypeScript/Vitest/Vite build: 현재 작업본에 `node_modules`와 lockfile이 없고
  외부 의존성 설치를 보장할 수 없어 GitHub Actions에서 최종 확인 필요

## 5. 알려진 제한

- SQLite는 단일 호스트 또는 신뢰할 수 있는 공유 파일 경로 기준이다.
- 실제 생성 Task는 여전히 owner 프로세스 메모리에 있다. 프로세스가 죽으면 claim TTL 뒤
  새 프로세스가 요청을 재실행한다.
- 실제 CosyVoice 모델, CUDA, GPU benchmark와 실제 LLM은 포함되지 않는다.
- 모바일 타임라인 자체의 IndexedDB 자동 복원은 0.8.4 범위다.

## 6. 산출물

- `SoriON-AI-0.8.3-full.zip`
- `SoriON-AI-0.8.2-to-0.8.3-patch.zip`
- `SoriON-AI-0.8.3-artifacts.sha256`
- `docs/patches/0.8.3/PATCH_README.md`
- `docs/patches/0.8.3/PATCH_MANIFEST.txt`

## 7. 다음 목표

0.8.4는 모바일 채팅·타임라인·job ID·선택 엔진을 IndexedDB에 저장하고 PWA 종료,
새로고침, 화면 잠금 뒤 서버 job에 recover-first로 다시 연결한다. Object URL 소실,
quota 초과, private mode와 iOS 데이터 정리도 같은 패치에서 다룬다.
