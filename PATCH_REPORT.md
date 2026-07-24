# PATCH REPORT v1.6.0

## 목표

AI 쇼츠 제작 스튜디오를 외부 클라우드 종속 없이 확장할 수 있도록, localhost에서 실행되는 오픈소스 AI 서버를 안전하게 연결하는 기반을 구축했습니다. 기존 미디어 분석·렌더 엔진의 안정성, 초기 부팅 예산, 서비스워커 무결성 계약을 깨지 않는 것을 최우선 조건으로 두었습니다.

## 사전 진단

- 기존 앱은 외부 CDN과 원격 API를 차단하고 정적 앱 셸 무결성을 강하게 관리합니다.
- AI 모듈을 초기 스크립트로 직접 추가하면 시작 스크립트 예산이 증가했습니다.
- 로컬 서버 연결에 endpoint 검증, 명시적 사용자 동작, 취소·시간 제한, 응답 크기 제한이 없으면 개인정보·가용성 위험이 생깁니다.
- Ollama, llama.cpp, whisper.cpp는 API 형식과 모델 무결성 메타데이터가 서로 다릅니다.

## 구현

### 보안 경계

- 기본적으로 `localhost`, `*.localhost`, `127.0.0.0/8`, `::1`만 허용합니다.
- URL의 username/password, 비 HTTP(S) 스킴, 원격 호스트를 거절합니다.
- CSP도 동일한 loopback 범위로 제한합니다.
- 페이지 load 시 provider probe나 모델 요청을 실행하지 않습니다.
- 요청은 credential·referrer·HTTP cache를 사용하지 않습니다.
- 응답과 프롬프트, JSON Schema, 전사 파일에 상한을 둡니다.

### 제공자 호환

- Ollama: `/api/tags`에서 모델·digest 확인, `/api/generate`에 JSON Schema 전달
- llama.cpp: `/v1/models`, `/v1/chat/completions`, native `response_format` schema 전달
- whisper.cpp: `/inference` multipart와 `response_format` 사용
- Local OpenAI-compatible: `/v1/chat/completions`, `/v1/audio/transcriptions` fallback

### 모델 무결성

- Ollama가 노출하는 digest를 저장하고 다음 연결에서 비교합니다.
- digest mismatch 상태에서는 구조화 생성을 차단합니다.
- 모델명·endpoint 원문은 작업 이력에 남기지 않고 16자리 토큰으로 요약합니다.

### 작업 안정성

- 직렬 큐로 로컬 모델 메모리 경쟁을 방지합니다.
- 사용자 취소와 timeout을 분리합니다.
- 첫 UI 클릭 중 단계 적재가 일어나도 작업을 잃지 않도록 이벤트를 재생합니다.
- 구조화 출력은 허용 필드·문자 수·태그 개수를 다시 정규화합니다.
- SRT 시간은 정수 밀리초에서 반올림해 `00:00:59,999` 다음 경계를 안정적으로 처리합니다.

### 성능

- AI 모듈 3개를 초기 부팅에서 제외하고 Local AI Studio 접근 때만 적재합니다.
- 직접 실행 스크립트는 49개로 기존 예산을 유지합니다.
- AI 동시 실행은 1개, 큐는 6개, 이력은 20개로 제한합니다.
- 기존 분석 캐시, 렌더 큐, 세션 백업, 서비스워커 소유권은 변경하지 않습니다.

## 결함 발견과 수정

1. 초기 구현의 AI 직접 로딩이 시작 스크립트 예산을 초과했습니다. 단계 적재로 변경했습니다.
2. whisper.cpp form key를 비표준 `response-format`으로 보낼 가능성을 공식 계약의 `response_format`으로 수정했습니다.
3. llama.cpp에 일반 OpenAI 중첩 schema를 보내던 부분을 서버 native schema 형식으로 분리했습니다.
4. timeout이 사용자 취소처럼 기록되던 문제를 `TimeoutError / failed`로 분리했습니다.
5. SRT 밀리초 반올림이 1000ms가 될 수 있던 경계 문제를 정수 총 밀리초 변환으로 수정했습니다.
6. 브라우저 감사의 단계 전환이 고정 sleep에 의존해 간헐적으로 실패하던 부분을 실제 class 종료 조건 대기로 변경했습니다.

## 검증 요약

- 신규 provider registry, 작업 큐, UI 전용 회귀 통과
- 기존 핵심 미디어·프로젝트·렌더·저장 회귀 유지
- 4개 viewport 런타임 오류·Promise 거절·콘솔 오류·가로 overflow 0
- CSS ownership 충돌·동일값 중복·shadowed declaration 0
- 서비스워커 install·activate·offline navigation 통과
- 앱 셸 자산 SHA-256 manifest 갱신
- 전체 자동 QA **216/216 통과**

## 개인정보 흐름

- 카피 생성: 선택 후보의 시간·점수·추천 이유, 사용자가 허용한 현재 자막·제목·해시태그만 localhost 서버로 전송
- 전사: 사용자가 명시적으로 선택한 미디어 파일을 localhost 전사 서버로 전송
- 원격 서버: 기본 설정과 CSP 양쪽에서 차단
- 이력: 원문 프롬프트·전사·파일명·endpoint·모델명 미보존

## 남은 위험

- 로컬 서버 자체의 보안·CORS·모델 라이선스는 운영자가 관리해야 합니다.
- 구조화 출력 지원 수준은 모델과 서버 버전에 따라 다릅니다.
- 대형 음성 파일은 최대 512MiB 안에서도 로컬 서버 메모리를 크게 사용할 수 있습니다.
- headless Chromium 감사만으로 물리 GPU·모바일 실기기 동작을 보장하지 않습니다.
