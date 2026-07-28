# AUDIT REPORT v1.6.30

## 기능·브라우저

- 6명 동시 발화에서 RMS 에너지 상위 보조 화자 즉시 선별 통과
- 명시적인 주 화자 고정 통과
- 수동 페이지 subject ID 순서·다음 페이지 전환 통과
- slide 이전 페이지·현재 페이지·진행률 전달 통과
- fade·slide 최종 캔버스 합성 통과
- 선택 6개 cue에 grid crop X 14%, Y -9%, 확대 121% 일괄 적용 통과
- 일괄 변경 미리보기와 실제 patch 일치 통과
- 실제 20초 스마트 리프레임 전체 흐름 통과
- 실제 30분 1920×1080 crop 경계·9:16 비율·자막 안전 영역 통과
- 데스크톱·소형 노트북·태블릿·모바일 페이지·콘솔·Promise·런타임 오류 0건

## 메모리·자원

실미디어 5회 JS heap:

- cycle 1: 5.309MiB
- cycle 2: 5.550MiB
- cycle 3: 5.684MiB
- cycle 4: 5.781MiB
- cycle 5: 5.866MiB
- URL 생성 10개·해제 10개
- 종료 후 활성 URL 0개
- 매 회차 operation·render queue 잔류 0건

Chromium 프로세스 메모리:

- 초기 RSS: 772.865MiB
- 최종·최대 RSS: 876.131MiB
- 초기 USS: 243.633MiB
- 최종 USS: 290.102MiB
- JS heap 기울기: 0.008MiB/cycle
- 런타임 오류 0건

RSS는 browser·renderer·GPU·utility 캐시를 포함하므로 JS 누수 단독 판정값으로 사용하지 않습니다.

## CSS·구조

- CSS 파일 50개
- selector-property 충돌 0건
- 동일값 중복 0건
- shadow 선언 0건
- `!important` 593개
- 구조 후보 206건: 안전 167, 필수 26, 미확인 13

## 장시간 증빙

현재 실제 30분 1920×1080 집중 감사에서 24개 bounded spatial sample, motion track, caption-safe crop, 원본 경계와 9:16 비율을 확인했습니다. 15→30→15분 전체 harness는 첫 15분 분석·2초 렌더를 완료한 뒤 두 번째 파일 교체 정리 경계가 현재 실행 환경에서 멈춰 완주하지 못했습니다. 미디어 교체·분석 persistence·Render Queue·Object URL 소유권은 변경하지 않았으므로 기존 완주 증빙을 승계하고, 변경된 paging·transition renderer는 현재 단위·Chromium·30분 집중 감사로 별도 검증했습니다.

## 서비스워커·패키지

- 앱 셸 무결성 대상: 135개
- manifest SHA-256: `a1fb7c74e82b391ec0047be5d4422f93115265b0c1f56d6d0465b6c20a08088a`
- 전체 QA: 300/300
- 배포 파일: 1173개
- 패치 변경·추가: 49개
- 삭제: 0개
