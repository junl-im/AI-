# SoriON AI 0.11.76 → 0.11.77 덮어쓰기 패치

기준 버전은 정확히 **0.11.76** (`8f2040f`)입니다. 작업 중인 변경을 커밋하거나 백업한 뒤 패치 ZIP을 저장소 루트에 압축 해제해 덮어쓰세요. `.git`과 삭제 파일은 포함되지 않습니다.

긴 MP3 인코딩을 별도 Web Worker로 옮기고 취소·진행률을 연결했습니다. Worker가 시작되지 않는 브라우저는 이전 청크형 변환 경로를 사용합니다. Windows 보조 앱은 기존 **0.11.74** 바이너리를 계속 사용합니다.

적용 후 `npm ci`, `npm run quality:version-sync`, `npm run lint`, `npm run typecheck`, `npm run test:ci`, `npm run build`를 실행하세요. 실제 음성 WAV/MP3를 내려받아 재생하고 긴 파일 변환 중에도 화면이 반응하는지 확인하세요. 변경 파일 목록은 `PATCH_MANIFEST.txt`를 참조하세요.
