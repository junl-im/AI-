# 0.11.74 Windows 출력 장치 진단 및 다운로드 검증

2026-10-23 KST, 이 Windows PC에서 자체 포함 x64 보조 앱을 빌드해 실행했습니다. 공개 Pages 출처의 `/status`가 `200`과 `outputDevice: 헤드폰(High Definition Audio Device)`, `outputState: Active`, `helperVersion: 0.11.74`를 반환했습니다. 보조 앱이 연 토큰 주소로 공개 Pages 0.11.73에 접속해 대사 2개를 생성하고 실제 `Windows 보조 앱으로 원래 음색 MP3 저장` 버튼과 WAV 링크를 눌렀습니다. MP3 110,759바이트(MPEG 프레임 `fffb90c4`, 디코딩 6.922초, 피크 0.565), WAV 607,728바이트(`RIFF`)를 받았습니다. 새 UI의 출력 장치 표시도 컴포넌트 테스트로 검증했습니다.

보조 앱은 녹음 시작 시 기본 출력 장치의 이름을 보관합니다. 캡처 종료가 무음이면 장치 이름과 신호 피크를 오류에 포함합니다. 이 정보로 연결 실패와 Windows 출력 무음을 구별할 수 있지만, 특정 앱이 다른 출력 장치로 소리를 보낸 경우나 사람이 실제로 들은 음색까지 자동 판별하지는 못합니다.

배포 ZIP `SoriON-Audio-Bridge-0.11.74-win-x64.zip`은 50,501,066바이트, SHA-256 `A48A1B8A4F049D1809F1478E1D461E9DE76D8F10DB8A483AF77BCF580B852029`입니다. 기존 0.11.71 ZIP은 과거 버전 호환을 위해 유지합니다. NAudio `WasapiLoopbackCapture`의 사용 중단 경고는 남아 있습니다. 이 PC의 Chrome 헤드리스와 Windows 보조 앱으로 검증했으며 다른 Windows PC, Edge 일반 창, 긴 대사·취소 복구, 성우별 청감 검증은 수행하지 못했습니다.
