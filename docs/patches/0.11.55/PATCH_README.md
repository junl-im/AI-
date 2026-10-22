# SoriON AI 0.11.54 → 0.11.55 패치

적용 전 `package.json` 버전이 0.11.54인지 확인하고 작업 중인 변경을 커밋하거나 백업하세요. 패치 ZIP을 저장소 루트에 압축 해제해 덮어쓴 후 `npm ci`, `npm run quality:preflight`, `npm run test:ci`, `npm run build`를 실행합니다. `.git`은 포함되지 않으며 삭제할 파일은 없습니다.

전체 로컬 모델 음원을 WAV 또는 MP3로 저장할 수 있습니다. 대본 TXT 다운로드를 제거했고 대사 추가 버튼은 대사 트랙 안에 남습니다. 설정은 상단 한 곳에서 열며 `첫 화면으로` 버튼으로 초기 화면에 돌아갑니다. MP3 인코더 `@breezystack/lamejs@1.2.7`은 LGPL-3.0 라이선스입니다. 첫 로컬 모델 다운로드와 생성 파일의 새로고침 후 소멸 한계는 0.11.54와 같습니다.

변경 파일은 `PATCH_MANIFEST.txt`를 참조하세요.
