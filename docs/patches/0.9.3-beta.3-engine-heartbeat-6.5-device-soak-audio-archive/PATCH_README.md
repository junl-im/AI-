# Engine Heartbeat 6.5 Patch

기준본: `0.9.3-beta.3 · Engine Heartbeat 6.4`
결과본: `0.9.3-beta.3 · Engine Heartbeat 6.5 · Device Soak Recorder & Audio Archive Policy`

- Android/iOS 10·30·60분 실기기 recorder
- SSE reconnect, audio fetch recovery, playback interruption 개별 기록
- 기기·엔진·프리셋별 first audio·복구·seam P95 집계
- 생성 대기 seam과 순수 decode seam 분리
- Export 서버 임시 만료 시각과 download-only 보존 정책
- 음원·SRT·VTT 다운로드와 개인정보 최소 로컬 receipt

실제 기기·CosyVoice 성능 값은 포함하지 않으며 저장소와 CI가 READY를 자동 생성하지 않습니다.
