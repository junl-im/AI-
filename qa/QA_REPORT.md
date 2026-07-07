# QA REPORT - AI Shorts Studio v0.4.0

## 자동 검수 결과

```text
AI Shorts Studio QA summary
  Passed: 29/29
  Failed: 0/29
```

## 실행 명령

```bash
npm run check
```

## 통과 항목

- JavaScript syntax check
  - config
  - state
  - utils
  - audio feature extractor
  - video motion analyzer
  - recommendation engine
  - caption service
  - project service
  - vertical renderer
  - download service
  - waveform view
  - timeline view
  - UX controls
  - range drag controls
  - site guards
  - runtime health
  - analysis worker
  - service worker
  - main app
- 중복 함수 선언 smoke test
- 외부 CDN/외부 dependency 미사용 smoke test
- 기본 HTML anchor smoke test
- UI/UX anchor smoke test
- advanced editor anchor smoke test
- recommendation engine smoke test
- render capability smoke test
- docs/handoff smoke test
- caption service smoke test
- project service smoke test

## v0.4.0 수동 검수 체크리스트

- 파일 열기 버튼 동작
- 빠른 길이 칩 동작
- 분석 후 추천 카드 생성
- 추천 카드 선택 시 파형과 도크 상태 갱신
- 파형 위 선택 구간 표시
- 선택 구간 전체 드래그 이동
- 시작 핸들/끝 핸들 조절
- 현재 재생 위치로 시작 맞춤
- 숫자 입력 기반 구간 적용
- 1초 미세 조절 버튼
- 썸네일 템플릿 4종 전환
- 템플릿이 미리보기/썸네일/내보내기에 반영
- 자막 붙여넣기 및 SRT/VTT 업로드
- 자막 스타일/싱크 보정
- 썸네일 PNG 저장
- 추천 후보 일괄 내보내기
- 프로젝트 JSON 저장/불러오기
- 진단 복사
- 모바일 하단 액션바

## 알려진 환경별 주의사항

- Chrome 계열: WebM 내보내기 안정적
- Safari/iOS: MediaRecorder, captureStream 제한 가능
- 인앱 브라우저: 다운로드/복사 권한 제한 가능
- 여러 후보 일괄 저장: 브라우저가 다중 다운로드 허용을 요청할 수 있음
