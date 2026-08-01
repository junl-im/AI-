# NEXT UPDATE

현재 기준 버전: `0.8.0 Chat-to-Timeline Workspace`

## 목표 버전

`0.8.1 Timeline Persistence & Real Script Model Bridge`

## 1. 실제 대본 생성 모델 연결

- 교체 가능한 `ScriptGenerationEngine` 인터페이스
- OpenAI 호환 또는 로컬 LLM Adapter 경계
- 자연어 요청에서 주제, 길이, 톤, 대상 매체 추출
- 생성된 대본과 사용자가 직접 입력한 문장을 데이터에서 구분
- LLM 미연결 시 현재 로컬 초안 배지를 유지
- 대본 오류와 TTS 오류를 별도 상태로 표시

## 2. 타임라인 영구 저장

- IndexedDB에 메시지, 음성 블록, 쉼, 순서, 상태 저장
- 새로고침 후 현재 편집 세션 복원
- ready 음원의 URL 수명과 파일 재연결 정책
- 프로젝트 화면에서 타임라인 세션 다시 열기
- 프로필과 목소리 선택 상태 복원

## 3. 편집 Export

- 문장별 WAV와 쉼을 하나의 WAV로 병합
- 수정된 순서와 쉼 길이 반영
- 실패·미생성 블록이 있으면 Export 차단
- 전체 예상 길이와 파일 크기 표시
- WAV 우선, MP3·M4A는 서버 변환 경계만 정의

## 4. Progressive Playback 2단계

- ready 블록을 자동 연속 재생
- 생성 중 다음 블록이 늦으면 현재 위치에서 대기
- Worker segment SSE와 TTS 타임라인 상태 통합
- SSE 재연결 후 누락 상태 복구
- 첫 음성 지연과 블록별 처리 시간 기록

## 5. 편집 안전성

- undo·redo
- 블록 삭제와 복구
- 드래그 중 모바일 스크롤 충돌 방지
- 텍스트 수정 후 이전 음원 명확한 무효화
- 대기열과 타임라인 track ownership 정리

## 예상 변경 영역

```text
src/workspace/
src/components/workspace/
src/hooks/useTimelineGeneration.ts
src/projects/
src/storage/database.ts
src/tts/
services/api/app/api/routes/
services/api/app/services/
```

## 선행 조건

- GitHub Actions Web·API·Worker quality 모두 성공
- 공개 또는 로컬 FastAPI 주소 연결 확인
- 실제 LLM 제공자와 데이터 처리 정책 결정
- 오디오 Blob의 IndexedDB 용량 정책 결정

## 위험 요소

- 브라우저 Object URL은 새로고침 후 복원되지 않음
- 긴 프로젝트의 Blob 저장 용량과 모바일 메모리
- 외부 LLM 사용 시 원문 전송 동의와 개인정보 정책
- 여러 문장 동시 생성 시 GPU 작업 큐 포화
