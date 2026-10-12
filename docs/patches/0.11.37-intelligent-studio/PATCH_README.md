# 0.11.37 Intelligent Studio 패치

기준: 0.11.36(c1e32fa). 저장소 루트에 압축을 풀어 덮어쓰세요. 삭제할 기존 파일은 없습니다. GitHub Desktop 동기화로 이미 같은 커밋을 받았다면 추가 덮어쓰기는 필요 없습니다.

npm ci 후 npm run build로 웹을 빌드합니다. API/Worker는 해당 uv.lock을 사용하세요. 새 외부 의존성·승인 음성·모델은 포함하지 않습니다. 기존 .env, 모델, 사용자 데이터는 보존하세요.

성우별 호흡 정책 변경으로 preview cache 검증을 다시 해야 합니다. 실제 5성우 음질 승인은 승인 reference와 모델을 확보한 뒤 별도 청취합니다. 파형은 선택적 20MB/5분 이하 WAV 분석입니다.

상세: docs/INTELLIGENT_STUDIO_0.11.37.md, docs/HANDOVER.md, docs/NEXT_UPDATE.md.
