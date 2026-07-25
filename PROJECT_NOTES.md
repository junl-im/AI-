# Project Notes v1.6.12

## 소유권

- `src/vision/vision-model-pack-manager.js`: 설치, SHA-256 검사, 활성화, 벤치마크, 추천, 롤백
- `src/ui/vision-model-pack-panel.js`: 사용자 조작과 상태 표시
- `assets/css/smart-reframe.css`: 모델 팩 진단 UI 배치

## 안전 규칙

- 벤치마크는 로컬 합성 프레임만 사용합니다.
- 외부 URL 요청을 만들지 않습니다.
- 활성화 실패 시 이전 팩도 다시 SHA-256 검사합니다.
- 이전 팩이 없거나 손상된 경우 자동 복구를 가장하지 않고 오류를 표시합니다.
