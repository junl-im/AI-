# ARCHITECTURE

## 전체 구조

```text
Mobile PWA
  → API Client
    → FastAPI Gateway
      → Engine Registry
        → Kokoro / CosyVoice2 / Whisper / Future Engine

Mobile PWA
  → IndexedDB                  기본 로컬 저장
  → Firebase Auth/Firestore    선택형 계정·동기화
```

## 경계

### Web

화면, 사용자 입력, 로컬 프로젝트, 재생과 다운로드를 담당한다. AI 모델의 구체적인 구현을 알지 못한다.

### API

인증된 요청 검증, 작업 생성, 엔진 선택, 오류 표준화, 관측 가능성을 담당한다.

### Engine Adapter

각 모델의 입력과 출력을 SoriON 공통 계약으로 변환한다. 엔진별 옵션은 공통 옵션과 `advanced_options`로 분리한다.

## 의존 방향

- 페이지는 API 구현이 아니라 계약 타입에 의존한다.
- 엔진 구현은 레지스트리에 등록되며 라우터가 직접 import하지 않는다.
- Firebase는 선택형 인프라이고 제품 핵심 로직의 필수 의존성이 아니다.
- 사용자 음성 파일은 기본적으로 로컬에서 시작한다.

## 확장 원칙

- 긴 작업은 향후 작업 큐로 분리한다.
- API 응답은 즉시 작업 ID를 반환할 수 있어야 한다.
- GPU 작업자는 API 프로세스와 분리할 수 있어야 한다.
- 음성 파일 저장소는 로컬, 객체 스토리지, 외부 제공자를 교체할 수 있어야 한다.
