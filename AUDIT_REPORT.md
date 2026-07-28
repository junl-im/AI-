# AUDIT REPORT v1.6.32

## 기능·브라우저

- 수동 페이지 초기 시간 2초·5초 복구 통과
- 두 번째 페이지 6초 변경과 누적 cycle 8초 순환 통과
- 페이지 내부 화자 `subject-1,2,3` → `subject-2,1,3` 순서 변경 통과
- 활성 화자 6명의 에너지 막대 표시 통과
- 현재 grid 선택 화자 4명 표시 통과
- 신규 화자 hold 0.7초 남음 표시 통과
- 실제 20초 스마트 리프레임 전체 흐름 통과
- 실제 30분 1920×1080, 24개 bounded sample, caption-safe 9:16 crop 통과
- 4개 viewport 페이지·콘솔·Promise·런타임 오류 0건

## 메모리·자원

실미디어 5회 JS heap:

- cycle 1: 5.385MiB
- cycle 2: 5.581MiB
- cycle 3: 5.692MiB
- cycle 4: 5.783MiB
- cycle 5: 5.880MiB
- dispose 후: 5.902MiB
- URL 생성 10개·해제 10개
- 종료 후 활성 URL 0개
- 매 회차 operation·render queue 잔류 0건
- JS heap 기울기: 0.119MiB/cycle

Chromium 프로세스 메모리:

- 초기 RSS: 770.180MiB
- 최종·최대 RSS: 836.062MiB
- warm median RSS: 800.917MiB
- final median RSS: 804.851MiB
- 초기 USS: 243.481MiB
- 최종 USS: 266.637MiB
- JS heap 기울기: 0.0052MiB/cycle
- 런타임 오류 0건

RSS는 browser·renderer·GPU·utility 캐시를 포함하므로 JS 누수 단독 판정값으로 사용하지 않습니다.

## CSS·구조

- CSS 파일 50개
- selector-property 충돌 0건
- 동일값 중복 0건
- high-risk 충돌 0건
- shadow 선언 0건
- `!important` 593개
- 구조 후보 206건: 안전 166, 필수 27, 미확인 13

## 장시간 증빙

현재 실제 30분 1920×1080 집중 감사에서 24개 bounded spatial sample, motion track, caption-safe crop, 원본 경계와 9:16 비율을 확인했습니다. 15→30→15분의 미디어 교체·분석 persistence·Render Queue·Object URL 소유권은 이번 변경에서 수정하지 않아 v1.6.31 증빙을 승계했습니다. 변경된 페이지 시간·화자 순서·energy 상태 경로는 현재 단위·Chromium·30분 집중 감사로 별도 검증했습니다.

20회 힙 감사는 10회까지 정상 진행된 뒤 실행 제한으로 종료되어 배포 판정에서 제외했습니다. 완주한 5회 감사만 최종 증빙으로 사용했습니다.

## 서비스워커·패키지

- 앱 셸 무결성 대상: 135개
- manifest SHA-256: `29809a1637112e3db0fab5b825dcc75b418e186fdfeaba083f993d5a8a184c6f`
- 전체 QA: 307/307
- 배포 파일: 1224개
- 패치 변경·추가: 48개
- 삭제: 0개
