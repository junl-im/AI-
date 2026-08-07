# SoriON AI 0.10.4 Voice Preset Engine Reliability Hotfix

기준 버전은 **0.10.3 · Compact Playback Dock & Direct Timeline Editing**입니다.
패치 ZIP을 기존 0.10.3 저장소 루트에 바로 압축 해제해 덮어쓴 뒤 품질 검사를 실행합니다.

## 핵심 변경

- 서버 프리셋 호환 실패를 `SOA-4022`로 구분합니다.
- Web `auto` TTS는 모든 서버 엔진이 해당 프리셋을 표현하지 못할 때 호환 Browser Speech까지 이어서 시도합니다.
- System TTS는 Windows/macOS 기본 백엔드가 프리셋을 거부하거나 실행에 실패하면, 설치된 eSpeak 한국어 백엔드를 같은 요청에서 보조 경로로 시도합니다.
- System 진단은 실제로 선택된 백엔드와 fallback 근거를 반환합니다.
- MeloTTS `YoungHo`를 남성 화자로 인식하도록 화자 이름 판정을 보완합니다.
- 관련 API/System/Melo/Web 회귀 테스트와 voice preset 정적 계약을 강화했습니다.

## 적용 후 권장 검사

```bash
node scripts/check-version-sync.mjs
node scripts/check-voice-preset-contracts.mjs
node scripts/run-preflight.mjs
PYTHONPATH=services/api python -m pytest -q services/api/tests
PYTHONPATH=services/worker python -m pytest -q services/worker/tests
```

## 제한

- 이 패치는 전용 인물 음성을 새로 위조하거나 다른 성별 화자로 대체하지 않습니다.
- 실제 5개 CosyVoice 프리셋 WAV·동의/권리 자료·모델 가중치는 포함하지 않습니다.
- eSpeak 또는 성별 호환 OS/Browser 한국어 음성이 기기에 없으면 일부 근사 프리셋은 여전히 지원 불가일 수 있습니다.
- 삭제되는 tracked 파일은 없습니다.
