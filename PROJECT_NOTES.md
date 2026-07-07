# PROJECT NOTES - v0.9.0 Modular Engine

## 판단

v0.8.x까지는 사용성, Dock, 자막, 컷 마커, 품질 패널을 계속 붙여 왔습니다. 이 상태에서 기능을 더 얹으면 `src/app.js`가 과도하게 커지고 분석/추천/렌더의 책임이 섞일 가능성이 큽니다.

그래서 v0.9.0에서는 기능 추가보다 엔진 구조 보강을 우선했습니다.

## 핵심 설계

### 1. Engine Kernel

`src/engine/engine-kernel.js`는 앱이 엔진에 접근하는 유일한 통합 진입점입니다.

```text
app.js
→ AIShortsEngineKernel
→ analysis-pipeline / scoring-pipeline / registry / budget
```

### 2. Module Registry

`module-registry.js`는 현재 등록된 엔진 모듈을 스냅샷으로 남깁니다. 향후 실제 플러그인 훅을 더 추가할 수 있습니다.

### 3. Performance Budget

`performance-budget.js`는 파일 크기, 길이, CPU 코어, deviceMemory를 보고 다음 세 가지 모드 중 하나를 고릅니다.

```text
safe      저사양/대용량 보호
balanced  기본값
max       고성능 기기용
```

### 4. Analysis Pipeline

오디오 분석, 영상 움직임 분석, 자동 컷 포인트 계산을 하나의 결과 객체로 묶습니다. 비디오 오디오 디코딩 실패 시에는 영상 분석 중심 fallback을 유지합니다.

### 5. Scoring Pipeline

기존 추천 엔진 결과에 품질 게이트를 더합니다.

- 무음 비율이 높으면 감점
- 비트/트랜지언트가 좋으면 가점
- 상승감이 좋으면 가점
- 움직임이 좋으면 가점
- 추천 카드에 엔진 배지 추가

## 주의

이번 패치는 “완전한 AI 모델”이 아니라 **모듈형 엔진 구조**입니다. 무료 브라우저 기반이라는 원칙은 유지합니다.

## 다음 추천

v1.0.0에서는 다음 중 하나를 선택하는 것이 좋습니다.

```text
A. 엔진 설정 UI
B. 얼굴/인물 중심 크롭 모듈
C. 자막 자동 생성 연결 준비
D. 렌더러 추상화 강화
```
