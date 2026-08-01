# SoriON AI 0.8.9 Result Report

작업 일시: 2026-08-01 22:20 KST

결과 버전: **0.8.9 Unified Product Shell & Korean Neural Engine Mesh**

## 결과

- 프로젝트·품질·복제·설정 페이지를 공통 PageScaffold로 통일했다.
- 모든 내부 페이지에 같은 제목 계층, 상태 영역, 여백과 카드 리듬을 적용했다.
- CosyVoice Worker 일반 TTS와 네 개의 Premium Cloud TTS Adapter를 등록했다.
- 한국어 특화도·품질 등급·요청 기능 적합성을 자동 순위에 반영하고 장문·스트리밍 역량을 진단에 공개했다.
- 준비되지 않은 엔진은 추천하지 않고 실패 엔진은 circuit breaker로 자동 격리한다.
- 런타임 JSON과 복수 Actions Variable로 공개 HTTPS API 후보를 자동 장애 전환한다.
- 사용자는 API 주소나 엔진을 직접 연결하지 않는다.

## 검증 범위

- API 98개·Worker 9개 회귀 테스트
- Python compileall, Python 3.10 AST·표시 폭 검사
- 프로젝트 규칙, Web 테스트 계약, 세션 규칙
- TypeScript·TSX 구문과 상대경로 import
- 패치 적용 동등성, ZIP 무결성, SHA-256

## 배포 현실

Premium 엔진은 각 공급자의 서버 측 자격 증명이 있을 때만 자동 등록된다. CosyVoice 일반 TTS는
준비된 Worker와 명시적 동의를 받은 한국어 기준 음성 파일이 모두 있어야 한다. GitHub Pages에는
비밀키를 넣지 않으며 별도 HTTPS FastAPI 배포가 필요하다. API가 없을 때는 브라우저 음성이
안전망으로 동작하지만 Premium AI 음질이나 WAV 서버 결과로 표시하지 않는다.

## 다음 목표

`0.9.0 Progressive Korean Voice Streaming`
