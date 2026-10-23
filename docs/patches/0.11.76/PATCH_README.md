# SoriON AI 0.11.75 → 0.11.76 덮어쓰기 패치

기준 버전은 정확히 **0.11.75** (`96afb0f`)입니다. 작업 중인 변경을 커밋하거나 백업한 뒤 패치 ZIP을 저장소 루트에 압축 해제해 덮어쓰세요. `.git`은 포함하지 않습니다. 삭제 파일은 없습니다.

Windows 기본 성우 녹음이 완료되면 WAV 링크가 먼저 열리고 MP3 변환 실패 시 WAV 자동 다운로드가 시작됩니다. MP3 변환 진행률·취소와 브라우저 저장소에 앞선 파일 다운로드를 적용했습니다. Windows 보조 앱은 **0.11.74** 바이너리를 계속 사용하며 별도 재설치가 필요하지 않습니다.

적용 후 `npm ci`, `npm run quality:version-sync`, `npm run lint`, `npm run typecheck`, `npm run test:ci`, `npm run build`를 실행하세요. 보조 앱을 켠 상태에서 기본 성우를 선택해 WAV/MP3를 실제 내려받고 재생하세요. MP3가 실패하면 WAV 링크와 자동 다운로드를 확인하세요. 파일별 목록은 `PATCH_MANIFEST.txt`를 참조하세요.
