# MOBILE ENGINE/API RELIABILITY

버전: `0.8.2`

## 목표

모바일 네트워크는 Wi-Fi·셀룰러 전환, PWA 백그라운드 중단, 느린 RTT, 브라우저
보안 정책 때문에 데스크톱보다 쉽게 끊긴다. SoriON은 API 실패를 Demo 성공으로 숨기지
않고 사용자가 현재 작업 화면에서 원인을 확인하고 복구하도록 한다.

## 네 계층 상태

| 계층 | 의미 | 성공 기준 |
|---|---|---|
| API | FastAPI Gateway | `/health`와 `/connectivity` 응답 |
| TTS | 실제 음성 엔진 | Mock 이외 준비 엔진 존재 |
| Worker | CosyVoice 프로세스 | Worker health 응답 |
| GPU | 실제 추론 준비 | CUDA·모델·Adapter readiness |

Worker가 살아 있어도 GPU나 모델이 없으면 복제 실행을 잠그고 `준비 안 됨`으로 표시한다.

## API 주소 저장

Web은 다음 값을 분리 저장한다.

```text
sorion-api-base-url
sorion-api-last-good-url
sorion-api-url-history
sorion-client-id
```

- 사용자가 저장한 주소가 최우선이다.
- 성공한 주소는 별도의 last-good 값으로 기록한다.
- 최근 주소는 중복 없이 최대 5개만 보존한다.
- 전체 LAN 대역을 자동 스캔하지 않는다.
- 스킴이 없는 LAN IP는 HTTP, 공개 도메인은 현재 페이지에 맞춰 정규화한다.

## 모바일 연결 제약

- 휴대폰에서 `localhost`와 `127.0.0.1`은 휴대폰 자신이다.
- HTTP 개발 Web은 같은 Wi-Fi의 `http://PC-LAN-IP:8000`을 사용할 수 있다.
- HTTPS Web에서 HTTP LAN API는 mixed-content 또는 Private Network 정책으로 차단될 수 있다.
- 공개 배포는 HTTPS FastAPI와 사설 Worker가 권장 구조다.
- PC 방화벽과 공유기 AP isolation도 연결 실패 원인이 될 수 있다.

## Private Network preflight

개발 LAN 연결을 위해 API는 요청에 다음 헤더가 있을 때 설정값에 따라 응답한다.

```text
Access-Control-Request-Private-Network: true
Access-Control-Allow-Private-Network: true
```

환경 변수:

```env
SORION_ALLOW_PRIVATE_NETWORK=true
```

이 설정은 인증을 대신하지 않는다. 공개 운영 환경에서는 HTTPS, 사용자 인증, rate limit,
Origin 제한과 네트워크 방화벽을 함께 적용해야 한다.

## 요청 정책

### GET·HEAD

- 일시적인 408, 425, 429, 502, 503, 504와 네트워크 오류만 제한적으로 재시도
- 모바일 연결 상태에 따라 timeout을 늘림
- `cache: no-store`, `credentials: omit`

### POST 음성 생성

- 자동 재전송하지 않는다.
- 동일 문장을 중복 생성하지 않도록 Web이 UUID job ID를 먼저 만든다.
- 응답이 끊기면 job 상태를 조회하고 완료 후 결과 엔드포인트로 복구한다.

```text
POST /api/v1/tts/synthesize
GET  /api/v1/tts/jobs/{job_id}
GET  /api/v1/tts/jobs/{job_id}/result
```

## 자동 재점검

다음 이벤트에서 단일 실행으로 엔진 상태를 다시 확인한다.

- API 주소 변경
- 브라우저 online/offline
- Wi-Fi·셀룰러 NetworkInformation 변경
- PWA 또는 탭이 visible 상태로 복귀

실패 시 재검사 간격:

```text
5초 → 12초 → 30초 → 60초
```

동시에 여러 점검을 실행하지 않고, 실행 중 요청이 있으면 한 번만 추가 점검한다.

## 추적 정보

모든 요청에 다음 헤더를 보낸다.

```text
X-Request-ID
X-SoriON-Client-ID
```

- request ID는 사용자가 연결 바텀시트에서 확인할 수 있다.
- client ID는 인증 ID가 아닌 익명 rate-limit·진단 식별자다.
- 문장, 음성, Secret을 client ID에 포함하지 않는다.

## 모바일 UI 기준

- 주요 버튼과 아이콘 터치 영역 최소 44px
- 입력 글자 16px 이상으로 iOS 자동 확대 방지
- composer, Dock, 바텀시트에 `env(safe-area-inset-*)` 반영
- 바텀시트 최대 높이는 동적 viewport 단위 사용
- 네 상태를 2×2 카드로 표시하고 작은 화면에서도 원인을 생략하지 않음
- API 준비 전 생성 버튼은 잠그고 채팅 안에서 연결 동선을 제공

## 실제 확인 절차

1. Worker를 실행한다.
2. API에 `SORION_COSYVOICE_WORKER_URL`을 설정하고 실행한다.
3. PC에서 `/api/v1/connectivity`를 확인한다.
4. 휴대폰에서 PC LAN IP를 저장한다.
5. API·TTS·Worker·GPU 네 상태를 확인한다.
6. 음성 생성 중 Wi-Fi를 잠시 끊었다 다시 연결한다.
7. POST가 중복되지 않고 동일 job 결과가 복구되는지 확인한다.
8. PWA를 백그라운드로 보낸 뒤 복귀해 상태가 재점검되는지 확인한다.

## 알려진 한계

- NetworkInformation API는 모든 브라우저에서 제공되지 않는다.
- iOS는 백그라운드 JavaScript와 네트워크를 강하게 중단할 수 있다.
- 브라우저가 mixed-content를 차단하면 Web 코드에서 우회할 수 없다.
- 공개 사용자 인증과 토큰 갱신은 아직 구현되지 않았다.
- 실제 CosyVoice GPU 모델은 릴리스 ZIP에 포함되지 않는다.

## 0.8.2 job 수명과 멱등성

- Web은 음성 블록에 job ID를 POST 전에 저장한다.
- 실패 재시도는 새 POST보다 `GET /jobs/{job_id}`와 `/result`를 먼저 시도한다.
- 네트워크 오류는 job ID를 유지하고, 404·410 또는 failed/cancelled 상태에서만 새 ID를 만든다.
- 같은 블록의 생성 버튼을 반복해서 눌러도 클라이언트 single-flight가 추가 요청을 막는다.
- FastAPI는 같은 job ID와 같은 요청 fingerprint를 하나의 Task로 합치고 완료 결과를 재사용한다.
- 같은 job ID에 다른 요청이 들어오면 HTTP 409 `SOA-4009`를 반환한다.
- HTTP 연결 취소는 생성 Task를 취소하지 않는다. 명시적 DELETE만 서버 작업을 취소한다.
- snapshot, fingerprint와 결과는 제한된 메모리 history에 있으며 API 재시작 시 사라진다.

## 모바일 브라우저 fallback

- `localStorage.setItem()`이 private mode·quota 오류를 내면 API 주소와 client ID를 메모리에 유지한다.
- `crypto.randomUUID()`가 없으면 `getRandomValues()` 기반 RFC 4122 형태 ID를 만든다.
- 두 기능 모두 세션 중 기능 중단을 막기 위한 fallback이며 영구 저장이나 암호학적 인증 수단이 아니다.
