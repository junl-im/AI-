# SoriON AI 0.8.2 Result Report

작성: 2026-08-01 12:25 KST

## 목표

모바일을 주 사용 환경으로 보고 네트워크 전환, PWA 백그라운드 중단, 중복 탭과 HTTP
응답 단절에서도 같은 TTS 작업이 중복 실행되지 않도록 Web과 FastAPI의 job 수명·복구
계약을 강화한다. 실제 모델이 없는 상태는 성공으로 숨기지 않는다.

## 파일·인수인계 분석 결론

- 기존 0.8.1은 Web이 job ID로 `/result`를 조회했지만 HTTP 호출 취소가 내부 Task를 취소할
  수 있어 모바일 단절 복구 계약이 완전하지 않았다.
- 완료된 job ID를 다시 POST하면 재생성될 수 있고 다른 payload 재사용도 차단하지 않았다.
- 타임라인 블록이 job ID를 보존하지 않아 복구 실패 뒤 새 작업이 만들어질 수 있었다.
- iOS private mode·저장공간 quota에서 localStorage 쓰기가 앱 흐름을 깨뜨릴 수 있었다.
- 일부 모바일 브라우저의 `crypto.randomUUID()` 미지원 fallback이 없었다.
- 기존 다음 목표가 LLM·편집 확장 중심이라 사용자 결정인 모바일 엔진/API 강화와 충돌했다.

## 완료 항목

### FastAPI job 멱등성

- 요청 payload에서 job ID를 제외한 SHA-256 fingerprint 생성
- 같은 job ID·같은 fingerprint는 실행 중 Task 공유
- 완료 뒤 같은 요청은 저장 결과 반환, 합성 factory 재실행 없음
- 같은 job ID·다른 fingerprint는 HTTP 409 `SOA-4009`
- fingerprint, snapshot, result를 같은 history 수명으로 정리

### 모바일 연결 단절 복구

- `asyncio.shield`로 HTTP 호출 수명과 실제 생성 Task 수명 분리
- 호출 코루틴 취소·연결 단절 뒤에도 서버 생성 계속
- 명시적 `DELETE /tts/jobs/{job_id}`만 Task 취소
- 완료 상태와 `/result`에서 기존 결과 복구

### 타임라인 recover-first

- 음성 블록에 `jobId` 저장
- POST 전에 job ID를 상태에 반영
- 재시도 시 progress/result 조회 후 필요할 때만 새 POST
- 네트워크 오류에서는 기존 ID 유지
- 404·410 또는 failed/cancelled 상태에서만 새 ID 생성
- 블록별 single-flight로 반복 탭의 동시 생성 방지
- 편집·분할 시 AbortController와 polling 정리, stale 결과 덮어쓰기 차단

### 모바일 브라우저 호환

- localStorage 읽기·쓰기·삭제 예외를 메모리 fallback으로 처리
- iOS private mode·quota 오류에서도 API 주소와 익명 client ID를 세션 동안 유지
- `randomUUID`, `getRandomValues`, 최종 호환 fallback 순서의 공통 ID 생성기
- Voice Clone, Home, Player, HTTP, Voice/Timeline generation의 직접 UUID 호출 통합

### 인수인계·개발 목표

- 현재 버전을 `0.8.2 Mobile Job Recovery/API Idempotency`로 통일
- 다음 목표를 `0.8.3 Mobile Session Persistence & Engine Operations`로 변경
- LLM 기능보다 영속 JobStore, IndexedDB 세션 복원, 엔진 운영 진단·인증을 우선
- HANDOVER, CHANGELOG, NEXT_UPDATE, RELEASE, ROADMAP, 테스트·아키텍처 문서 갱신

## 자동 검증

- 프로젝트 절대 규칙: 통과 (`v0.8.2`)
- FastAPI 테스트: **65 passed**
- CosyVoice Worker 테스트: **9 passed**
- Python compileall: 통과
- TypeScript·TSX 구문: **108 files, 0 errors**
- 소스 파일 500줄 이하와 Python 표시 폭 규칙: 프로젝트 규칙 검사 통과
- 패치 적용 동등성: 최종 패키징 단계에서 전체 파일 SHA-256 비교

## 실행하지 못한 공식 검사

현재 실행 환경의 npm 저장소가 `@tailwindcss/vite`를 404로 반환해 Web 의존성 설치가
완료되지 않았다. 따라서 정식 Vitest, ESLint, TypeScript project typecheck와 Vite production
build는 실행하지 못했다. Ruff 실행 파일도 없어 공식 Ruff 명령을 실행하지 못했다. Python
테스트·compileall과 TypeScript parser로 대체 확인했으며 GitHub Actions에서 정식 검사가 필요하다.

## 알려진 제한

- job snapshot, fingerprint와 결과는 API 프로세스 메모리에 있어 API 재시작 시 사라진다.
- 다중 Uvicorn worker 간에는 아직 job claim과 결과를 공유하지 않는다.
- localStorage fallback은 세션 메모리이므로 앱 종료 뒤 영구 복원되지 않는다.
- 실제 CosyVoice 모델·CUDA GPU와 실제 LLM은 릴리스에 포함되지 않는다.
- 공개 사용자 인증과 job 소유권 검사는 아직 없다.
- HTTPS Web에서 HTTP LAN API 차단은 Web 코드로 우회할 수 없다.

## 릴리스 구성

- 전체 프로젝트 파일: 345개
- 추가 파일: 6개
- 수정 파일: 48개
- 삭제 파일: 0개
- 패치 포함 파일: 54개

## 산출물

- `SoriON-AI-0.8.2-full.zip`
- `SoriON-AI-0.8.1-to-0.8.2-patch.zip`
- `SoriON-AI-0.8.2-artifacts.sha256`
- `docs/HANDOVER.md`
- `docs/CHANGELOG.md`
- `docs/NEXT_UPDATE.md`
- `docs/patches/0.8.2/`
