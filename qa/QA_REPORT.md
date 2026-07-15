# QA Report - AI 쇼츠 제작 스튜디오 v1.2.0

## Summary

- Passed: 103/103
- Failed: 0/103
- Result: PASS

## v1.2.0 Focus

- 사용자 노출 명칭: 하단 `Dock`을 `메뉴바`로 변경
- 초기 응답성: 같은 값의 DOM 재작성과 Observer 피드백 루프 제거
- 프레임 안정성: 상태 시그니처가 같으면 동기화 작업 생략
- 관찰 범위: 자체 변경 속성을 다시 감지하지 않도록 후보·작업 공간 Observer 축소
- 캐시 일치: v1.2.0 빌드 키와 Update Sentinel의 현재 캐시 식별 통일
- 기존 화면: PC Prime 3열 작업실과 모바일 4단계 안내 유지

## Browser Responsiveness Probe

- 전체 54개 초기 스크립트를 Chromium에서 함께 실행
- DOMContentLoaded 완료, 페이지 오류 0건
- 초기 RAF: 25회 예약 / 25회 실행
- MutationObserver: 58회 콜백 / 138개 초기 변경 기록
- 400ms, 1초, 2초 지점에서 RAF·Mutation 수가 동일해 반복 증가가 멈춘 것을 확인
- 빌드 마커 `1.2.0`, 활성 메뉴 `file` 정상 확인

## Visual Layout Checks

- Desktop render: 1440x1000
- Mobile render: 390x844
- PC 3열 작업실과 하단 메뉴바 표시 확인
- 모바일에서 중복 불러오기 카드 없이 4단계 안내와 메뉴바 표시 확인

## Command

```bash
npm run check
```

## Remaining Manual E2E

실제 MP3·MP4를 사용한 자동 분석, 추천 생성, 후보 선택, 미리보기와 MediaRecorder 저장 과정은 사용자 브라우저와 실기기에서 추가 검증이 필요합니다.
