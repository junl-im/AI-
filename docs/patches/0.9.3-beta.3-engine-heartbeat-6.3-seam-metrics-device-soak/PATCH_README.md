# Engine Heartbeat 6.3 Seam Metrics & Device Soak

기준본은 `0.9.3-beta.3 · Engine Heartbeat 6.2 · Ordered Segment Queue & Device Evidence`입니다.

1. 패치 ZIP 내용을 저장소 루트에 덮어씁니다.
2. Windows는 `APPLY_PATCH.cmd`, macOS/Linux는 `./APPLY_PATCH.sh`를 실행합니다.
3. Commit·Push 후 GitHub Actions의 Web quality와 API·Worker 테스트를 재실행합니다.
4. 장문 구간 전환 뒤 Quality Lab의 `구간 전환 실측`에서 `ended → playing` 평균·최대·대기 포함 여부를 확인합니다.
5. 새로고침 뒤 최종 원격 음원과 Browser Speech 대기열이 자동 재생 없이 복원되는지 확인합니다.
6. 현재 기기 재생 점검에서 백그라운드 복귀, online/offline과 BFCache 관찰 결과를 JSON으로 저장합니다.

이 패치는 실제 WAV 파일 사이 전환 시간을 측정하고, 25분 이내의 안전한 최종 재생 세션만 복원합니다. 부분 WAV, Blob URL, revocable preview와 만료 서명 URL은 localStorage에 저장하지 않습니다.

자동 이벤트 관찰은 실제 Android Chrome·iOS Safari·PWA 장시간 재생, SSE 유지 또는 gapless 인증이 아닙니다. 실제 CosyVoice 모델·프리셋 5종과 실기기 10·30·60분 soak는 별도 환경에서 수행해야 합니다.
