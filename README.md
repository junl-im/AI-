# AI Shorts Studio v1.6.40

브라우저 안에서 원본 미디어를 분석하고 세로 쇼츠 후보를 편집·렌더링하는 로컬 우선 정적 웹 스튜디오입니다. 분석, Local AI, 미리보기, 렌더, 저장, 진단 책임을 분리한 모듈형 엔진 구조를 유지합니다.

## 이번 업데이트

- Ollama, llama.cpp, whisper.cpp, Local OpenAI-compatible 제공자마다 이름이 있는 localhost endpoint 프로필을 저장·전환·삭제할 수 있습니다.
- 기존 단일 endpoint 설정은 업데이트 시 제공자별 기본 프로필로 자동 이관됩니다.
- 프로필은 endpoint, 선호 모델, 최근 확인 결과, bounded 모델 목록을 독립 보존합니다.
- 프로필 전환 시 이전 런타임 신뢰 상태를 재사용하지 않고 반드시 새 endpoint 연결 확인을 요구합니다.
- 프로필 삭제 시 해당 endpoint에 속한 digest pin을 함께 정리하며 제공자별 마지막 프로필은 삭제할 수 없습니다.
- 진단 snapshot에는 endpoint·프로필 원문 대신 개수와 비가역 token만 노출합니다.
- Local AI 패널에 프로필 선택, 이름, 저장, 삭제, 최근 확인·모델·pin 요약 UI를 추가했습니다.
- 신규 `local_ai_endpoint_profiles_smoke.js`를 등록해 migration, 격리, 전환, 삭제, privacy 계약을 검증합니다.

## 핵심 계약

- endpoint 프로필은 제공자별 최대 8개, 최근 모델 cache는 프로필별 최대 40개로 제한됩니다.
- 모델 pin은 계속 `provider + endpoint token + model id` 범위로 저장됩니다.
- 프로필을 바꾸면 저장된 모델과 endpoint는 복원되지만 생성·전사 전 새 probe가 필요합니다.
- 같은 제공자에 동일 endpoint 프로필을 중복 저장할 수 없습니다.
- 로컬 AI endpoint는 loopback 주소만 허용하며 redirect를 따라가지 않습니다.
- Local AI 진단 이력에는 prompt, schema, endpoint 주소, 원본 미디어 내용이 저장되지 않습니다.

## 실행

정적 파일 서버에서 프로젝트 루트를 열고 `index.html`에 접속합니다.

```bash
python3 -m http.server 8080
```

미디어, 모델, 프로젝트, 진단 정보는 로컬 우선으로 처리됩니다.

## 검증

- 전체 등록 QA: **318/318 통과**, 실패 0개
- 신규 endpoint profile migration·격리·전환·삭제·pin cleanup 회귀 통과
- 실제 loopback HTTP transport·shared deadline·probe cancellation 회귀 재통과
- 서비스워커 앱 셸 135개 SHA-256 무결성 통과
- 4개 viewport·5회 실미디어 heap·8회 process-memory·실제 30분 1080p Smart Reframe 감사 통과

세부 인수인계는 `HANDOFF.md`, 감사 범위는 `AUDIT_REPORT.md`, 변경 범위는 `PATCH_REPORT.md`, 전달 규칙은 `DELIVERY_RULES.md`를 확인합니다.
