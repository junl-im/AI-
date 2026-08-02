# NEXT UPDATE

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 3`

## 목표 버전

`0.9.3-beta.3 · Engine Heartbeat 4 · Secure Mobile Bridge & First-Audio Latency`

## 핵심 기능

1. 카카오톡·모바일 외부 브라우저에서 사용할 공개 HTTPS Voice API 연결 절차를 free-only 범위에서 정리하고 연결 검증을 자동화한다.
2. 실제 CosyVoice 모델·manifest·라이선스·프리셋 WAV 3종을 한 번에 검사하는 로컬 onboarding 실행기를 제공한다.
3. 프리셋 WAV의 포맷·길이·샘플레이트·무음·클리핑을 검사하고 잘못된 파일은 Worker 요청 전에 차단한다.
4. 클릭부터 첫 음성 재생까지의 first-audio latency를 측정해 System·Browser·Melo·CosyVoice 경로별로 표시한다.
5. 문장 생성 결과를 앞 구간부터 재생하는 streaming/partial-ready 경로를 실제 엔진에 연결한다.
6. Engine Doctor에서 모바일 localhost, mixed content, CORS, Worker readiness 문제에 맞는 조치만 우선 표시한다.

## 출시 차단 조건

- 실제 모델과 공개 HTTPS API가 없는데 CosyVoice 또는 모바일 원격 엔진을 준비됨으로 표시하지 않는다.
- 사용자 음원, 로컬 절대 경로, 서비스 토큰과 모델 파일은 진단 복사·저장소·릴리스 ZIP에 포함하지 않는다.
- 기존 녹색 CI와 Browser/System 즉시 대체 경로를 깨뜨리는 변경은 병합하지 않는다.

## 이후

Engine Heartbeat 4가 녹색으로 통과하면 `0.9.3-rc.1 Production Evidence Gate`에서 실기기 15개 시나리오와 10·30·60분 실제 음성 증거를 수집한다.
