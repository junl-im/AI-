# CHANGELOG

## v1.1.0 - Candidate Preview Pro

- 후보 탭에 `Candidate Pro Board` 추가.
- 상위 3개 후보를 점수/구간/길이 기준으로 빠르게 비교.
- 후보 정렬 버튼 추가: 점수순, 짧은 길이, 빠른 시작.
- 비교 카드 클릭 시 기존 후보 카드 선택 흐름으로 연결.
- 미리보기 탭에 선택 후보 HUD 추가.
- 선택 후보 HUD에서 후보 변경, 파형 조정, 저장 이동 가능.
- 기존 렌더 품질 프리셋과 저장 준비 체크리스트 유지.
- `candidate-preview-pro.css`, `candidate-preview-pro.js`, `candidate_preview_pro_smoke.js` 추가.
- QA 83개 통과.

## 유지 원칙

- 상단은 프로그램 소개와 브랜드만 표시.
- Dock은 작업 구간 이동만 담당.
- 파일 열기 후 자동 분석, 추천 생성 후 후보 선택, 후보 선택 후 미리보기 연결 흐름 유지.
- 화면 떨림 방지 구조는 `motion-stability.js` 중심으로 유지.
- 패치 정보는 문서에만 기록.
