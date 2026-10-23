# NEXT UPDATE

현재 기준: 0.11.75 · Multi-Clip Capture Recovery

## 목표 버전

0.11.76 · Cross-PC Voice Capture Validation

- 다른 Windows PC의 Chrome/Edge 일반 창에서 공개 사이트 저장 버튼을 눌러 **선택한 기본 성우**의 WAV/MP3 다운로드·청취·음색 일치를 검증합니다. 이 PC의 Chrome/Edge 실제 MP3 버튼과 Chrome WAV 링크 검증은 `docs/PUBLIC_VOICE_DOWNLOAD_0.11.73.md`를 기준으로 삼습니다. 다른 PC의 Dock·타임라인 재생 연결도 확인합니다.
- 다른 PC에서 보조 앱 0.11.74의 장치 이름과 무음 신호 피크를 확인하고, 성우 재생·장치 출력·로컬 연결·MP3 변환 중 실패 지점을 좁힙니다.
- 0.11.75의 7개 클립·26초 MP3/WAV 성공을 기준으로 3분 이상 단일 클립, 128MB 한계, 취소 후 실제 UI 재시도와 불필요한 정적 구간을 검증합니다.
- NAudio 3 최신 `WasapiRecorder`로 이전해 레거시 API 경고를 없애되 동일 출력 신호 검증을 반복합니다.

예상 영역: `tools/windows-audio-bridge`, `src/export/windowsLoopbackCapture.ts`, `GeneratedAudioSave`, Windows 다른 PC 실기기 QA. 0.11.75는 이 PC에서 7개 클립 저장과 보조 앱 취소→재시작 상태를 확인했습니다. 다른 PC, 긴 단일 클립·정적 구간, NAudio 이전은 다음 버전으로 넘깁니다.
선행 조건: 사용자 PC와 다른 Windows PC에서 설치된 음성 목록 및 실제 청취 검증. 성우 다섯 음색은 각 PC의 음성 설치 상태에 의존하며, 보조 앱이 설치되지 않은 음색을 새로 합성하지는 않습니다. 시스템 믹스에는 다른 앱의 소리가 함께 들어갈 수 있습니다.
