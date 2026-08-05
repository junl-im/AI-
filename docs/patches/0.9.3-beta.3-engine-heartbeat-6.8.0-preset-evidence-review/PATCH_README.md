# Heartbeat 6.7.1 → 6.8.0 덮어쓰기 패치

1. GitHub Desktop에서 현재 변경을 먼저 Commit하거나 저장소 폴더를 백업합니다.
2. 이 패치 ZIP의 내용물을 저장소 최상위 폴더에 그대로 덮어씁니다.
3. 삭제할 추적 파일은 없습니다.
4. GitHub Desktop의 Changes에서 `PATCH_MANIFEST.txt`에 적힌 변경 파일을 확인합니다.
5. `npm run quality:rules`, `npm run test:api`, `npm run test:worker`를 실행하거나 Push 후 GitHub Actions 결과를 확인합니다.

이 패치는 실제 화자 WAV, 동의·권리 원본, CosyVoice 모델 가중치를 포함하지 않습니다. `voice-presets/*.manifest.json`은 안전한 pending 템플릿이므로 실제 근거를 확인하지 않고 승인 상태로 바꾸지 마십시오.
