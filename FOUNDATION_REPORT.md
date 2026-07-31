# SoriON AI 0.7.0 Result Report

## 결과

- FastAPI와 분리된 `services/worker` CosyVoice 실행 서비스를 추가했다.
- Worker health, readiness, GPU·CUDA·VRAM·모델·adapter 진단을 분리했다.
- 공식 CosyVoice `AutoModel` 호출 구조를 따르는 선택 설치 adapter를 추가했다.
- 문장별 복제 작업, SSE 진행 이벤트, 취소, 실패·취소 구간 재시도와 WAV 병합을 구현했다.
- FastAPI에 복제 작업 생성·조회·취소·재시도·이벤트·음원 프록시 API를 추가했다.
- 복제 화면에 실제 실행 문장 입력, 문장별 진행률, 취소·재시도 UI를 추가했다.
- 완료된 복제 WAV를 Linked Player Dock에 자동 연결한다.
- Worker가 준비되지 않았을 때 작업 생성을 503으로 차단하고 성공으로 위장하지 않는다.
- API·Worker·Web·Pages 품질 작업을 단일 GitHub Actions workflow에서 연결했다.

## 검증

- API pytest: 53 passed
- Worker pytest: 5 passed
- Python compileall 통과
- 실제 Uvicorn Worker 시작, `/health` 정상, 모델 미설치 `/ready` not-ready 응답 확인
- FastAPI↔Worker 실제 HTTP 연결과 capabilities의 Worker v0.7.0·not-ready 전달 확인
- 프로젝트 규칙 검사 통과
- GitHub Actions YAML 파싱 통과
- TypeScript·TSX 89개 파일 구문 검사 통과
- CSS 6개 파일 파싱 통과
- 모든 프로젝트 파일 500줄 이하
- Python Ruff 표시 폭 100칸 초과 0건
- 전체본 290개 파일
- 0.6.4 대비 변경·추가 66개 파일, 삭제 0개
- 패치 적용본과 전체본 파일 해시 동등성 확인
- 전체 ZIP과 패치 ZIP 무결성 확인

## 제한

- 모델 가중치, PyTorch, torchaudio, CosyVoice 저장소 의존성은 포함하지 않는다.
- 현재 실행 환경에는 GPU 모델이 없어 실제 CosyVoice 음질·지연·VRAM을 측정하지 못했다.
- 현재 npm registry에 일부 Web 패키지가 없어 정식 Vitest·ESLint·Vite production build는 실행하지 못했다. GitHub Actions의 Web quality가 최종 확인 단계다.
- 공식 Ruff 실행 파일은 네트워크 제한으로 설치하지 못했다. 동일 line-length 규칙과 프로젝트 검사, Python 테스트를 통과했으며 GitHub Actions Ruff가 최종 판정한다.
