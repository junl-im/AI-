# MOBILE ENGINE/API RELIABILITY

버전: `0.8.7`

## 목표

모바일은 Wi-Fi·셀룰러 전환, PWA 백그라운드 중단, 느린 RTT와 브라우저 보안 정책 때문에
데스크톱보다 쉽게 끊긴다. SoriON은 API 실패를 Demo 성공으로 숨기지 않으며, 사용자가
주소나 엔진을 직접 연결하지 않아도 시스템이 안전한 후보를 자동 탐색하고 복구한다.

## 네 계층 상태

| 계층 | 의미 | 성공 기준 |
|---|---|---|
| API | FastAPI Gateway | `/health`와 `/connectivity` 응답 |
| TTS | 실제 음성 엔진 | Mock 이외 준비 엔진 존재 |
| Worker | CosyVoice 프로세스 | Worker health 응답 |
| GPU | 실제 추론 준비 | CUDA·모델·Adapter readiness |

Worker가 살아 있어도 GPU나 모델이 없으면 복제 실행을 잠그고 `준비 안 됨`으로 표시한다.
상태 표시는 진단 정보이며 클릭하거나 주소를 입력하는 연결 UI가 아니다.

## API 주소와 자동 발견

Web은 다음 값을 내부적으로 분리 저장한다.

```text
sorion-api-base-url
sorion-api-last-good-url
sorion-api-url-history
sorion-client-id
```

후보 우선순위:

1. 같은 Origin의 `/api/v1`
2. 빌드 시 `VITE_API_BASE_URL`
3. 마지막 성공 주소와 최근 자동 발견 주소
4. localhost 개발 후보 또는 현재 HTTP 호스트의 안전한 포트

- 사용자가 API 주소를 입력하거나 저장하는 화면은 없다.
- 성공 주소는 last-good과 최근 이력에 기록한다.
- 전체 LAN 대역을 자동 스캔하지 않는다.
- 공개 배포는 HTTPS API 또는 same-origin reverse proxy를 사용한다.

## 모바일 연결 제약

- 휴대폰에서 `localhost`와 `127.0.0.1`은 휴대폰 자신이다.
- HTTP 로컬 개발은 현재 PC 호스트의 API 후보를 자동 확인할 수 있다.
- HTTPS Web에서 HTTP LAN API는 mixed-content 또는 Private Network 정책으로 차단될 수 있다.
- 브라우저 정책으로 차단된 연결은 자동 탐색 코드로 우회하지 않는다.
- PC 방화벽과 공유기 AP isolation도 연결 실패 원인이 될 수 있다.

## Private Network preflight

개발 LAN 연결을 위해 API는 요청에 다음 헤더가 있을 때 설정값에 따라 응답한다.

```text
Access-Control-Request-Private-Network: true
Access-Control-Allow-Private-Network: true
```

```env
SORION_ALLOW_PRIVATE_NETWORK=true
```

이 설정은 인증을 대신하지 않는다. 전용 `PrivateNetworkCORSMiddleware`가 표준
Origin·Method·요청 헤더를 먼저 검증하며 잘못된 Origin과 설정 비활성화는 400으로 유지한다.

## 요청 정책

### GET·HEAD

- 일시적 408, 425, 429, 502, 503, 504와 네트워크 오류만 제한 재시도
- 모바일 연결 상태에 따라 timeout 조정
- `cache: no-store`, `credentials: omit`

### POST 음성 생성

- 자동 재전송하지 않는다.
- Web이 UUID job ID를 POST 전에 만든다.
- 응답 단절 또는 프로젝트 복원 시 같은 job 상태와 결과를 먼저 조회한다.

```text
POST /api/v1/tts/synthesize
GET  /api/v1/tts/jobs/{job_id}
GET  /api/v1/tts/jobs/{job_id}/result
```

## 자동 재점검

다음 이벤트에서 단일 실행으로 시스템 상태를 다시 확인한다.

- 앱 초기 bootstrap
- 브라우저 online/offline
- Wi-Fi·셀룰러 NetworkInformation 변경
- PWA 또는 탭이 visible 상태로 복귀
- 내부 `sorion-api-reconnect` 요청

실패 시 `5초 → 12초 → 30초 → 60초`로 늘리며 동시 중복 점검을 만들지 않는다.

## 추적 정보

모든 요청에 `X-Request-ID`와 익명 `X-SoriON-Client-ID`를 보낸다. request ID는 로그와
상태 진단에 사용하고, client ID에는 문장·음성·Secret을 포함하지 않는다.

## 모바일 UI 기준

- 주요 터치 영역 최소 44px, 입력 글자 16px 이상
- composer와 작업공간 Dock에 safe-area 적용
- 첫 브랜드 랜딩에서는 Dock과 메뉴를 렌더링하지 않음
- 작업공간 진입 뒤에만 메뉴 Dock, ready 음성 뒤에 Player 표시
- API 연결 실패 상태는 수동 주소 입력이나 Bottom Sheet로 연결하지 않음

## 실제 확인 절차

1. Worker와 API를 실행한다.
2. Web을 열고 주소 입력 없이 API가 자동 발견되는지 확인한다.
3. API·TTS·Worker·GPU 네 상태를 확인한다.
4. 음성 생성 중 Wi-Fi를 끊었다 연결해 같은 job 결과가 복구되는지 확인한다.
5. PWA를 백그라운드로 보낸 뒤 복귀해 상태가 자동 재점검되는지 확인한다.
6. 첫 랜딩에는 Dock이 없고 작업공간 진입 뒤 나타나는지 확인한다.
7. 프로젝트 클릭 시 새 POST 없이 저장된 job 결과를 먼저 회수하는지 확인한다.

## 알려진 한계

- NetworkInformation API는 모든 브라우저에서 제공되지 않는다.
- iOS는 백그라운드 JavaScript와 네트워크를 강하게 중단할 수 있다.
- mixed-content 차단은 Web 코드에서 우회할 수 없다.
- 공개 사용자 인증과 토큰 갱신은 아직 구현되지 않았다.
- 실제 CosyVoice GPU 모델은 릴리스 ZIP에 포함되지 않는다.

## 0.8.2 job 수명과 멱등성

- 음성 블록에 job ID를 POST 전에 저장하고 실패 재시도는 GET/result를 먼저 시도한다.
- 같은 job ID·같은 fingerprint는 실행 Task와 완료 결과를 재사용한다.
- 다른 payload 재사용은 HTTP 409 `SOA-4009`로 차단한다.
- HTTP 연결 취소는 생성 Task를 취소하지 않으며 명시적 DELETE만 취소한다.

## 0.8.3 서버 재시작·다중 프로세스 복구

- snapshot, fingerprint와 결과를 SQLite JobStore에 저장한다.
- API 재시작 뒤 같은 job ID 상태와 완료 결과를 조회한다.
- 여러 API 프로세스는 원자적 claim을 사용하고 stale claim을 재획득한다.
- 완료 결과 TTL 뒤 tombstone 동안 POST와 `/result`는 410을 반환한다.
- cross-process 취소 신호를 owner Task가 반영한다.

## 0.8.4 자동 연결·프로젝트 복구

- 수동 API 설정 컴포넌트와 연결 Bottom Sheet를 삭제했다.
- 자동 bootstrap 성공 시 준비된 실제 엔진을 선택한다.
- 프로젝트 목록 클릭이 장문 원고·보이스·타임라인을 작업공간에 복원한다.
- 저장된 job ID는 위치를 유지하고 `/result` recover-first로 음원을 되살린다.
- 만료 음원은 자동 재생성하지 않고 해당 블록의 재생성 동작으로 넘긴다.

## 모바일 브라우저 fallback

- localStorage write 실패 시 자동 발견 주소와 client ID를 세션 메모리에 유지한다.
- `crypto.randomUUID()`가 없으면 `getRandomValues()` 기반 ID를 만든다.
- 이는 세션 중 기능 중단 방지이며 영구 저장이나 인증 수단이 아니다.

## 0.8.5 서버 엔진 자동 전환

모바일 Web은 네트워크 재연결과 엔진 실행 fallback을 구분한다. API 주소 탐색은 Web bootstrap이
담당하고, 연결된 API 내부에서 어떤 엔진을 실행할지는 `EngineOrchestrator`가 결정한다. 클라이언트는
fallback을 위해 같은 POST를 재전송하지 않으며 한 job 안의 서버 시도 결과를 기다리거나 job ID로
복구한다. 메뉴 이동 중에는 HomePage 상태를 유지해 네트워크 복구와 UI 탐색이 초안을 지우지 않는다.
