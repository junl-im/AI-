# CHANGELOG

## v1.0.8 - Save Readiness Polish

- 후보 선택 후 미리보기 탭에 선택 후보 준비 스트립 추가.
- 저장 탭에 저장 전 체크리스트 패널 추가.
- 선택 구간, 길이, 자막 상태, 예상 용량 표시.
- 저장 전 후보/미리보기/편집으로 바로 이동하는 보조 버튼 추가.
- 기존 Motion Stability 구조를 유지해 Dock 이동 중 화면 떨림이 다시 생기지 않도록 조정.
- `save-readiness.css`, `save-readiness.js`, `save_readiness_smoke.js` 추가.
- QA 79개 통과.

## 유지 원칙

- 상단은 프로그램 소개와 브랜드만 표시.
- Dock은 작업 구간 이동만 담당.
- 파일 열기 후 자동 분석, 추천 생성 후 후보 선택, 후보 선택 후 미리보기 연결 흐름 유지.
- 패치 정보는 문서에만 기록.
