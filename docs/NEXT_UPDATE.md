# NEXT UPDATE

현재 기준 버전: `0.8.4 Automatic Engine Bootstrap & Project Restore`

## 목표 버전

`0.8.5 Mobile Workspace Session Persistence`

## 방향

0.8.4에서 사용자의 수동 API 연결을 제거하고 최근 프로젝트를 편집 화면으로 불러오는
기본 경로를 복구했다. 다음 패치는 현재 열린 채팅·타임라인 세션 전체를 IndexedDB에
저장해 새로고침과 PWA 종료 뒤에도 별도 프로젝트 선택 없이 이어서 작업하게 한다.

## 1. 작업공간 자동 저장

- 채팅 메시지, 음성·쉼 블록, 순서와 생성 옵션 저장
- 선택 보이스, 블록별 job ID, status와 revision 저장
- debounce 저장과 schema version 마이그레이션
- 저장 실패를 생성·재생 오류와 분리한 degraded mode

## 2. 앱 재시작 자동 복원

- 새로고침·화면 잠금·탭 종료 뒤 마지막 작업공간 자동 복원
- queued·generating 블록은 서버 상태와 `/result`를 먼저 조회
- Object URL은 저장하지 않고 서버 URL 또는 저장 Blob으로 재구성
- 복원 중 오래된 결과가 사용자가 수정한 블록을 덮지 않도록 revision 검사

## 3. 프로젝트 수명과 저장 용량

- 최근 프로젝트 수 제한과 사용자가 고정한 프로젝트 구분
- quota 초과, IndexedDB 차단, iOS 데이터 정리 감지
- 프로젝트 삭제와 원본 음성 삭제를 별도 동작으로 유지
- 만료된 서버 음원은 자동 재생성하지 않고 블록별 재생성 안내

## 4. 실기기 검증

- Android Chrome, iOS Safari, 설치형 PWA
- Wi-Fi→셀룰러, 화면 잠금, 탭 종료, API 재시작
- 동일 job 중복 POST 0회와 결과 복구 시간 측정
- private mode와 저장 용량 부족 fallback

## 5. 이후 순서

1. 엔진 readiness·queue·지연·최근 실패 운영 schema
2. 공개 HTTPS API access token과 사용자별 job 소유권
3. 편집 순서·쉼을 반영한 WAV Export
4. ready 블록 자동 연속 재생과 Worker segment SSE
5. 실제 ScriptGenerationEngine과 외부 전송 동의

## 이번 패치에서 넘기는 결정

- API와 엔진은 앱이 자동 연결하며 사용자 설정 화면을 다시 만들지 않는다.
- 최근 프로젝트 선택 복원과 마지막 작업공간 자동 복원은 별도 단계로 유지한다.
- 서버 job 결과는 SQLite, 브라우저 편집 세션은 IndexedDB가 담당한다.
- 복원 실패를 이유로 같은 합성 POST를 무조건 다시 보내지 않는다.
