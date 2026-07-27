# QA Report v1.6.15

## 등록 품질 게이트

- 총 검사: **259개**
- 신규 핵심 검사: Preview Controller 수명주기, 모델 캐시 dry-run·수동 정리·저장소 진단
- 실행 방식: 결정적 4개 샤드
- 검사별 기본 timeout: 180초
- 최종 샤드 결과: **65/65, 65/65, 65/65, 64/64**
- 합계: **259/259 통과, 실패 0건**
- 직접 시작 스크립트: **49개**로 기존 성능 예산 유지

## 신규 회귀 범위

- 정지 화면 RAF 중복 예약 방지와 단일 소유권
- 재생 RAF·완료 감시 interval·preview operation token의 공통 teardown
- 재생 거절, stale 작업, 수동 중단, 페이지 종료 시 잔류 작업 0건
- dispose 이후 새 미리보기 예약 차단
- 모델 팩 전용 Cache Storage의 비삭제 dry-run 검사
- origin 사용량·quota·가용 공간, 설치 모델 용량, 고아 개수·추정 용량 결합 진단
- 사용자 명시 수동 고아 캐시 정리와 등록 모델 보존
- feedback UX의 shell 단계 지연 적재와 직접 시작 스크립트 예산 보존
- 최종 소스 기준 서비스워커 SHA-256 매니페스트 재생성·변조 복구

## 회귀 보존 범위

- 모델 팩 설치 전 quota 점검과 고아 자동 회수
- 트랜잭션 모델 설치와 부분 캐시 rollback
- CPU/GPU backend 전환 실패 복구와 이전 모델 롤백 대상 보존
- 스마트 리프레임 다중 피사체·화자·직접 크롭·키프레임
- 프로젝트·세션 복구와 저장소 안전 정리
- 렌더 큐 cancel/retry, Object URL 상한과 dispose
- 서비스워커 단일 응답·캐시 범위·업데이트 소유권·무결성 복구

## 브라우저·성능 결과

- Chromium 데스크톱 1366×768, 소형 노트북 1280×720, 태블릿 1024×768, 모바일 390×844
  - page error 0, Promise rejection 0, console error 0, runtime error 0
  - body/html 가로 overflow 0
- CSS: 50개 파일, 공유 selector 192개, selector-property 충돌 0, 동일값 중복 0, shadow 0, `!important` 593개
- 구조 우선순위 probe: 후보 206개, 제거 안전 166개, 유지 필요 27개, 미확인 13개, 실행 오류 0
- 실미디어 5회: JS heap **4.927 → 5.475MiB**, 회차별 작업 소유권 잔류 0건
- Object URL: 생성 10개, 종료 전 해제 8개, dispose 후 해제 10개·활성 0개
- 프로세스 보조 감사: runtime error 0, JS heap slope 0.009MiB/cycle
  - RSS 772.680 → 871.439MiB, slope 14.1156MiB/cycle은 Chromium 워밍업·프로세스 캐시를 포함하므로 단독 누수 판정값으로 사용하지 않음
- 20초 실영상 스마트 리프레임: 20/20 항목 통과
- 30분 1920×1080 스마트 리프레임: 12/12 항목 통과, 24개 제한 샘플, crop 경계·세로 비율 정상
- GPU/media 보조 감사: 양 모드에서 미디어 decode·GPU process·media utility 관찰, runtime error 0
  - headless 환경에서는 물리 GPU 가속 여부를 확정하지 못함

## 장시간 미디어 증빙 제한

15→30→15분 전체 분석·렌더 안정성 아티팩트는 이번 변경이 decode, 분석 버퍼, 렌더 큐, 다운로드 Object URL 경로를 수정하지 않아 기존 실측을 승계했습니다. 이번에 변경된 미리보기 수명주기는 독립 동적 회귀와 5회 실미디어 힙 감사로, 스마트 리프레임 경로는 현재 v1.6.15의 30분 1080p 감사로 재검증했습니다.

## 결과 파일

- `qa/qa-run-final-summary.json`
- `qa/qa-run-shard-1-v1.6.15.json` ~ `qa/qa-run-shard-4-v1.6.15.json`
- `qa/runtime-*-v1.6.15.json`
