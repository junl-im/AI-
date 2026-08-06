# Heartbeat 6.8.3.1 → 6.8.3.2 덮어쓰기 패치

## 적용 방법

1. GitHub Desktop에서 현재 변경사항을 커밋하거나 별도 백업합니다.
2. `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.8.3.1-to-6.8.3.2-runtime-update-performance-patch.zip`을 저장소 루트에 압축 해제합니다.
3. 같은 경로의 파일 덮어쓰기를 허용합니다. `.git`, `node_modules`, 빌드 산출물은 포함되지 않습니다.
4. GitHub Desktop의 Changes에서 `PATCH_MANIFEST.txt`와 변경 파일을 확인합니다.
5. Push 후 GitHub Actions Web quality가 녹색인지 확인합니다.

## 적용 기능

- 배포 `version.json` 기반 새 버전 감지와 명시적 적용 새로고침
- 설정 화면의 현재 빌드·업데이트 확인 카드
- Home 상태를 유지한 보조 화면 lazy loading
- Engine Doctor 오래된 응답 덮어쓰기 차단
- 온라인 복귀 자동 재진단과 마지막 확인 시각
- Runtime update·performance preflight 계약

## 주의

이번 패치는 package dependency와 lock 버전을 올리지 않습니다. 다음 Heartbeat 6.8.4의 Trust Key Rotation 변경도 포함하지 않습니다.
