# SoriON AI 0.9.3-beta.1 CI Hotfix 2 Result Report

결과 버전: **0.9.3-beta.1 CI Hotfix 2 · CI Quality Findings Fix**
기준: **0.9.3-alpha.2 사용자 저장소 + alpha.3 lock 안정화 누적**


## CI Hotfix 2 · 실제 품질 로그 수정

- API `main.py` import 순서를 Ruff I001 기준으로 정렬했습니다.
- fetch mock 타입을 `vi.fn` 구현 함수에서 보존해 TypeScript 호출 배열 오류를 제거했습니다.
- 장문 생성 callback은 안정적인 `generateAll` 함수 자체에 의존해 React Hook 경고를 제거했습니다.
- Artifact Action을 Node 24 네이티브 버전으로 교체하고 강제 런타임 환경 변수를 제거했습니다.

## CI Hotfix 1 · Lock 누락 자동 bootstrap

- 일반 push·PR에서 세 lock이 없으면 CI가 실패하기 전에 실제 registry에서 자동 생성·감사합니다.
- 생성된 lock은 같은 실행의 Web·API·Worker에 artifact로 전달되어 frozen install을 수행합니다.
- 기존 lock이 있으면 자동 재생성하지 않고 manifest·uv lock 일치 여부를 엄격 검증합니다.
- 성공 artifact의 세 lock은 저장소에 커밋해야 이후 실행이 완전한 verify-only 경로가 됩니다.
- 현재 샌드박스의 내부 npm mirror 404 때문에 실제 lock 생성은 GitHub Actions에서 최종 검증해야 합니다.

## 완료

- 폐기 SVG의 파일·Git 추적·push·패치 적용 재유입을 다중 차단
- 실기기 벤치마크 기록 API와 RTF 상태 계산
- Faster Whisper 선택 Adapter, CER·WER와 핵심 토큰 오류 측정
- 타임라인 WAV 병합, 쉼 반영, 실제 시간 SRT·VTT, 선택적 MP3 변환
- 미완료 구간 기본 차단과 Web 다운로드 동선

## 검증

- API 109개, Worker 14개 테스트 통과
- 로컬 FFmpeg 실변환으로 MP3·SRT·VTT 산출물 생성 검증
- Python compileall, 프로젝트 규칙, stale file 검사 통과
- 실제 CUDA·MPS·모바일 장치와 Faster Whisper 모델 측정은 실행하지 못함
- npm 의존성 설치가 없는 현재 환경에서는 공식 Web lint·Vitest·build를 실행하지 못함
