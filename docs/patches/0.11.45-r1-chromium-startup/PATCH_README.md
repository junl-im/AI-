# 0.11.45 R1 Chromium Startup 패치

기준: 0.11.45 (9c9322f). 제품 버전은 0.11.45 그대로입니다. 저장소 루트에 덮어쓰세요. 기존 파일 삭제는 없습니다. GitHub Desktop에서 같은 커밋을 동기화했다면 덮어쓰기 불필요.

데스크톱 Chromium CI 시작 지연만 복구합니다. 30초 기다림 뒤 새 프로필로 한 번만 재시도하며 계속 실패하면 CI를 실패 처리합니다. 화면 기준과 제품 음성/동의 정책은 유지됩니다.

상세: docs/CHROMIUM_STARTUP_0.11.45_R1.md, docs/HANDOVER.md, docs/NEXT_UPDATE.md.
