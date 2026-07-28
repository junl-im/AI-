# QA REPORT v1.6.32

## 신규·갱신 검사

- `speaker_manual_page_duration_smoke.js`
- `speaker_manual_page_editor_smoke.js`
- `run_speaker_page_timing_audit.py`
- `speaker_page_timing_browser_smoke.js`
- 갱신된 `speaker_face_project_smoke.js`
- 갱신된 `run_speaker_paging_v1631_audit.py`

## 최종 결과

- 전체 등록 검사: 307개
- 통과: 307개
- 실패: 0개
- 구간: 100/100 + 100/100 + 40/40 + 43/43 + 24/24
- 집계 파일: `qa-run-final-summary.json`

## 현재 버전 증빙

- 수동 페이지 시간 [2, 5] 복구와 [2, 6] 변경 통과
- 2.2초에서 두 번째 페이지 선택·8.2초에서 첫 페이지 순환 통과
- 페이지 내부 subject 순서 변경 통과
- 활성 화자 에너지 6개 행과 선택 화자 4개 표시 통과
- 신규 화자 hold 0.7초 남음 표시 통과
- 실제 20초 스마트 리프레임 전체 감사 통과
- 실제 30분 1920×1080 집중 감사 통과
- 실미디어 5회 JS heap 5.385 → 5.581 → 5.692 → 5.783 → 5.880MiB
- URL 생성 10개·해제 10개, 종료 후 활성 0개
- Chromium RSS 770.180 → 836.062MiB
- Chromium USS 243.481 → 266.637MiB
- JS heap 기울기 0.0052MiB/cycle
- CSS 충돌·동일값 중복·shadow 0건
- 구조 probe 안전 166·필수 27·미확인 13
- 서비스워커 무결성 대상 135개

15→30→15분 전체 미디어 교체·Render Queue·Object URL 경로는 변경되지 않아 v1.6.31 증빙을 승계했습니다. 변경된 페이지 시간·화자 순서·energy status 경로는 현재 단위·Chromium·실제 30분 감사에서 별도 검증했습니다.
