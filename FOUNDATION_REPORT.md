# SoriON AI 0.8.0 Result Report

작성: 2026-08-01 11:06 KST

## 목표

초보자가 복잡한 TTS 폼을 이해하지 않아도 채팅만으로 시작하고, 생성 결과는
CapCut과 유사한 문장별 타임라인에서 편집할 수 있도록 전체 UX를 개편했다.
초기 브랜드 랜딩은 유지하며 Dock 진입 이후에만 compact 편집 화면으로 전환한다.

## 완료 항목

- 초기 랜딩과 편집 모드 상태 분리
- compact workspace header
- ChatGPT형 composer, 추천 프롬프트, 선택적 Web Speech 입력
- 혜린·도윤·소리 세로 보이스 라이브러리와 모바일 접기·펼치기
- 목소리 선택 시 API 프리뷰
- 문장·쉼 CapCut형 타임라인
- 순서 변경, 자르기, 텍스트 수정, 개별 생성·재시도
- 첫 ready 블록부터 Dock에 연결하는 Progressive Playback
- 채팅 안의 API 연결 시스템 메시지
- API·Worker·GPU 상태 바텀시트
- 안전한 API 후보 탐색과 붙여넣기
- API Connectivity readiness 필드와 실제 TTS·Demo 상태 분리
- 타임라인 블록별 보이스·감정·속도·엔진 옵션 보존
- 불필요한 중간 프레임과 이중 테두리 제거
- MASTER HANDOVER 전면 갱신과 0.7.3 원본 archive 보존

## 실제 검증

- `PYTHONPATH=services/api python -m pytest services/api/tests -q`: 56 passed
- `PYTHONPATH=services/worker python -m pytest services/worker/tests -q`: 9 passed
- Python compileall: 통과
- Python 3.10 AST 파싱: 통과
- TypeScript·TSX transpile 구문 검사: 통과
- 임시 선언 기반 비테스트 소스 정적 검사: 통과
- CSS parser 검사: 10개 파일 통과
- GitHub Actions YAML 파싱: 통과
- 프로젝트 규칙 검사: 통과
- 실제 Uvicorn Worker `/health`: 정상
- 실제 Uvicorn API `/health`, `/connectivity`, `/engines`: 정상
- System TTS 실제 WAV 생성: 204,244 bytes, RIFF/WAVE 확인

## 실행하지 못한 검사

내부 npm 저장소에 `@tailwindcss/vite`와 Testing Library 일부 패키지가 없어
정식 `npm install`, Vitest, ESLint, Vite production build를 실행하지 못했다.
GitHub Actions가 Web quality의 최종 판정이다.

## 알려진 제한

- 실제 LLM 대본 생성은 아직 연결되지 않았으며 로컬 초안으로 표시한다.
- 실제 CosyVoice 모델과 GPU는 릴리스에 포함되지 않는다.
- 타임라인은 새로고침 후 영구 복원되지 않는다.
- 문장별 음원을 편집 순서대로 하나의 WAV로 내보내는 기능은 다음 버전 범위다.
- 브라우저 보안 때문에 전체 192.168.x.x 대역 자동 스캔은 하지 않는다.

## 산출물

- `SoriON-AI-0.8.0-full.zip`
- `SoriON-AI-0.7.3-to-0.8.0-patch.zip`
- `SoriON-AI-0.8.0-artifacts.sha256`
