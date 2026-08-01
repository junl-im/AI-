# SoriON AI Engine Strategy

기준일: 2026-08-01

## 1. 왜 Python 백엔드인가

SoriON AI의 사용자 화면은 계속 React, Vite, TypeScript로 개발한다. Python은 화면을 만들기 위한 언어가 아니라 AI 음성 모델을 실행하는 엔진 서버에만 사용한다.

대부분의 고성능 TTS, 음성 복제, 음성 변환, STT 모델은 PyTorch, CUDA, Transformers, NumPy, librosa 계열 생태계를 사용한다. 모델 공식 추론 코드와 GPU 최적화 도구도 Python을 우선 지원한다. 따라서 다음 구조가 목표에 가장 적합하다.

```text
모바일 PWA · React/TypeScript
        ↓ HTTPS API
FastAPI 엔진 게이트웨이 · Python
        ↓ Engine Adapter
CosyVoice / GPT-SoVITS / Local fallback / Future Engine
```

프런트와 엔진 서버를 분리하면 모바일 앱 경험은 가볍게 유지하면서 GPU 서버, 로컬 PC, 클라우드 엔진을 교체할 수 있다.

## 2. 기본 엔진 결정

### 주력 엔진: Fun-CosyVoice 3

SoriON의 주력 TTS 및 제로샷 목소리 복제 엔진 후보는 `Fun-CosyVoice 3`으로 결정한다.

선정 이유:

- 한국어를 공식 지원한다.
- 짧은 참조 음성을 사용하는 제로샷 음성 복제를 지원한다.
- 다른 언어로 말하는 교차 언어 복제를 지원한다.
- 감정, 속도, 볼륨 등의 지시를 지원한다.
- 텍스트 입력과 음성 출력을 동시에 스트리밍할 수 있다.
- 공식 저장소는 첫 음성 지연을 최저 약 150ms로 안내한다.
- 코드 라이선스가 Apache-2.0이다.
- 공식 Python 3.10 설치와 FastAPI 배포 예제가 있다.

공식 자료:

- https://github.com/FunAudioLLM/CosyVoice

실제 상업 배포 전에 선택한 모델 가중치의 모델 카드와 사용 조건을 다시 검토한다.

### 복제 전문가 엔진: GPT-SoVITS

`GPT-SoVITS`는 짧은 샘플 복제와 사용자별 미세조정이 필요한 전문가 모드의 보조 엔진으로 유지한다.

- 5초 샘플 기반 제로샷 TTS를 공식 안내한다.
- 1분 데이터 기반 소량 학습을 지원한다.
- 한국어와 교차 언어 합성을 지원한다.
- 코드 라이선스는 MIT다.

공식 자료:

- https://github.com/RVC-Boss/GPT-SoVITS

### 로컬 대체 엔진: MeloTTS와 운영체제 음성

MeloTTS는 주력 음질 엔진이 아니라 GPU가 없는 개발·로컬 환경을 위한 한국어 대체 엔진으로 유지한다. 운영체제 음성은 AI 모델 설치가 전혀 되지 않은 환경의 최종 안전망이다.

### 평가 전용: Fish Audio S2

Fish Audio S2는 한국어와 빠른 음성 복제를 지원하는 고품질 비교 후보이지만, 현재 공식 라이선스는 상업 서비스에 별도 계약을 요구한다. 따라서 SoriON의 무료 상업 기본 엔진으로 자동 선택하지 않는다.

공식 자료:

- https://github.com/fishaudio/fish-speech
- https://github.com/fishaudio/fish-speech/blob/main/LICENSE

### 제외: Kokoro 기본 엔진

Kokoro는 가볍고 빠르며 Apache 계열 배포에 유리하지만 공식 언어 목록에 한국어가 없다. SoriON의 한국어 우선 주력 엔진으로 사용하지 않는다.

공식 자료:

- https://github.com/hexgrad/kokoro

## 3. 엔진 우선순위

```text
1. CosyVoice 3       주력 TTS + 제로샷 복제 + 스트리밍
2. GPT-SoVITS        복제 전문가 모드 + 사용자 미세조정
3. MeloTTS           CPU·개발 환경 한국어 대체
4. System Voice      설치 없는 최종 안전망
5. Fish Audio S2     라이선스 계약 전 평가 전용
```

## 4. 성능 목표

모바일 사용자가 느끼는 성능을 기준으로 측정한다.

- 페이지 상호작용 반응: 300ms 이내
- 생성 요청 접수 표시: 100ms 이내
- 스트리밍 첫 음성 목표: 1초 이내
- 짧은 문장 전체 생성 목표: 10초 이내
- 생성 취소 반영: 500ms 이내
- 긴 문장: 구간별 진행률과 실패 구간 재시도
- GPU 서버 미연결: 즉시 이유 표시 후 로컬 대체 엔진 제안

공식 엔진이 제시하는 벤치마크는 참고값이며 SoriON 자체 한국어 평가 세트와 실제 배포 장비에서 다시 측정한다.

## 5. 다음 구현 순서

1. Worker 모델 다운로드·체크섬·로딩 진행률
2. API↔Worker 서비스 인증과 요청 제한
3. SSE 재연결과 완료 구간 progressive playback
4. speaker prompt 캐시와 동의 철회 연동
5. 실제 GPU 한국어 음질·지연·VRAM 벤치마크
6. GPT-SoVITS 전문가 모드
7. 한국어 발음·감정·속도 A/B 벤치마크

## 6. 절대 조건

- 엔진 이름을 UI 핵심 흐름보다 앞세우지 않는다.
- 실제 모델이 준비되지 않았으면 AI 생성 성공으로 표시하지 않는다.
- 타인의 음성을 동의 없이 복제하지 못하게 한다.
- 음성 원본은 기본 로컬 보관이며 명시적 동의 없이 업로드하지 않는다.
- 엔진은 `Engine Adapter` 뒤에 두어 한 모델에 종속되지 않는다.
- 라이선스가 상업 사용을 제한하면 기본 엔진으로 자동 활성화하지 않는다.

## 0.7.0 Worker 실행 구조

FastAPI 게이트웨이는 Fun-CosyVoice 3 패키지와 PyTorch를 직접 로딩하지 않는다. 웹 요청, 동의 검증, 임시 샘플 수명 주기와 모델 추론을 분리한다.

```text
SoriON Web
  → FastAPI Gateway
    → consent and sample validation
    → profile UUID and job proxy
    → CosyVoice Worker
      → health and readiness
      → model and GPU lifecycle
      → sentence jobs and SSE progress
      → cross-lingual zero-shot synthesis
      → segment WAV and merged WAV
```

`SORION_COSYVOICE_WORKER_URL`이 비어 있거나 Worker `/ready`가 준비되지 않은 경우 복제 실행을 차단한다. `0.7.0`은 작업 생성·문장별 진행·취소·재시도·최종 WAV 전달 계약을 제공하며, 모델 가중치와 대형 AI 의존성은 일반 릴리스 ZIP에 포함하지 않는다.


## 0.7.1 운영 경계

CosyVoice Worker는 FastAPI와 분리된 GPU 실행 계층으로 유지한다. 공개 API만 인터넷에 노출하고
Worker는 사설 네트워크에 둔다. 두 서비스는 서비스 토큰과 HMAC-SHA256 요청 서명으로 연결한다.
모델 경로, 필수 파일, CUDA, VRAM, 디스크, CPU 저속 모드 정책을 readiness에 반영하며 조건이
충족되지 않으면 복제 성공으로 표시하지 않는다.

## 0.8.5 런타임 자동 오케스트레이션

제품 전략의 주력 엔진과 현재 서버에서 실제 실행 가능한 엔진을 구분한다. Fun-CosyVoice 3가
전략상 주력이더라도 Worker·모델·GPU가 ready가 아니면 일반 합성 후보로 가장하지 않는다. Web은
엔진 선택 UI를 제공하지 않고 `auto`를 보내며 FastAPI가 등록된 ready Adapter만 순위화한다.

기본 런타임 순서와 보호 정책은 환경변수로 조정한다.

```env
SORION_TTS_ENGINE_ORDER=cosyvoice3,melo,system,mock
SORION_ENGINE_FAILURE_THRESHOLD=2
SORION_ENGINE_COOLDOWN_SECONDS=30
```

- 준비된 AI 엔진을 Local·Mock보다 우선한다.
- 같은 모드에서는 설정 순서와 요청 기능 적합성을 반영한다.
- 실패하면 같은 요청에서 다음 후보로 전환한다.
- 연속 실패 임계치를 넘으면 cooldown 동안 자동 후보에서 제외한다.
- 명시 엔진 요청은 다른 엔진으로 조용히 대체하지 않는다.
- 실제 시도 엔진과 fallback 여부를 결과 메타데이터에 남긴다.

이 구조는 이후 CosyVoice 3 일반 TTS Adapter와 GPT-SoVITS 전문가 Adapter가 추가돼도 UI를
바꾸지 않고 운영 우선순위만 조정할 수 있게 한다.

## 0.8.9 한국어 Neural Engine Mesh

일반 합성은 UI가 아니라 FastAPI 오케스트레이터가 `auto`로 선택한다.

```text
CosyVoice 기준 음색
→ NAVER CLOVA Voice Premium
→ Google Chirp 3 HD Korean
→ Azure Korean Neural Voice
→ ElevenLabs v3 Korean
→ MeloTTS
→ System Voice
→ Mock
```

- CosyVoice는 준비된 Worker와 동의된 기준 음성 파일이 모두 있을 때만 일반 TTS 후보가 된다.
- Cloud Adapter는 서버 자격 증명이 있을 때만 ready가 된다.
- 감정·피치·속도 요청은 해당 기능을 실제 지원하는 엔진을 앞당긴다.
- 품질 등급과 한국어 특화도는 같은 운영 순위 안의 tie-breaker다.
- 연속 실패는 circuit breaker로 격리하고 다음 엔진으로 자동 전환한다.
- Secret과 공급자 API key는 Vite 환경변수나 GitHub Pages에 포함하지 않는다.
