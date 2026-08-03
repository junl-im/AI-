# Engine Heartbeat 6.2 Ordered Segment Queue & Device Evidence

기준본은 `0.9.3-beta.3 · Engine Heartbeat 6.1 · Progressive Playback Stability & Male Presets`입니다.

1. 패치 ZIP 내용을 저장소 루트에 덮어씁니다.
2. Windows는 `APPLY_PATCH.cmd`, macOS/Linux는 `./APPLY_PATCH.sh`를 실행합니다.
3. Commit·Push 후 GitHub Actions의 Web quality와 API·Worker 테스트를 재실행합니다.
4. 장문 생성에서 준비 구간이 번호순으로 이어지고 다음 구간 지연 시 `다음 구간 대기`가 표시되는지 확인합니다.
5. Quality Lab의 `현재 기기 재생 점검`에서 환경 검사와 사용자 제스처 재생을 기록하고 JSON을 보관합니다.

이 패치는 두 번째 이후 준비 WAV를 같은 Player Queue 트랙에서 번호순으로 이어 재생하고, 다음 구간 대기·최종 WAV 위치 승계·구간 Blob URL 정리를 제공합니다. 브라우저 자동 감지는 실기기 인증이 아니며 Android Chrome·iOS Safari·PWA 백그라운드 복귀, 장시간 SSE와 네트워크 전환은 별도 수동 검증이 필요합니다.

현재 구현은 완성된 WAV 파일 교체 방식입니다. 실기기 seam gap을 측정하기 전에는 gapless로 표현하지 않습니다.
