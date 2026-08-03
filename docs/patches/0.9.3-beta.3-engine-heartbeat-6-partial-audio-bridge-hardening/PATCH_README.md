# Engine Heartbeat 6 Partial Audio Delivery & Bridge Hardening

기준본은 `0.9.3-beta.3 · Engine Heartbeat 5.2.1 · Focus Return Hotfix`입니다.

1. 패치 ZIP 내용을 저장소 루트에 덮어씁니다.
2. Windows는 `APPLY_PATCH.cmd`, macOS/Linux는 `./APPLY_PATCH.sh`를 실행합니다.
3. 운영 환경은 `.env`에 고정 `SORION_SEGMENT_URL_SIGNING_SECRET`과 실제 reverse proxy egress CIDR을 설정합니다.
4. reverse proxy가 외부 `X-Forwarded-*`를 제거하고 자신이 계산한 값으로 다시 설정하는지 확인합니다.
5. Commit·Push 후 GitHub Actions의 Web quality와 API·Worker 테스트를 재실행합니다.

이 패치는 장문 첫 WAV 구간을 최종 병합 전에 재생하고, 단기 HMAC URL과 신뢰 proxy 경계로 공개 Bridge를 강화합니다. 현재 구현은 첫 파일 단위 부분 전달이며 후속 구간 gapless 재생이나 PCM 스트리밍은 아닙니다.
