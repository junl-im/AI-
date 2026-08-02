# NEXT UPDATE

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 4`

## 목표 버전

`0.9.3-beta.3 · Engine Heartbeat 5 · Secure Mobile Bridge & First-Audio Latency`

## 핵심 기능

1. 카카오톡·모바일 외부 브라우저에서 사용할 공개 HTTPS Voice API 연결 절차와 진단을 정리한다.
2. 클릭부터 첫 음성 재생까지의 지연을 Browser·System·Melo·CosyVoice 경로별로 측정한다.
3. 실제 CosyVoice 모델·manifest·라이선스·프리셋 WAV 3종 onboarding 검사를 한 번에 제공한다.
4. 프리셋 WAV의 포맷·길이·샘플레이트·무음·클리핑을 Worker 요청 전에 검사한다.
5. 문장 생성 결과를 앞 구간부터 재생하는 partial-ready 경로를 실제 엔진에 연결한다.
6. 3단 PC 편집 화면의 패널 크기 조절과 접기 상태를 로컬에 저장한다.

## 출시 차단 조건

- 공개 HTTPS API 또는 실제 모델이 없는데 모바일 원격 엔진·CosyVoice를 준비됨으로 표시하지 않는다.
- 사용자 음원, 로컬 절대 경로, 토큰과 모델 파일은 진단 복사·저장소·릴리스 ZIP에 포함하지 않는다.
- 현재 녹색 CI와 Browser/System 즉시 대체 경로를 깨뜨리는 변경은 병합하지 않는다.
