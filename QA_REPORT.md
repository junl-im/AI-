# QA Report v1.6.24

## 현재 버전 재검증
- 신규 dual-speaker focus·renderer·역할·일괄 교정·신뢰도 이력 회귀 통과
- 실제 Chromium 스마트 리프레임 감사 통과
  - 겹침 cue 3개 상태에서 `speaker-dual-face` 활성화
  - primary/secondary pane 순서 확인
  - 서로 다른 두 subject 유지
  - 연결 신뢰도 이력 UI 확인
- 4개 viewport page/console/Promise/runtime 오류 0건
- CSS 50개, selector-property 충돌 0건, 동일값 중복 0건, shadow 0건, `!important` 593개
- 5회 실미디어 heap/Object URL 감사
  - JS heap: `5.103 → 5.618MiB`
  - 매 회차 operation 0건
  - 종료 후 활성 다운로드 URL 0개
- Chromium 프로세스 메모리
  - RSS: `769.519 → 846.660MiB`
  - JS heap 기울기: `0.0052MiB/cycle`
  - 런타임 오류 0건
- 실제 30분 1920×1080 스마트 리프레임 집중 감사 통과
- 서비스워커 콘텐츠 무결성 통과
- manifest 자산: 135개
- manifest SHA-256: `59c3f4c6b0225b25c3eba8a8bfb8a1a03232ded205b880bcd3732015e52e0175`

## 대형 감사 범위
- 변경된 overlap-only dual-speaker render 경로는 현재 v1.6.24 Chromium 감사와 단위 renderer 감사에서 새로 실행했습니다.
- 정상 단일-focus decode/render queue·15→30→15분 교체 경로는 변경하지 않아 v1.6.23 완주 증빙을 승계합니다.
- 현재 v1.6.24에서는 30분 1080p 집중 감사, 5회 heap, process memory를 별도로 재검증했습니다.

## 전체 회귀
- 등록 검사: **281개**
- 8개 샤드: **36/36 + 35/35 × 7**
- 최종 결과: **281/281 통과, 실패 0건**
