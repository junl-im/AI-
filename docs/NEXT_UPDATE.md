# NEXT UPDATE

현재 기준 버전: `0.8.3 Persistent Job Store/Atomic Claim`

## 목표 버전

`0.8.4 Mobile Session Persistence`

## 방향

서버 job ID와 완료 결과가 재시작을 견디게 됐으므로 다음 패치는 모바일 편집 세션을
IndexedDB에 저장하고 PWA 종료·새로고침 뒤 기존 job에 recover-first로 다시 연결한다.
엔진 운영 진단과 공개 인증은 세션 복원 계약을 고정한 다음 진행한다.

## 1. 타임라인 IndexedDB 저장

- 채팅 메시지, 음성·쉼 블록, 순서와 생성 옵션 저장
- 블록별 job ID, status, engine ID, result URL 메타데이터 유지
- debounce 저장과 schema version 마이그레이션
- localStorage fallback은 API 주소에만 유지하고 편집 세션 오류와 분리
- 저장 실패가 생성·재생 전체를 중단하지 않도록 degraded mode 제공

## 2. PWA 종료 뒤 recover-first 복원

- 새로고침·화면 잠금·탭 종료 뒤 마지막 프로젝트 자동 복원
- queued·generating 블록은 서버 상태와 `/result`를 먼저 조회
- 서버 404·410·terminal 상태에서만 새 job ID 생성
- 사라진 Object URL은 서버 결과 URL 또는 저장 Blob으로 교체
- 복원 중 오래된 응답이 수정된 블록을 덮지 않도록 revision 검사

## 3. 저장 수명과 사용자 안내

- 프로젝트 TTL과 최근 프로젝트 수 제한
- 저장 용량 부족, private mode, iOS 데이터 정리 감지
- 자동 정리 대상과 사용자가 보존한 프로젝트를 구분
- 프로젝트별 API 주소·선택 보이스·최근 성공 엔진 복원
- 로컬 데이터 삭제와 음성 원본 삭제를 별도 동작으로 유지

## 4. 모바일 실기기 검증

- Android Chrome, iOS Safari, 설치형 PWA 매트릭스
- Wi-Fi→셀룰러, 화면 잠금, 탭 종료, API 재시작 시나리오
- 동일 job 중복 POST 0회, 결과 복구 성공률과 복구 시간 측정
- IndexedDB 차단·quota 초과·private mode fallback
- 느린 네트워크에서 복원 진행 표시와 취소 동작 확인

## 5. 이후 순서

1. 엔진 readiness·queue·지연·최근 실패 운영 schema
2. 공개 HTTPS API access token과 사용자별 job 소유권
3. 편집 순서·쉼을 반영한 WAV Export
4. ready 블록 자동 연속 재생과 Worker segment SSE
5. 실제 `ScriptGenerationEngine`과 외부 전송 동의

## 예상 변경 영역

```text
src/storage/
src/projects/
src/hooks/useTimelineGeneration.ts
src/pages/HomePage.tsx
src/types/timeline.ts
src/tts/voiceApi.ts
docs/
```

## 선행 조건과 위험

- GitHub Actions Web·API·Worker quality 성공
- 0.8.3 SQLite 파일을 모든 API 프로세스가 같은 경로로 공유
- 네트워크 파일시스템에서는 SQLite lock 특성을 별도 검증
- 브라우저 IndexedDB quota와 iOS 정리 정책은 기기별 차이가 큼
- Object URL은 세션을 넘지 않으므로 영속 값으로 저장하지 않음

## 이번 패치에서 넘기는 결정

- 서버 job 결과는 SQLite, 모바일 편집 상태는 IndexedDB로 역할을 분리한다.
- 완료 result TTL 기본값은 30분, job history TTL 기본값은 24시간이다.
- 만료된 완료 job ID는 새 payload로 조용히 재사용하지 않고 410을 반환한다.
- 실행 claim TTL은 생성 timeout보다 길게 보정하며 만료 뒤에만 재획득한다.
- 재연결 실패를 이유로 같은 합성 POST를 무조건 다시 보내지 않는다.
