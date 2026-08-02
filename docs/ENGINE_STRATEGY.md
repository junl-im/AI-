# SoriON AI Engine Strategy

현재 기준 버전: `0.9.2`

## 무료 로컬 고정 자동 순서

```text
1. CosyVoice Worker  한국어 주력 로컬 AI
2. MeloTTS           선택 설치형 로컬 대체
3. System Voice      설치 없는 WAV 대체
4. Browser Speech    정적 Web 재생 안전망
5. Mock              테스트 전용
```

일반 Web 요청은 항상 `engine_id=auto`를 사용한다. FastAPI는 등록된 엔진의 준비 상태, 요청 기능,
한국어 특화도, 품질 등급, 최근 실패 cooldown을 평가한다. 사용자에게 엔진 선택 UI를 제공하지 않는다.

## 배포 구조

```text
Firebase Hosting Spark / GitHub Pages
  ├─ Browser Speech
  └─ Desktop automatic localhost discovery
       └─ FastAPI Gateway
            ├─ CosyVoice Worker
            ├─ MeloTTS
            └─ System Voice
```

정적 호스팅은 Python이나 모델을 실행하지 않는다. 고품질 AI는 사용자 PC의 Worker에서 실행하고,
음성 원본과 모델 파일은 Git 저장소에 넣지 않는다.

## CosyVoice 준비 조건

- Worker `/ready` 성공
- 모델 경로와 필수 파일 확인
- 선택 모델 라이선스 확인
- 기준 음성 소유권과 명시적 동의
- GPU 또는 운영자가 허용한 CPU 프로필

조건이 충족되지 않으면 준비됨이나 추천 상태로 표시하지 않는다.

## 품질 결정 방식

“최고”라는 문구 대신 동일한 한국어 내용으로 다음 값을 측정한다.

- 숫자·날짜·단위·영문·고유명사 발음
- 문장 끝 억양과 문단 호흡
- 첫 음성 지연과 전체 실시간 배율
- 장문 중 실패율과 재시도 성공률
- 사용자 익명 블라인드 선호도

## 오케스트레이터 카탈로그

`GET /api/v1/engines/catalog`는 실제 자동 엔진과 연구 후보를 분리한다.

- 자동 채택: CosyVoice 3, MeloTTS, System Voice
- 선택 후처리: OpenVoice V2, DeepFilterNet3, Resemble Enhance
- STT·검수: Faster Whisper, 선택적 WhisperX, SenseVoice 벤치마크
- 연구 전용: F5-TTS 공식 pretrained checkpoint
- 한국어 자동 제외: Kokoro
- 외부 프로세스 플러그인: Seed-VC

세부 근거는 `docs/ENGINE_ORCHESTRATOR_BLUEPRINT.md`를 따른다.

## 절대 조건

- 결제 수단과 외부 음성 공급자 Secret을 요구하지 않는다.
- 허용 목록 밖 Adapter를 제품 소스에 넣지 않는다.
- 실제 모델이 준비되지 않으면 AI 성공으로 표시하지 않는다.
- 타인의 음성을 동의 없이 복제하지 못하게 한다.
- 실패한 엔진은 circuit breaker로 격리하고 다음 무료 엔진으로 전환한다.
