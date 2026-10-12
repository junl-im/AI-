# 0.11.38 Streamed Waveform 패치

기준 0.11.37(d31cf73). 저장소 루트에 덮어쓰세요. 삭제할 파일은 없습니다. GitHub Desktop에서 같은 커밋을 동기화했다면 추가 덮어쓰기는 필요 없습니다.

npm ci 후 npm run build. API/Worker는 해당 uv.lock 사용. 새 의존성·모델·사용자 음성은 포함하지 않습니다. .env·모델·사용자 데이터는 보존합니다.

파형은 128MiB/60분 이하 지원 PCM WAV를 순차 분석하며 실제 성우 음질 인증을 제공하지 않습니다. 상세: docs/STREAMED_WAVEFORM_0.11.38.md, docs/HANDOVER.md, docs/NEXT_UPDATE.md.
