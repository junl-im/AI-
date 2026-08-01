# NEXT UPDATE

현재 기준 버전: `0.8.1 Mobile Engine/API Reliability`

## 목표 버전

`0.8.2 Timeline Persistence & Real Script Model Bridge`

## 1. 모바일 편집 세션 영구 저장

- IndexedDB에 채팅 메시지, 음성 블록, 쉼, 순서와 생성 상태 저장
- 모바일 Safari·Chrome에서 새로고침, 화면 잠금, PWA 종료 후 세션 복원
- 마지막 선택 보이스와 API 주소를 프로젝트 단위로 복원
- Object URL이 사라진 음원은 서버 결과 URL 또는 저장 Blob으로 재연결
- 저장 용량 부족, 브라우저 정리, 오래된 프로젝트 TTL을 사용자에게 표시

## 2. 실제 대본 생성 모델 연결

- 교체 가능한 `ScriptGenerationEngine` 인터페이스
- OpenAI 호환 API 또는 로컬 LLM Adapter 경계
- 주제, 길이, 톤, 대상 매체를 자연어 요청에서 추출
- 사용자가 직접 입력한 문장과 AI 생성 대본을 데이터에서 구분
- 외부 LLM 전송 전 원문·개인정보 처리 동의
- 모델 미연결·요금 제한·timeout을 TTS 엔진 오류와 별도로 표시
- 실패 시 현재 `로컬 초안 · LLM 미연결` 상태로 안전하게 전환

## 3. 모바일 연결 복구 2단계

- Service Worker와 앱 포그라운드 복귀 후 마지막 작업 상태 재조회
- API 주소별 성공 시각·지연·실패 원인을 저장해 가장 안정적인 주소 우선 선택
- Wi-Fi에서 셀룰러로 바뀔 때 진행 중 POST를 재전송하지 않고 job 결과만 복구
- API 인증 토큰 도입 전 익명 client ID 회전·삭제 정책 확정
- 공개 HTTPS API용 reverse proxy·TLS·CORS 배포 예제
- Android Chrome·iOS Safari·설치형 PWA 실기기 연결 매트릭스 작성

## 4. 편집 Export

- 문장별 WAV와 쉼을 타임라인 순서대로 하나의 WAV로 병합
- 수정된 순서, 쉼 길이, 음성 속도 반영
- 실패·미생성 블록이 있으면 Export 차단하고 해당 블록으로 이동
- 전체 예상 길이와 파일 크기 표시
- 모바일 공유 시트와 파일 저장 동작 검증

## 5. Progressive Playback 2단계

- ready 블록 자동 연속 재생
- 다음 블록 생성이 늦으면 재생 위치를 보존하고 대기
- Worker segment SSE와 일반 TTS job 결과 복구를 하나의 상태 모델로 통합
- 연결 복구 후 누락 revision과 완료 블록 재조회
- 첫 음성 지연, 블록별 처리 시간, 네트워크 복구 시간을 기록

## 6. 편집 안전성

- undo·redo
- 삭제 블록 복원
- 모바일 드래그와 세로 스크롤 충돌 방지
- 텍스트 수정 후 이전 음원 무효화와 재생성 안내
- 타임라인과 Dock 대기열의 음원 소유권 정리

## 예상 변경 영역

```text
src/workspace/
src/components/workspace/
src/hooks/useTimelineGeneration.ts
src/projects/
src/storage/database.ts
src/network/
src/tts/
services/api/app/api/routes/
services/api/app/services/
```

## 선행 조건

- GitHub Actions Web·API·Worker quality 모두 성공
- Android Chrome과 iOS Safari에서 0.8.1 API 연결·복구 실기기 확인
- 공개 또는 로컬 FastAPI 주소 연결 확인
- 실제 LLM 제공자와 데이터 처리 정책 결정
- 오디오 Blob의 IndexedDB 용량과 TTL 정책 결정

## 위험 요소

- 모바일 브라우저가 백그라운드 탭의 네트워크와 타이머를 중단할 수 있음
- iOS가 저장 공간 압박 시 IndexedDB 데이터를 정리할 수 있음
- 브라우저 Object URL은 새로고침 후 복원되지 않음
- 외부 LLM 사용 시 원문 전송 동의와 개인정보 정책 필요
- 여러 문장 동시 생성 시 GPU 작업 큐와 모바일 메모리 포화 가능
