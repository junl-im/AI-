# WORKSPACE SESSION PERSISTENCE

현재 기준 버전: `0.8.7`

## 책임 분리

- 서버 작업 상태와 완료 결과: FastAPI SQLite JobStore
- 브라우저 편집 상태: IndexedDB `workspaceSessions`
- IndexedDB 차단 시: 크기가 제한된 localStorage fallback
- 두 저장소가 모두 막힌 경우: 현재 탭 메모리만 유지하고 사용자에게 알림

## 저장 항목

- 마지막 작업공간 진입 여부와 현재 메뉴
- 채팅 메시지와 전송 전 입력문
- 선택 보이스와 프롬프트 옵션
- 음성·쉼 블록, 순서, 문장, job ID, 진행 상태, 블록 revision

Object URL, Audio 객체와 Player track ID는 저장하지 않는다. 새로고침 후에는 job 결과를 서버에서
recover-first로 조회하고, Mock 결과는 저장된 문장으로 파형을 다시 만든다.

## 저장 수명과 제한

- schema version: 1
- 최대 메시지: 100개
- 최대 타임라인 블록: 240개
- 세션 수명: 45일
- 입력문: 500자
- 저장은 450ms debounce하고 `pagehide`·백그라운드 전환에서는 localStorage 비상 체크포인트를 동기 기록한 뒤 IndexedDB로 승격한다.

## 충돌 방지

세션에는 증가하는 revision을 기록한다. 늦게 끝난 저장이 더 최신 revision을 덮지 못하도록
IndexedDB transaction과 fallback 저장소 모두 기존 revision을 비교한다.

각 음성 블록에도 revision이 있다. 생성 시작 시 revision을 캡처하고 응답 도착 시 현재 값과 다시
비교한다. 사용자가 생성 중 문장을 수정했다면 오래된 결과는 Player와 타임라인에 연결하지 않는다.

## 모바일 예외

- React StrictMode의 Effect 재실행에서도 하나의 load Promise를 공유한다.
- 빈 작업공간 진입 상태와 선택 옵션도 복원하며 `새로 만들기`는 이전 세션을 지운 뒤 빈 상태를 다시 저장한다.
- 사용자가 복원 완료 전에 입력을 시작하면 저장된 과거 세션으로 현재 입력을 덮지 않는다.
- iOS private mode처럼 IndexedDB가 거부되면 localStorage로 낮춘다.
- localStorage까지 quota 또는 보안 오류가 나면 메모리 모드로 낮추고 안내한다.
- 만료된 서버 job은 자동 재생성하지 않고 해당 블록에 재생성 동작을 남긴다.
