# SoriON AI 0.9.3-beta.3 Verification Report

결과 버전: **0.9.3-beta.3 · Verified Evidence & Long-form Export Soak + CI Hardening 5**

## CI Hardening 5

- Ruff 0.15.22 기준으로 verification route가 `app.services.stt_evaluation` 모듈을 한 번만 import하도록 정리했습니다.
- 누락되거나 manifest와 불일치한 package-lock은 CI가 cache 우선·제한 registry fallback으로 자동 bootstrap하고, 정상 lock은 verify-only로 처리합니다.
- npm Firebase SDK 의존성을 제거하고 고정 버전 공식 browser ESM을 로그인 시점에만 동적으로 로드합니다.
- lock 생성 실패 로그와 기존 lock 복원, 설치·전체 트리·SHA-256 proof 계약을 유지합니다.
- local `GENERATE_WEB_LOCK`은 필수 단계가 아니라 registry 장애 시 사용할 수 있는 복구 수단입니다.

## 완료

- 장문 WAV 병합을 청크 스트리밍으로 바꿔 구간 전체와 긴 쉼을 한 번에 메모리에 올리지 않습니다.
- WAV·SRT·VTT·MP3를 임시 파일로 완성한 뒤 최종 이름으로 교체하며 오류 시 부분 산출물을 삭제합니다.
- FFmpeg에 hard timeout을 추가하고 ffprobe로 실제 MP3 컨테이너 길이를 측정합니다.
- 10·30·60분 WAV·MP3 soak 6개 시나리오의 RTF, 메모리, 길이, 자막 드리프트를 JSONL로 기록합니다.
- 선택 재생성 후 두 번째 STT 검수에서 같은 문장 ID의 전후 CER·WER와 핵심 토큰 개선량을 자동 저장합니다.
- Quality Lab에서 STT 개선 기록과 Export soak 진행률을 표시하고, 장치 이름과 메모가 제거된 증거 JSON을 내려받습니다.
- 기존 CI failure-domain 분리, lock SHA-256 proof, 최소 권한과 누적 삭제 차단을 유지합니다.

## 검증

- API pytest 117개 통과
- Worker pytest 14개 통과
- Python compileall 통과
- TypeScript·TSX 145개 파일 parser 검사 통과
- 프로젝트 규칙, 폐기 파일, Web manifest, free-only, engine blueprint, 모델 onboarding 검사 통과
- 합성 무음 10·30·60분 WAV·MP3 6개 시나리오 완료
- WAV 길이·자막 드리프트 0ms, MP3 ffprobe 길이와 자막 차이 192ms 이내

## 해석 제한

합성 무음 soak는 파일 병합, FFmpeg, 컨테이너 길이와 자막 타임코드 안정성만 검증합니다. 실제 한국어 음질, CosyVoice 처리 속도, CUDA·MPS·모바일 메모리 성능을 증명하지 않습니다. 실제 장치·모델 증거는 `.sorion/quality`에 별도로 기록해야 합니다.

현재 샌드박스에는 프로젝트 npm 의존성이 없어 ESLint, semantic TypeScript typecheck, Vitest, Vite build는 GitHub Actions에서 최종 확인해야 합니다.
