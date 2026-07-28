# QA REPORT v1.6.30

## 신규 검사

- `speaker_energy_paging_smoke.js`
- `speaker_grid_manual_pages_smoke.js`
- `speaker_grid_transition_render_smoke.js`
- `speaker_grid_bulk_crop_smoke.js`
- `run_speaker_paging_v1630_audit.py`
- `speaker_paging_browser_audit_smoke.js`

## 최종 결과

- 전체 등록 검사: 300개
- 통과: 300개
- 실패: 0개
- 샤드: 50/50 × 6

## 현재 버전 증빙

- 6명 동시 발화 RMS energy 즉시 paging 통과
- 주 화자 고정과 수동 페이지 순서 통과
- slide transition 이전/현재 page와 progress 통과
- 선택 cue grid crop 일괄 미리보기·적용 통과
- 실제 20초 스마트 리프레임 전체 감사 통과
- 실제 30분 1920×1080 집중 감사 통과
- 실미디어 5회 JS heap 5.309 → 5.550 → 5.684 → 5.781 → 5.866MiB
- URL 생성 10개·해제 10개, 종료 후 활성 0개
- Chromium RSS 772.865 → 876.131MiB
- JS heap 기울기 0.008MiB/cycle
- CSS 충돌·동일값 중복·shadow 0건
- 구조 probe 안전 167·필수 26·미확인 13
- 서비스워커 무결성 대상 135개

15→30→15분 전체 harness는 현재 환경에서 두 번째 교체 정리 경계가 멈춰 기존 완주 증빙을 승계했습니다. 변경된 paging·transition 경로는 현재 단위·Chromium·실제 30분 감사에서 별도 검증했습니다.
