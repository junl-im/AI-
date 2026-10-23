# NEXT UPDATE

현재 기준: 0.11.72 · Windows Helper Connection Recovery

## 목표 버전

0.11.73 · Browser Voice End-to-End QA

- 배포된 Pages의 실제 저장 버튼을 사용자 PC와 다른 PC의 Chrome/Edge에서 클릭하고, **선택한 기본 성우**의 WAV/MP3 다운로드·청취·음색 일치를 검증합니다. 0.11.71의 Chrome 로컬 개발 페이지 `sori-warm`→Heami MP3 성공을 기준으로 삼습니다. 다른 PC의 Dock·타임라인 재생 연결도 확인합니다.
- 보조 앱에 녹음 신호·출력 장치 진단을 추가하고, 실패가 성우 재생·장치 출력·로컬 연결·MP3 변환 중 어디서 생겼는지 구별합니다.
- 클립 재생 종료 전후 불필요한 정적 구간을 다듬고, 긴 대사/여러 클립의 녹음 크기·시간·취소 복구를 실측합니다.
- NAudio 3 최신 `WasapiRecorder`로 이전해 레거시 API 경고를 없애되 동일 출력 신호 검증을 반복합니다.

예상 영역: `tools/windows-audio-bridge`, `src/export/windowsLoopbackCapture.ts`, `GeneratedAudioSave`, Windows Chrome/Edge 실기기 QA. 0.11.72에서는 시작 시 토큰 보관과 연결 실패 사유 표시까지 완료했으며, 배포 사이트 실제 버튼·다른 PC 음성 파일의 실측은 이 버전으로 이월했습니다.
선행 조건: 사용자 PC와 다른 Windows PC에서 설치된 음성 목록 및 실제 청취 검증. 성우 다섯 음색은 각 PC의 음성 설치 상태에 의존하며, 보조 앱이 설치되지 않은 음색을 새로 합성하지는 않습니다. 시스템 믹스에는 다른 앱의 소리가 함께 들어갈 수 있습니다.
