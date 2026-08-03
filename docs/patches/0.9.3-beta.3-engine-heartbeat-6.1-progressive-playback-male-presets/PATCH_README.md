# Engine Heartbeat 6.1 Progressive Playback Stability & Male Presets

기준본은 `0.9.3-beta.3 · Engine Heartbeat 6 · Partial Audio Delivery & Bridge Hardening`입니다.

1. 패치 ZIP 내용을 저장소 루트에 덮어씁니다.
2. Windows는 `APPLY_PATCH.cmd`, macOS/Linux는 `./APPLY_PATCH.sh`를 실행합니다.
3. Commit·Push 후 GitHub Actions의 Web quality와 API·Worker 테스트를 재실행합니다.
4. Engine Doctor에서 프리셋 예상 개수가 5개이고 준비 상태가 올바른지 확인합니다.
5. 실제 준호·민준 CosyVoice 음색을 사용하려면 동의와 권리를 확보한 `jun-deep.wav`, `min-energetic.wav`를 `voice-presets` 폴더에 별도로 둡니다.

이 패치는 기본 프리셋을 여성 1종·남성 3종·중성 1종으로 확장하고, 모바일 성별 필터를 제공합니다. 첫 구간 서명 URL의 403·410 만료를 한 번 갱신하며, 같은 Player 트랙이 부분 WAV에서 최종 WAV로 교체될 때 재생 위치와 재생 상태를 승계합니다.

실제 화자 WAV와 모델 가중치는 포함하지 않습니다. 성별 분류는 탐색용 메타데이터이며 실제 화자의 정체성·품질을 보증하지 않습니다.
