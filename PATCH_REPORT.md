# PATCH REPORT v1.6.30

## 변경 범위

- `src/vision/smart-reframe-engine.js`: cue 에너지, energy/manual paging, 이전 페이지·transition progress
- `src/vision/speaker-face-linker.js`: segment RMS/energy 정규화·병합
- `src/render/vertical-renderer.js`: grid page fade·slide 합성
- `src/app.js`: 오디오 프레임 에너지 집계, manual page UI, transition 설정, grid crop bulk patch
- `src/project/project-service.js`: energy·manual pages·transition bounded allowlist 저장·복구
- `src/state/app-state.js`: 신규 speaker layout 기본값
- `index.html`, `assets/css/smart-reframe.css`: paging·transition·manual page·bulk crop 컨트롤
- 신규 QA: energy paging, manual pages, transition render, bulk grid crop, Chromium paging audit

## 안전성

- cue 에너지는 0~1, 전환 시간은 120~1200ms로 제한합니다.
- 수동 페이지는 최대 12개, 페이지당 최대 4개 subject ID만 허용합니다.
- 임의 문자열과 prototype 키는 프로젝트 경계에서 제거합니다.
- 에너지 paging은 기존 최대 4인 렌더 상한을 유지합니다.
- fade·slide는 기존 렌더 프레임 시간을 사용하며 신규 RAF·interval을 추가하지 않습니다.
- Object URL·Preview Controller·Render Queue·Download Service 소유권을 변경하지 않았습니다.
- v1.6.29 프로젝트는 신규 필드가 없으면 기존 rotate·transition 없음 기본값으로 복구됩니다.

## 최종 검증

- 전체 QA: 300/300, 실패 0건
- 6개 샤드: 50/50 × 6
- 실미디어 5회 JS heap: 5.309 → 5.866MiB
- URL 생성 10개·해제 10개, 종료 후 활성 0개
- Chromium RSS: 772.865 → 876.131MiB
- JS heap 기울기: 0.008MiB/cycle
- CSS 충돌·동일값 중복·shadow: 0건
- 구조 probe: 안전 167, 필수 26, 미확인 13
- 서비스워커 무결성 대상: 135개 자산
- manifest SHA-256: `a1fb7c74e82b391ec0047be5d4422f93115265b0c1f56d6d0465b6c20a08088a`

## 배포 범위

- v1.6.29 대비 변경·추가: **49개**
- 신규 파일: **27개**
- 수정 파일: **22개**
- 삭제 파일: **0개**
- 최종 프로젝트: **1173개 파일**
