# SoriON AI 0.9.3-alpha.1 Patch

기준 버전: `0.9.2 CI Hotfix 2`

목표 버전: `0.9.3-alpha.1 Verified Local Model Readiness Foundation`

## 적용

1. 현재 프로젝트가 `0.9.2 CI Hotfix 2`인지 `docs/HANDOVER.md`에서 확인한다.
2. 작업 중인 변경사항을 먼저 커밋하거나 백업한다.
3. 패치 ZIP을 저장소 루트에 압축 해제해 덮어쓴다.
4. `.env.example`을 참고해 실제 모델 경로·매니페스트·라이선스 동의값을 로컬 `.env`에 설정한다.
5. 다음 검사를 실행한다.

```bash
npm run quality:rules
npm run quality:free-only
npm run quality:engine-blueprint
npm run quality:model-onboarding
python -m pytest services/api/tests -q
python -m pytest services/worker/tests -q
```

## 주요 변경

- Worker 모델 매니페스트 schema와 안전한 상대 경로 검사
- 사용자 확인 기반 라이선스 동의 게이트
- 파일 크기·SHA-256 무결성 검증과 digest cache
- CUDA·Apple Silicon MPS·CPU 저속 모드, VRAM·디스크 진단
- 매니페스트 생성·검증 CLI
- API connectivity의 모델 무결성·실행 장치 상태

## 주의

- 실제 모델 가중치와 공식 체크섬은 포함하지 않는다.
- `SORION_WORKER_MODEL_LICENSE_ACCEPTED=true`는 사용자가 해당 모델의 라이선스를 직접 확인한
  경우에만 설정한다.
- 기본값은 매니페스트 필수다. 이전처럼 모델 경로만 설정하면 Worker는 not-ready다.
- 삭제 파일은 없다.
