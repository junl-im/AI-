# Secure Mobile Voice API Bridge

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.4`

## 목적

GitHub Pages·Firebase Hosting의 정적 Web을 모바일 Safari·Chrome과 카카오톡 외부 브라우저에서 사용하려면 FastAPI를 공개 HTTPS 주소로 제공해야 합니다. 휴대폰의 `localhost`는 개발 PC가 아니며, HTTPS Web에서 사설 HTTP API를 호출하면 mixed-content 정책에 막힐 수 있습니다.

```text
Mobile/PWA HTTPS
      │
      ▼
TLS reverse proxy or managed tunnel
      │ normalized X-Forwarded-* headers
      ▼
FastAPI 127.0.0.1:8000
      │ private service token + HMAC
      ▼
CosyVoice Worker private network
```

## 신뢰 경계

- FastAPI와 Worker를 같은 공개 경계에 직접 노출하지 않습니다.
- Worker는 API 뒤의 사설망에 두고 서비스 토큰과 HMAC 서명을 유지합니다.
- FastAPI는 **직접 연결한 peer IP가 `SORION_TRUSTED_PROXY_CIDRS` 안에 있을 때만** `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Forwarded-Host`를 사용합니다.
- reverse proxy는 외부 요청의 기존 `X-Forwarded-*` 값을 제거하고 자신이 계산한 값으로 다시 설정해야 합니다.
- forwarded header는 공개 Origin·rate-limit client IP를 계산하기 위한 입력이며 인증 수단이 아닙니다.
- 공개 Origin은 `SORION_CORS_ORIGINS`에 정확히 등록합니다.
- Web에는 `VITE_API_BASE_URLS` 또는 런타임 설정으로 HTTPS API 후보를 주입합니다.

## API 환경 설정

```env
SORION_ENVIRONMENT=production
SORION_CORS_ORIGINS=https://junl-im.github.io,https://your-web.example.com
SORION_PUBLIC_API_BASE_URLS=https://voice.example.com/api/v1
SORION_TRUSTED_PROXY_CIDRS=127.0.0.1/32,::1/128
SORION_SEGMENT_URL_TTL_SECONDS=900
SORION_SEGMENT_URL_SIGNING_SECRET=<32바이트 이상의 랜덤 Secret>
SORION_WORKER_SERVICE_TOKEN=<secret>
SORION_WORKER_SIGNATURE_SECRET=<secret>
```

여러 API 인스턴스가 같은 구간 URL을 검증해야 한다면 `SORION_SEGMENT_URL_SIGNING_SECRET`을 모든 인스턴스에 동일하게 배포합니다. Secret은 Web 빌드 변수나 저장소에 넣지 않습니다.

FastAPI는 loopback에만 바인딩합니다.

```bash
cd services/api
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Caddy 예시

Caddy와 FastAPI가 같은 호스트에서 실행되고 FastAPI가 Caddy의 loopback 연결만 신뢰하는 예시입니다.

```caddyfile
voice.example.com {
  reverse_proxy 127.0.0.1:8000 {
    header_up -X-Forwarded-For
    header_up -X-Forwarded-Proto
    header_up -X-Forwarded-Host
    header_up X-Forwarded-For {remote_host}
    header_up X-Forwarded-Proto {scheme}
    header_up X-Forwarded-Host {host}
  }
}
```

## Nginx 예시

```nginx
server {
    listen 443 ssl http2;
    server_name voice.example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_buffering off;
        proxy_read_timeout 120s;
    }
}
```

프록시가 별도 컨테이너·노드에 있다면 loopback 대신 **FastAPI가 실제로 보는 프록시 egress CIDR만** `SORION_TRUSTED_PROXY_CIDRS`에 추가합니다. `0.0.0.0/0` 또는 `::/0`는 사용하지 않습니다.

## Engine Doctor 판정

`GET /api/v1/connectivity`는 다음을 분리해 보여 줍니다.

- `public_https_ready`: 공개 호스트의 HTTPS 요청인지
- `public_api_origin`: 신뢰된 요청 경계에서 계산한 공개 Origin
- `public-https-bridge`: 공개 HTTPS Bridge 준비 상태
- `trusted-proxy`: 유효한 신뢰 proxy CIDR 설정
- `segment-audio-signing`: 구간 음원 고정 HMAC Secret과 URL 만료 설정

## 운영 점검

1. 모바일 네트워크에서 `https://<voice-host>/api/v1/health`를 확인합니다.
2. Engine Doctor에서 공개 HTTPS Bridge, 신뢰 reverse proxy, 구간 음원 서명을 확인합니다.
3. 외부에서 위조한 `X-Forwarded-Host`가 공개 Origin 판정을 바꾸지 못하는지 확인합니다.
4. 장문 TTS의 SSE에서 `segment-ready`가 도착하고 서명 URL이 재생되는지 확인합니다.
5. URL의 구간 번호·파일명·만료 시각을 변경했을 때 403 또는 410이 반환되는지 확인합니다.
6. CORS에 실제 정적 Web Origin만 포함됐는지 확인합니다.
7. Worker 포트가 공개 인터넷에서 직접 열리지 않았는지 확인합니다.

자동 정적 계약 검사는 다음으로 실행합니다.

```bash
npm run quality:partial-audio-bridge
npm run quality:preflight
```

## 금지

- 자체 서명 인증서나 공개 HTTP 주소를 준비됨으로 취급하지 않습니다.
- `SORION_TRUSTED_PROXY_CIDRS=0.0.0.0/0,::/0`처럼 모든 peer를 신뢰하지 않습니다.
- 사용자 제공 `X-Forwarded-*` 체인을 그대로 upstream에 전달하지 않습니다.
- 구간 서명 Secret, Worker Secret, 모델 경로, 사용자 음원을 진단 복사나 릴리스 ZIP에 넣지 않습니다.
- 서명 URL을 영구 다운로드 URL이나 CDN 공개 캐시 키로 사용하지 않습니다.
