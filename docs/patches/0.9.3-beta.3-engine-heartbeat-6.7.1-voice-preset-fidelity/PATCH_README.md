# Engine Heartbeat 6.7.1 Voice Preset Fidelity Hotfix

기준본: `0.9.3-beta.3 · Engine Heartbeat 6.7 · Field Evidence Intake & Local Export Bundle`
결과본: `0.9.3-beta.3 · Engine Heartbeat 6.7.1 · Voice Preset Fidelity Hotfix`

남성 프리셋이 여성 음성으로 재생되거나 여러 인물 프리셋이 하나의 공통 음성을 반복 사용하던 묵시적 폴백을 차단하는 덮어쓰기 패치입니다. CosyVoice는 알려진 5개 프리셋에 동일 ID의 전용 WAV만 사용하며, Browser/System/Melo는 성별과 별도 후보를 확인할 수 없으면 성공으로 가장하지 않습니다.

## GitHub Desktop 적용

1. 현재 변경사항이 있으면 먼저 Commit하거나 프로젝트 폴더를 백업합니다.
2. 이 패치 ZIP의 내용물을 기존 저장소 루트에 바로 압축 해제하고 덮어씁니다.
3. `.git` 폴더는 건드리지 않습니다. 이 패치에는 삭제 파일이 없습니다.
4. GitHub Desktop의 **Changes**에서 변경 파일을 확인합니다.
5. 가능하면 `node scripts/run-preflight.mjs`와 `npm run test:api`를 실행합니다.
6. 변경사항을 Commit하고 Push합니다.

## 실제 인물 음성 준비

이번 패치 ZIP에는 실제 화자 WAV와 모델 가중치가 없습니다. 정확한 혜린·도윤·소리·준호·민준 음색을 적용하려면 화자 동의와 권리를 확인한 `voice-presets/{preset-id}.wav` 5개를 로컬에 준비해야 합니다. 파일이 없을 때 다른 사람 음성으로 대체하지 않는 것이 이번 패치의 핵심입니다.

## 검증과 제한

- Repository preflight 20개 통과
- API pytest 154개 통과
- Worker pytest 14개 통과
- 핵심 프리셋 회귀 29개 통과
- TS/TSX transpile 구문 검사 179개 통과
- 전체 npm lint·typecheck·Vitest·Vite build는 내부 registry의 `zustand@5.0.8` 404로 실행하지 못했으며 GitHub Actions가 최종 판정합니다.
