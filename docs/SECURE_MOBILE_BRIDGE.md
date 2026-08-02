# Secure Mobile Voice API Bridge

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 5`

## 목적

GitHub Pages·Firebase Hosting의 정적 Web을 카카오톡 외부 브라우저나 모바일 Safari·Chrome에서
사용하려면 FastAPI를 공개 HTTPS 주소로 제공해야 합니다. 휴대폰의 `localhost`는 개발 PC가 아니며,
HTTPS Web에서 사설 HTTP API를 직접 호출하면 브라우저 mixed-content 정책에 막힐 수 있습니다.

## 권장 경계

```text
Mobile/PWA HTTPS
      │
      ▼
TLS reverse proxy or managed tunnel
      │  X-Forwarded-Proto / X-Forwarded-Host
      ▼
FastAPI 127.0.0.1:8000
      │ private HMAC
      ▼
CosyVoice Worker private network
```

- FastAPI와 Worker를 인터넷에 같은 방식으로 직접 공개하지 않습니다.
- Worker는 API 뒤의 사설망에 두고 서비스 토큰과 HMAC 서명을 유지합니다.
- 공개 Origin은 `SORION_CORS_ORIGINS`에 정확히 등록합니다.
- Web에는 `SORION_PUBLIC_API_BASE_URLS` 또는 런타임 설정으로 HTTPS API 후보를 주입합니다.
- TLS 종료 프록시는 외부에서 들어온 `X-Forwarded-*` 값을 제거한 뒤 자신이 계산한 값만 전달해야 합니다.

## 최소 배포 예시

FastAPI는 로컬 인터페이스에만 바인딩합니다.

```bash
cd services/api
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Caddy를 사용하는 예시입니다.

```caddyfile
voice.example.com {
  reverse_proxy 127.0.0.1:8000
}
```

운영 환경 예시입니다.

```env
SORION_ENVIRONMENT=production
SORION_CORS_ORIGINS=https://junl-im.github.io,https://your-web.example.com
SORION_PUBLIC_API_BASE_URLS=https://voice.example.com/api/v1
SORION_WORKER_SERVICE_TOKEN=<secret>
SORION_WORKER_SIGNATURE_SECRET=<secret>
```

## Engine Doctor 판정

`GET /api/v1/connectivity`는 다음 필드를 반환합니다.

- `public_https_ready`: 요청이 공개 호스트의 HTTPS를 통해 들어왔는지 여부
- `public_api_origin`: 진단에서 확인한 공개 Origin. 로컬·사설 주소면 `null`
- `public-https-bridge`: ready, warning, missing 중 하나인 상세 검사

이 판정은 연결 진단이며 인증 수단이 아닙니다. Heartbeat 5는 프록시가 전달한 Origin을 진단에만
사용합니다. 신뢰 프록시 allowlist와 전달 헤더 강제 정규화는 Heartbeat 6의 보안 강화 범위입니다.

## 점검 순서

1. 모바일 네트워크에서 `https://<voice-host>/api/v1/health`가 열리는지 확인합니다.
2. Engine Doctor에서 `모바일 공개 HTTPS Bridge`가 준비됨인지 확인합니다.
3. CORS 검사에 실제 정적 Web Origin이 포함됐는지 확인합니다.
4. TTS·Worker·GPU·모델 상태를 별도로 확인합니다.
5. 카카오톡 WebView에서는 외부 브라우저 전환 후 같은 검사를 반복합니다.

## 금지

- 자체 서명 인증서나 HTTP 공개 주소를 준비됨으로 취급하지 않습니다.
- Worker 포트, 모델 경로, 토큰, 사용자 음원을 진단 복사나 릴리스 ZIP에 넣지 않습니다.
- forwarded header만 믿어 권한을 부여하지 않습니다.
