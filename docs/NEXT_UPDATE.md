# NEXT UPDATE

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 5`

## 목표 버전

`0.9.3-beta.3 · Engine Heartbeat 6 · Partial Audio Delivery & Bridge Hardening`

## 핵심 기능

1. 첫 문장 WAV가 준비되면 최종 병합을 기다리지 않고 segment-ready 이벤트와 제한된 audio URL로 Web에 전달한다.
2. `HTMLAudioElement.playing`, 첫 byte, Browser Speech `onstart`를 수집해 서버 준비와 실제 재생 시작을 분리한다.
3. 신뢰 reverse proxy allowlist와 forwarded header 정규화를 추가해 공개 Bridge 진단의 spoofing 가능성을 줄인다.
4. Caddy·Nginx·관리형 tunnel 배포 예시와 CORS·HMAC·rate-limit 운영 검사를 자동화한다.
5. 실제 CosyVoice 모델·프리셋 3종으로 첫 구간 지연, 전체 RTF, 실패율과 모바일 재생 증거를 기록한다.
6. PC 패널 조절·접기·좁은 데스크톱의 Web 컴포넌트·시각 회귀 테스트를 추가한다.

## 예상 변경 영역

- API job/SSE/result schema와 임시 segment audio 접근 정책
- Web generation queue, Linked Player Dock, Browser Speech playback telemetry
- connectivity middleware, proxy trust 설정과 배포 문서
- API·Web 테스트, 실기기 evidence와 CI npm lock 검증

## 선행 조건과 위험

- 공개 HTTPS 도메인과 reverse proxy, 실제 CosyVoice 모델·GPU, 동의받은 프리셋 WAV가 필요합니다.
- segment URL은 만료·권한·작업 ID 경계를 지켜야 하며 사용자 원문이나 로컬 경로를 노출하면 안 됩니다.
- 모바일 autoplay 정책 때문에 파일 준비와 자동 재생은 다를 수 있습니다.
- 전달본에는 npm lock과 설치 의존성이 없으므로 Web 전체 품질은 검증된 lock이 준비된 CI에서 확정합니다.

## 넘기는 결정

- Heartbeat 5의 `first_audio_ms`는 서버 첫 파일 준비 시간으로 고정합니다.
- Browser Speech는 실제 `onstart`를 측정하기 전까지 `null`을 유지합니다.
- forwarded header는 Heartbeat 5에서 진단 전용이며 권한 판정에 사용하지 않습니다.
- partial-ready 실제 재생은 구현된 것으로 표시하지 않고 Heartbeat 6 출시 차단 항목으로 유지합니다.
