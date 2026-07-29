# AI Shorts Studio v1.6.39

브라우저 안에서 원본 미디어를 분석하고 세로 쇼츠 후보를 편집·렌더링하는 로컬 우선 정적 웹 스튜디오입니다. 분석, Local AI, 미리보기, 렌더, 저장, 진단 책임을 분리한 모듈형 엔진 구조를 유지합니다.

## 이번 업데이트

- Local AI 모델 digest pin을 제공자·모델명뿐 아니라 정규화된 endpoint까지 포함해 분리 저장합니다.
- 같은 모델명을 사용하는 여러 localhost 서버가 서로의 pin을 덮어쓰거나 잘못 재사용하지 않습니다.
- 기존 `provider:model` 형식 pin은 저장된 현재 endpoint 범위로 자동 이관합니다.
- 다른 endpoint에 pin이 남아 있으면 새 endpoint는 연결 확인 전 `stale` 상태로 생성이 차단됩니다.
- 생성·전사 성공뿐 아니라 HTTP 오류, timeout, 취소, 검증 실패도 privacy-safe provider 이력에 보존합니다.
- 전사 입력의 `size`가 `NaN`, `Infinity`, 음수인 가짜 파일 객체를 미디어 없음 오류로 차단합니다.
- 신규 `local_ai_endpoint_pin_history_smoke.js`를 등록해 endpoint별 pin, legacy 이관, 실패 이력 비노출 계약을 검증합니다.

## 핵심 계약

- 모델 pin은 `provider + endpoint token + model id` 범위로 저장됩니다.
- pin이 존재하는 다른 endpoint로 이동하면 연결 확인 전 generation transport를 시작하지 않습니다.
- 새 endpoint를 확인한 뒤에는 동일 모델명을 독립적으로 pin하거나 unpin할 수 있습니다.
- Local AI 진단 이력에는 prompt, schema, endpoint 주소, 원본 미디어 내용이 저장되지 않습니다.
- 로컬 AI endpoint는 loopback 주소만 허용하며 redirect를 따라가지 않습니다.
- 직접 crop keyframe과 전역 피사체 고정은 화자 grid보다 우선합니다.

## 실행

정적 파일 서버에서 프로젝트 루트를 열고 `index.html`에 접속합니다.

```bash
python3 -m http.server 8080
```

미디어, 모델, 프로젝트, 진단 정보는 로컬 우선으로 처리됩니다.

## 검증

- 전체 등록 QA: **317/317 통과**, 실패 0개
- 신규 endpoint pin·failure history 회귀 통과
- 실제 loopback HTTP transport·shared deadline·probe cancellation 회귀 재통과
- 서비스워커 앱 셸 135개 SHA-256 무결성 통과
- 4개 viewport·5회 실미디어 heap·8회 process-memory·실제 30분 1080p Smart Reframe 감사 통과

세부 인수인계는 `HANDOFF.md`, 감사 범위는 `AUDIT_REPORT.md`, 변경 범위는 `PATCH_REPORT.md`, 전달 규칙은 `DELIVERY_RULES.md`를 확인합니다.
