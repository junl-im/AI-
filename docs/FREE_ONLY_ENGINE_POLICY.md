# FREE-ONLY ENGINE POLICY

현재 기준 버전: `0.9.2`

## 고정 원칙

SoriON AI의 배포물에는 결제 계정, 외부 음성 공급자 키, 사용량 과금 Adapter를 포함하지 않는다.
정책을 바꾸는 숨은 환경변수나 사용자 UI도 두지 않는다. 서버에 등록 가능한 일반 TTS는 다음 네
종류뿐이다.

```text
CosyVoice Worker → MeloTTS → System Voice → Mock(test only)
Web fallback: Browser Speech
```

- CosyVoice Worker: 사용자 PC에서 선택 모델을 실행하는 주력 무료 AI 후보
- MeloTTS: 선택 설치형 CPU/GPU 로컬 대체 엔진
- System Voice: 운영체제 음성으로 WAV를 만드는 설치 없는 대체 엔진
- Browser Speech: 정적 Web에서 재생만 제공하는 기기 내장 안전망
- Mock: 테스트 전용이며 실제 음성 준비 상태로 표시하지 않음

## Firebase Spark 경계

Firebase Hosting Spark와 GitHub Pages는 정적 Web만 배포한다. Python FastAPI, 모델 추론,
WAV 병합은 사용자 PC의 로컬 런타임에서 실행한다. 데스크톱 Web은 로컬 API를 자동 탐색하며,
모바일 정적 Web은 Browser Speech를 사용한다.

## 자동 연결

- 정적 호스트 자체의 `/api`를 잘못 검사하지 않음
- 데스크톱 정적 Web은 `127.0.0.1:8000`과 `localhost:8000`을 자동 검사
- 모바일은 접근할 수 없는 localhost를 시도하지 않음
- API가 준비되면 `auto` 요청으로 CosyVoice·Melo·System 중 실행 가능한 엔진을 선택
- 실패한 엔진은 circuit breaker로 잠시 제외하고 다음 무료 엔진을 사용

## CI 경계

`scripts/check-free-only-boundary.mjs`는 다음을 차단한다.

- 허용 목록 밖의 TTS Adapter
- 외부 음성 공급자 Secret과 환경변수
- 비용 정책 전환 코드
- Firebase Functions·Cloud Run rewrite
- Web/API 계약에 다시 추가되는 비용 등급 필드
