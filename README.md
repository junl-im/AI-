# AI 쇼츠 제작 스튜디오 v1.6.0

브라우저에서 미디어 분석, 쇼츠 후보 추천, 자막 편집, 세로 영상 렌더링을 수행하는 로컬 우선 제작 도구입니다. v1.6.0은 기존 편집 엔진을 유지하면서 사용자가 직접 실행한 경우에만 localhost의 오픈소스 AI 서버와 연결되는 **Local AI Provider Foundation**을 추가합니다.

## 핵심 기능

기존 **모듈형 엔진** 계약 위에서 다음 기능이 동작합니다.

- 오디오·영상 움직임 분석과 쇼츠 후보 추천
- 자동 컷, 후보 고정, 자막·SRT 편집, 9:16 렌더 큐
- 옵션 signature 기반 분석 캐시와 namespace 선택 정리
- 세션 순환 백업, 중요 백업 내보내기·가져오기
- 서비스워커 앱 셸 SHA-256 무결성 검사와 복구
- Ollama·llama.cpp·OpenAI 호환 로컬 서버를 이용한 구조화 쇼츠 카피 생성
- whisper.cpp 또는 OpenAI 호환 로컬 전사 서버를 이용한 구간 자막·SRT 생성
- 모델 digest 고정, 직렬 작업 큐, 취소·시간 제한·진행률·비식별 이력

## v1.6.0 로컬 AI 원칙

1. 페이지를 열기만 해서는 AI 서버에 요청하지 않습니다.
2. 연결 확인, 카피 생성, 전사는 사용자의 명시적 버튼 동작 뒤에만 실행됩니다.
3. 기본 설정에서는 `localhost`, `*.localhost`, `127.0.0.0/8`, `::1`만 허용합니다.
4. URL 계정 정보, 원격 호스트, 과도한 응답 크기는 차단합니다.
5. 앱에는 외부 CDN, 원격 모델, API 키가 포함되지 않습니다.
6. 로컬 AI 기능이 없거나 실패해도 기존 분석·편집·렌더 기능은 계속 동작합니다.

## 실행

정적 파일 서버에서 프로젝트 루트를 제공합니다.

```bash
npm run serve
```

브라우저에서 `http://127.0.0.1:8080`을 열고 기존 작업실을 사용할 수 있습니다. 로컬 AI를 사용하려면 별도로 설치한 AI 서버를 loopback 주소에 실행하고, 서버가 이 앱 origin의 브라우저 요청을 허용하도록 CORS를 설정해야 합니다.

## 로컬 AI 연결

### Ollama

- 기본 주소: `http://127.0.0.1:11434`
- 기능: 모델 목록 확인, digest 검증·고정, JSON Schema 기반 카피 생성
- 모델 digest가 고정값과 달라지면 생성을 차단합니다.

### llama.cpp server

- 기본 주소: `http://127.0.0.1:8080`
- 기능: `/v1/models`, `/v1/chat/completions`, 구조화 JSON 카피 생성
- 서버가 digest를 노출하지 않으므로 Ollama와 같은 digest 고정은 지원하지 않습니다.

### whisper.cpp server

- 기본 주소: `http://127.0.0.1:8081`
- 기능: `/inference` multipart 전사, 구간 자막, SRT 생성
- 사용자가 전사 버튼을 누르면 선택한 미디어 파일이 지정한 localhost 서버로 전송됩니다.

### Local OpenAI-compatible

- 기본 주소: `http://127.0.0.1:8080`
- 기능: OpenAI 호환 구조화 채팅과 음성 전사
- 원격 OpenAI 서비스 연결용이 아니라 사용자가 직접 운영하는 localhost 호환 서버용입니다.

## 성능 설계

- 로컬 AI JavaScript 모듈은 초기 부팅에 포함하지 않고 해당 영역의 첫 포커스·클릭 때 단계 적재합니다.
- 직접 실행 스크립트 예산은 49개로 유지합니다.
- AI 작업은 동시 실행 1개, 대기열 최대 6개로 제한합니다.
- 응답은 최대 2MiB, 입력 프롬프트는 최대 24,000자, 전사 파일은 최대 512MiB로 제한합니다.
- 모든 작업은 취소와 시간 제한을 지원하며, 이력에는 모델명 대신 비식별 토큰을 저장합니다.

## 검수

```bash
npm test
```

v1.6.0 기준 자동 검사 216개, 4개 viewport Chromium 감사, CSS ownership, 서비스워커 lifecycle, GPU/media capability, 프로세스 메모리 보조 감사를 수행합니다. 상세 결과는 `qa/QA_REPORT.md`와 `HANDOFF.md`를 확인하십시오.

## 패키징

```bash
npm run package:full
PATCH_BASE_REF=8e0eaeb PATCH_FROM_VERSION=1.5.29 npm run package:patch
```

전체 ZIP은 실행·문서·QA 파일을 포함하고 `.git`, `node_modules`, 중첩 `dist`를 제외합니다. 패치 ZIP은 v1.5.29 기준 변경·신규 파일만 포함하며 파일 삭제가 필요한 변경은 생성하지 않습니다.

## 알려진 제한

- AI 모델과 로컬 서버 실행 파일은 배포본에 포함되지 않습니다.
- 실기기 Safari·Samsung Internet, 물리 GPU·NPU, 대규모 모델별 성능은 별도 검증이 필요합니다.
- 브라우저 보안 정책 때문에 로컬 서버의 CORS 설정이 필요할 수 있습니다.
- whisper.cpp 전사는 브라우저 내부 추론이 아니라 선택한 localhost 서버 처리입니다.
- 프로세스 메모리 수치는 headless Chromium 환경의 보조 지표이며 실제 데스크톱 GPU 환경과 다를 수 있습니다.
