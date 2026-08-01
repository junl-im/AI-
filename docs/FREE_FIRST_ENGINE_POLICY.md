# FREE-FIRST ENGINE POLICY

현재 기준 버전: `0.9.0`

## 목적

SoriON AI의 기본 사용자는 유료 공급자 계정이나 결제 수단 없이 음성 제작을 시작할 수 있어야
한다. 따라서 서버의 기본 정책은 `free-only`이며, 비용이 발생할 수 있는 TTS는 운영자가 명시적으로
허용하지 않는 한 등록·자동 선택·명시 호출 모두 차단한다.

## 기본 자동 순서

```text
CosyVoice Worker → MeloTTS → System Voice → Browser Speech
```

- CosyVoice Worker: 모델과 실행 환경을 사용자가 별도로 준비하는 무료 로컬 AI 후보
- MeloTTS: 설치돼 있을 때 사용하는 로컬 AI 후보
- System Voice: 운영체제 음성 합성기
- Browser Speech: 정적 Web에서 파일 없이 재생하는 마지막 안전망

`Mock`은 테스트 계약 전용이며 실제 음성 준비로 취급하지 않는다.

## 비용 정책

```env
SORION_ENGINE_COST_POLICY=free-only
```

- `free-only`: 과금형 Adapter를 registry에 등록하지 않고 자동·명시 요청 모두 차단
- `balanced`: 서버 운영자가 비용과 quota를 책임지는 경우에만 과금형 Adapter 등록 허용

과금형 후보는 NAVER CLOVA, Google Chirp, Azure Speech, ElevenLabs다. 키가 환경에 존재하더라도
`free-only`에서는 호출하지 않는다. Web에는 공급자 Secret과 정책 변경 UI를 제공하지 않는다.

## API 계약

- `/engines`: `cost_tier`, `auto_eligible` 반환
- `/engines/strategy`: `cost_policy`, `metered_engines_enabled`, `auto_order` 반환
- 자동 합성: 준비 상태, 기능 적합성, 비용 등급, 실패 cooldown을 함께 평가
- 명시 과금 엔진 요청: free-only에서는 503 사용 불가 오류

## 현실적인 품질 경계

무료라는 조건만으로 유료급 이상의 품질을 보장할 수는 없다. 고품질 로컬 AI는 모델 가중치,
CPU/GPU 자원과 설치 시간이 필요하다. SoriON은 특정 공급자를 과장하지 않고 동일 한국어 원고의
발음·억양·호흡·지연을 측정해 주력 엔진을 결정한다.
