# NEXT UPDATE

현재 기준 버전: `0.8.2 Mobile Job Recovery/API Idempotency`

## 목표 버전

`0.8.3 Mobile Session Persistence & Engine Operations`

## 방향

다음 패치도 **모바일 엔진·API 신뢰성**을 최우선으로 한다. 실제 LLM 대본 연결과 편집
기능 확장은 서버 작업 영속화·모바일 세션 복원·운영 보안이 먼저 안정된 뒤 진행한다.

## 1. 서버 작업 영속화

- 현재 메모리 기반 TTS job snapshot/result를 SQLite 또는 교체 가능한 JobStore로 분리
- API 재시작 뒤에도 job ID, 요청 fingerprint, 상태, 결과 메타데이터 복원
- 다중 API 프로세스에서도 동일 job ID가 한 번만 실행되도록 원자적 claim 적용
- 결과 TTL, 음원 파일 정리, 실패·취소 보존 기간을 설정값으로 분리
- 동일 job ID 충돌과 만료를 감사 로그·운영 지표에 기록

## 2. 모바일 편집 세션 복원

- IndexedDB에 채팅 메시지, 음성·쉼 블록, 순서, job ID와 생성 상태 저장
- 새로고침, 화면 잠금, PWA 종료 뒤 기존 job을 recover-first 방식으로 재연결
- Object URL이 사라진 음원은 서버 결과 URL 또는 저장 Blob으로 복구
- 저장 용량 부족, iOS 데이터 정리, 오래된 프로젝트 TTL을 사용자에게 표시
- 프로젝트별 API 주소·선택 보이스·최근 성공 엔진을 함께 복원

## 3. 엔진 운영 API 강화

- 엔진별 readiness, 지연, 최근 실패, 모델 버전과 장치 정보를 운영용 schema로 고정
- Worker heartbeat와 API gateway 상태를 분리하고 stale 상태를 명시
- 엔진 circuit breaker와 제한된 자동 복구 정책
- GPU queue depth, first-audio latency, realtime factor를 연결 바텀시트의 고급 진단에 표시
- 실제 모델 미연결·CUDA 미지원 상태를 성공으로 표시하지 않는 회귀 테스트 확대

## 4. 인증·공개 배포 경계

- 공개 HTTPS API용 access token과 만료·회전 계약
- 익명 client ID는 진단·rate limit 용도로만 유지하고 인증 ID와 분리
- 사용자별 job 조회·취소·결과 접근 권한 검사
- reverse proxy, TLS, CORS, Private Network 설정 예제 분리
- 음성 원문·사용자 음성을 로그와 오류 응답에 남기지 않는지 점검

## 5. 모바일 실기기 검증

- Android Chrome, iOS Safari, 설치형 PWA 매트릭스 작성
- Wi-Fi→셀룰러, 화면 잠금, 탭 종료, API 재시작, Worker 재시작 시나리오
- 동일 job 중복 POST 0회, 결과 복구 성공률, 복구 시간 측정
- 저장소 차단·quota 초과·private mode에서 설정과 세션 fallback 확인
- 느린 3G·데이터 절약 모드에서 timeout과 진행 표시 점검

## 6. 이후 기능 순서

1. 편집 순서·쉼을 반영한 WAV Export
2. ready 블록 자동 연속 재생과 Worker segment SSE 통합
3. 타임라인 undo·redo와 삭제 복원
4. 실제 `ScriptGenerationEngine`과 외부 전송 동의
5. 모바일 편집 포커스 모드

## 예상 변경 영역

```text
services/api/app/services/job_store.py
services/api/app/api/routes/tts.py
services/api/app/core/config.py
services/api/app/db/
src/projects/
src/storage/
src/hooks/useTimelineGeneration.ts
src/settings/
docs/
```

## 선행 조건

- GitHub Actions Web·API·Worker quality 성공
- 0.8.2 패치의 동일 job 단일 실행·결과 재사용·409 충돌 회귀 유지
- Python 3.10 CI에서 허용 Origin의 Private Network preflight 200 회귀 유지
- Android Chrome과 iOS Safari에서 최소 1회 실제 연결 단절 복구 확인
- 영속 JobStore의 저장 위치, TTL, 정리 정책 결정
- 공개 API 인증 방식과 사용자 소유권 모델 결정

## 금지 사항

- 재연결 실패를 이유로 같은 job을 무조건 새 POST하지 않는다.
- 서버 재시작 복구가 없는 상태를 영구 job이라고 표현하지 않는다.
- 실제 LLM·GPU 모델이 없는데 성공 상태를 만들지 않는다.
- 모바일 저장소 실패를 앱 전체 오류로 전파하지 않는다.
