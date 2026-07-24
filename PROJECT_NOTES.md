# Project Notes v1.6.5

- `src/vision/smart-reframe-engine.js`는 편집 단계에서 지연 적재합니다.
- 공개 전역은 `AIShortsSmartReframe`이며 detector 등록, 모션 track 생성, 영상 피사체 분석, 시간 보간, 크롭 계산을 소유합니다.
- `registerMediaPipeFaceDetector(detector)`는 `detectForVideo(frame, timestampMs)` 계약만 받습니다.
- 추적 결과는 정규화 좌표와 비식별 요약만 보유하며 이미지 프레임을 저장하지 않습니다.
- 모션 분석 표본은 `motionX`, `motionY`, `spatialConfidence`, `motionSpread`, `motionBox`를 포함합니다.
- 미리보기와 최종 렌더는 반드시 `vertical-renderer`의 동일 `resolveCropRect` 경로를 사용합니다.
- 추적 모듈 미적재·추적점 부재 시 중앙 cover crop으로 복귀해야 합니다.
- 원본 교체는 `analysis`, `smart-reframe`, `preview`, `render` 작업을 모두 취소합니다.
- 프로젝트에는 `cropMode: smart`와 `captionAvoidance`, `smoothing`, `zoom` 옵션만 저장합니다.
- 다음 확장에서는 모델 팩 digest를 분석 signature에 포함하고, 화자 diarization 결과를 primary face 선택에 결합합니다.
