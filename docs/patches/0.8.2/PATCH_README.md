# SoriON AI 0.8.1 → 0.8.2 패치

## 목적

모바일 연결 단절·중복 탭·PWA 중단 상황에서도 같은 음성 작업을 중복 실행하지 않고 기존
job의 상태와 결과를 복구하도록 Web→FastAPI 작업 수명과 멱등성을 강화합니다.

## 적용 조건

현재 저장소의 `package.json` 버전이 정확히 `0.8.1`일 때만 적용합니다.

## 적용 방법

1. 현재 변경사항을 커밋하거나 별도 백업합니다.
2. `.git` 폴더는 유지합니다.
3. 패치 ZIP을 저장소 최상위에 압축 해제합니다.
4. 같은 이름의 파일을 전부 덮어씁니다.
5. `docs/patches/0.8.2/DELETE_LIST.txt`를 확인합니다. 삭제 대상은 없습니다.
6. `package.json` 버전이 `0.8.2`인지 확인합니다.
7. 아래 품질 검사를 실행합니다.
8. 기능 브랜치에서 커밋하고 GitHub Actions를 확인합니다.

```bash
npm run quality:rules
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:api
npm run test:worker
```

## 핵심 확인

- 같은 job ID·같은 payload를 반복 전송해도 합성은 한 번만 실행됩니다.
- 같은 job ID·다른 payload는 HTTP 409와 `SOA-4009`로 차단됩니다.
- 모바일 HTTP 연결이 끊겨도 서버 Task는 계속 실행되고 `/result`로 복구됩니다.
- 타임라인 실패 블록은 새 POST 전에 저장된 job ID를 먼저 조회합니다.
- 생성 중 문장 수정·분할은 진행 요청을 중단하고 오래된 결과 덮어쓰기를 막습니다.
- iOS private mode·quota 오류와 `randomUUID` 미지원 환경에서 fallback이 동작합니다.

## 현재 제한

job snapshot, 요청 fingerprint와 완료 결과는 아직 API 프로세스 메모리에 저장됩니다.
API 재시작·다중 프로세스 영속성은 0.8.3 JobStore에서 구현합니다.

## 권장 브랜치와 커밋

```text
fix/mobile-job-recovery-idempotency
```

```text
fix: make mobile TTS jobs idempotent and recoverable
```
