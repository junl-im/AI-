# SoriON AI 0.8.1 Result Report

작성: 2026-08-01 KST

## 목표

모바일을 주 사용 환경으로 보고 Web→FastAPI→TTS/Worker/GPU 연결 상태를 명확히
분리하며, Wi-Fi·셀룰러 전환, PWA 복귀, 느린 네트워크와 응답 단절에서도 기능이
중복 실행되거나 영구 먹통이 되지 않도록 엔진·API 연결 계층을 강화한다.

## 완료 항목

### 모바일 API 주소와 연결

- 스킴 없는 LAN IP와 공개 도메인 주소 정규화
- 사용자 저장 주소, 마지막 성공 주소, 최근 주소 최대 5개 분리 저장
- 휴대폰 localhost 오사용과 HTTPS→HTTP mixed-content 사전 차단
- 전체 LAN 스캔 없이 저장 주소·현재 호스트 중심의 안전 탐색
- 연결 바텀시트의 최근 주소 선택, 네트워크 유형, 지연과 request ID 표시

### 엔진 상태

- FastAPI, 실제 TTS, CosyVoice Worker, GPU·모델 네 계층 상태
- Worker 프로세스가 살아 있어도 모델·CUDA가 없으면 준비 안 됨 표시
- `/connectivity`에 Worker health, GPU, VRAM, request ID, 재검사 권장 간격 추가
- API 주소 변경, online/offline, NetworkInformation 변경, PWA 포그라운드 복귀 재검사
- 실패 재검사 간격 5초→12초→30초→60초와 중복 점검 방지

### 요청 안정성

- 모든 Web 요청에 `X-Request-ID`, 익명 `X-SoriON-Client-ID` 전송
- 모바일 연결 상태에 따른 adaptive timeout
- GET·HEAD의 일시적 오류만 제한적으로 재시도
- POST 음성 생성은 중복 작업을 막기 위해 자동 재전송 금지
- POST 응답 단절 시 동일 job ID의 상태와 완료 결과 복구
- `GET /api/v1/tts/jobs/{job_id}/result` 추가
- 대기·재시도 AbortSignal listener 정리

### FastAPI·LAN

- 개발 LAN용 Private Network preflight 응답
- request ID, rate-limit 관련 CORS 노출 헤더
- 사용자 ID가 없을 때 익명 client ID 기준 rate-limit 구분
- 완료 TTS 결과를 제한된 JobManager 스냅샷에서 복구

### 모바일 UI

- 입력 글자 16px 이상으로 iOS 자동 확대 방지
- 주요 터치 영역 44px 이상
- composer, 타임라인, Dock, 연결 바텀시트 safe-area 강화
- API·TTS·Worker·GPU 2×2 상태 카드
- 작은 화면에서도 오류 원인과 연결 버튼을 현재 작업 흐름에 유지

## 실제 엔진·API 통합 점검

실제 Uvicorn Worker와 API를 실행해 확인했다.

- Worker `/health`: `0.8.1`, 정상
- Worker `/ready`: not-ready
- not-ready 이유: `SORION_WORKER_MODEL_PATH` 미설정
- PyTorch 탐지: true
- CUDA 사용 가능: false
- API `/health`: `0.8.1`, 정상
- API `/connectivity`: API ready, 실제 System TTS ready
- API→Worker health 연결: 정상
- Voice clone/GPU readiness: false로 정직하게 표시
- 전달한 request ID가 Connectivity 응답에 유지됨
- GitHub Pages Origin의 Private Network preflight: 허용 헤더 확인
- System TTS 실제 WAV: 147,358 bytes, mono, 22.05kHz, 약 3.34초
- 합성 완료 결과를 새 `/result` API로 복구 확인

실제 CosyVoice 모델 가중치와 CUDA GPU는 릴리스에 포함하지 않으므로 복제 추론 성공으로
표시하지 않았다.

## 자동 검증

- 프로젝트 절대 규칙 검사 통과
- FastAPI 테스트: **60 passed**
- CosyVoice Worker 테스트: **9 passed**
- Python compileall 통과
- Python 3.10 AST 파싱: 84개 파일 통과
- TypeScript·TSX 구문 파싱: 105개 파일 통과
- 변경 핵심 TypeScript strict 대체 검사 통과
- CSS parser: 11개 파일 통과
- GitHub Actions YAML 파싱 통과
- 모든 소스 파일 500줄 이하
- Python Ruff 표시 폭 100칸 제한 통과

## 실행하지 못한 공식 검사

현재 실행 환경의 npm 저장소에 Web 의존성이 설치되어 있지 않아 정식 Vitest, ESLint,
Vite production build를 실행하지 못했다. Ruff 모듈도 설치되어 있지 않아 공식 Ruff 명령은
실행하지 못했다. 해당 항목은 GitHub Actions의 Web·API·Worker quality에서 최종 확인한다.

## 알려진 제한

- 실제 CosyVoice 모델과 GPU는 별도 설치가 필요하다.
- 공개 사용자 인증과 access token 갱신은 아직 없다.
- HTTPS Web에서 HTTP LAN API 차단은 Web 코드가 우회할 수 없다.
- iOS는 백그라운드 네트워크·타이머를 강하게 중단할 수 있다.
- 타임라인은 아직 새로고침 후 영구 복원되지 않는다.
- 실제 LLM 대본 생성은 연결되지 않았으며 로컬 초안으로 표시한다.

## 릴리스 구성

- 전체 프로젝트 파일: 339개
- 추가 파일: 7개
- 수정 파일: 57개
- 삭제 파일: 0개
- 패치 포함 파일: 64개
- 패치 적용 결과와 전체본의 모든 파일 해시를 최종 패키징 단계에서 비교한다.

## 산출물

- `SoriON-AI-0.8.1-full.zip`
- `SoriON-AI-0.8.0-to-0.8.1-patch.zip`
- `SoriON-AI-0.8.1-artifacts.sha256`
- `docs/HANDOVER.md`
- `docs/CHANGELOG.md`
- `docs/NEXT_UPDATE.md`
- `docs/MOBILE_ENGINE_RELIABILITY.md`
