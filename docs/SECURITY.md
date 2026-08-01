# SoriON API · Worker 보안

현재 기준 버전: `0.9.1`

## API와 Worker 인증

공개 FastAPI와 GPU Worker는 같은 서비스 토큰과 서명 비밀키를 공유한다.
Worker `/health`만 공개하고 `/ready`와 `/v1/*`는 인증한다.

요청에는 다음 헤더가 들어간다.

```text
X-SoriON-Service-Token
X-SoriON-Timestamp
X-SoriON-Signature
```

서명은 `method + path + timestamp + SHA-256(body)`를 HMAC-SHA256으로 계산한다.
기본 유효 시간은 30초이며 만료 요청과 변조된 body를 거부한다.

```env
# FastAPI와 Worker에 같은 값으로 주입
SORION_WORKER_SERVICE_TOKEN=replace-with-random-token
SORION_WORKER_SIGNATURE_SECRET=replace-with-random-secret
SORION_WORKER_AUTH_TTL_SECONDS=30
```

서비스 토큰과 서명 비밀은 API와 Worker에 같은 값으로 주입하고 TTL은 Worker에서 적용한다.
실제 배포에서는 저장소에 값을 커밋하지 않고 배포 플랫폼 Secret으로 주입한다.

## 요청 제한

FastAPI는 사용자 ID 또는 IP 기준으로 분당 요청을 제한한다. Worker도 서비스 토큰 기준으로
별도 제한한다. 제한을 넘으면 HTTP 429와 재시도 시각을 반환한다.

## 감사 로그

API와 Worker는 본문·음성 데이터 없이 다음 운영 메타데이터만 JSONL 감사 로그에 남긴다.

- 시각
- 요청 경로와 메서드
- 응답 상태
- 요청 ID
- 익명화된 actor 키
- 인증 실패·요청 제한·작업 생성·취소·재시도 이벤트

원본 문장과 음성 파일은 감사 로그에 기록하지 않는다.

## 외부 노출 원칙

- Worker는 공용 인터넷에 직접 노출하지 않는다.
- 방화벽 또는 사설 네트워크로 FastAPI에서만 접근한다.
- `/health`에는 모델 경로·GPU 상세를 노출하지 않는다.
- 상세 진단은 인증된 `/v1/diagnostics`에서만 제공한다.


## 모바일 API 식별과 Private Network

Web은 인증 토큰 대신 사용할 수 없는 익명 `X-SoriON-Client-ID`와 요청 추적용
`X-Request-ID`를 보낸다. client ID는 공개 rate limit과 장애 진단에만 사용하며 사용자 문장,
음성, 이메일과 결합하지 않는다. 사용자는 브라우저 저장소를 지워 ID를 초기화할 수 있다.

개발 LAN 연결은 `SORION_ALLOW_PRIVATE_NETWORK=true`에서 Private Network preflight를
허용한다. 이 헤더는 개발 편의를 위한 CORS 응답일 뿐 인증이나 암호화를 대신하지 않는다.
공개 서비스는 HTTPS, 사용자 인증, Origin 제한, 방화벽과 Worker 사설망을 적용한다.

## 0.8.3 JobStore 데이터 경계

SQLite `tts_jobs`에는 원문 텍스트와 음성 샘플을 별도 열로 저장하지 않는다. 요청 payload는
SHA-256 fingerprint로만 식별하고 완료 응답의 엔진·음원 URL·처리 메타데이터를 보관한다.
DB 파일은 API 서버의 비공개 데이터 디렉터리에 두고 Web 정적 배포나 릴리스 ZIP에 포함하지
않는다. 여러 API 프로세스가 공유하더라도 파일 권한은 API 서비스 계정으로 제한한다.

## 0.8.5 엔진 fallback 보안 경계

자동 fallback은 등록되고 ready인 TTS Adapter 안에서만 수행한다. 사용자 입력으로 임의 Worker URL이나
엔진 모듈을 선택하지 못하며 명시 엔진 요청은 다른 엔진으로 조용히 바꾸지 않는다. 마지막 오류는
진단용 300자로 제한하고 원문 문장·음성 데이터·비밀키를 엔진 runtime 상태에 저장하지 않는다.
