# SoriON AI 0.11.53 → 0.11.54 패치

기준 버전: **0.11.53**. `package.json` 버전을 먼저 확인하고 작업 중인 변경을 백업하거나 커밋하세요. 패치 ZIP을 저장소 루트에 압축 해제해 덮어쓴 뒤 `npm ci`, `npm run quality:preflight`, `npm run test:ci`, `npm run build`를 실행합니다. `.git`은 포함하지 않으며 삭제할 파일은 없습니다.

이번 패치는 타임라인 클릭 위치 탐색, 사용자가 선택하는 한국어 로컬 모델 WAV 생성, 클립별·전체 WAV 다운로드와 버전 표시를 추가합니다. 첫 모델 다운로드 약 380MB, 기존 성우와 다른 근사 스타일, 새로고침 후 Blob 음원 소멸에 주의하세요. 생성 후 WAV를 파일로 내려받아 보관하세요.

파일 목록은 `PATCH_MANIFEST.txt`, 기술 근거는 `docs/LOCAL_WAV_ENGINE_0.11.54.md`를 참조하세요.
