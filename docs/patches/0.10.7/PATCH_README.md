# SoriON AI 0.10.7 Recovery Evidence & Voice Inventory Diagnostics

기준 버전은 **0.10.6 · Baseline Recovery & Multi-Clip Editing**입니다.
패치 ZIP을 기존 0.10.6 저장소 루트에 바로 압축 해제해 덮어쓴 뒤 품질 검사를 실행합니다.

## 핵심 변경

- 공유된 CI 차단 원인인 Worker telemetry `group_key` API/Web 계약 누락을 수정합니다.
- `voice_preset_approval.py`의 primitive import 구조를 단순화해 Ruff I001 재발 지점을 줄입니다.
- Quality Lab에서 이전/현재 `runtime-soak/2` JSON을 직접 비교합니다.
- 실제 Wi-Fi나 OS 절전을 바꾸지 않는 앱 복구 이벤트 경로 주입 도구를 추가합니다.
- Engine Doctor가 Browser Speech 음성 inventory 변화와 fingerprint를 감지합니다.
- `voiceschanged`가 발생하면 engine catalog cache와 프리셋 배정을 다시 평가합니다.

## 적용 후 권장 검사

```bash
node scripts/check-version-sync.mjs
node scripts/check-recovery-evidence-voice-inventory.mjs
node scripts/run-preflight.mjs
cd services/api && python -m pytest -q
cd ../worker && python -m pytest -q
```

현재 전달 환경에는 Web `node_modules`와 Ruff 0.15.22 실행 환경이 없어 실제 Web ESLint·semantic typecheck·Vitest·Vite build와 동일 Ruff 명령은 GitHub Actions에서 최종 확인합니다.

## 삭제 파일

없습니다. 이 패치는 기존 프로젝트 파일을 삭제하지 않습니다.
