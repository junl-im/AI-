# NEXT UPDATE

현재 기준: 0.11.77 · Long-Form MP3 Worker

## 목표 버전

0.11.78 · Original Voice Cross-PC & Long Capture QA

- 다른 Windows PC의 Chrome/Edge에서 **실제 기본 성우** MP3/WAV를 내려받아 재생·음색을 확인합니다. 설치 음성 목록과 성우 선택 결과를 함께 기록합니다.
- 3분 이상 실제 단일 대사와 여러 쉼 구간의 원본 음색 녹음 파일 길이·피크·디코딩, 취소 후 재시도와 128MB 경계를 검증합니다.
- Windows 보조 앱을 NAudio 3 `WasapiRecorder`로 이전하는 시험 빌드를 만들고 이전/기존 빌드의 출력 음질·무음 진단을 비교합니다. 실기기 증거가 통과하기 전까지 현 바이너리를 유지합니다.
- Worker 실패 시 메인 스레드 복귀의 장시간 응답성과 모바일·Edge 호환성을 추가 측정합니다.

예상 영역: `tools/windows-audio-bridge`, `src/export/windowsLoopbackCapture*`, `GeneratedAudioSave`, 다른 PC 실기기 QA. 이번 버전은 181초 합성 WAV의 MP3 Worker·실제 다운로드를 검증했습니다. 성우의 3분 연속 녹음과 다른 PC 결과는 확인하지 않았습니다.
선행 조건: 다른 Windows PC의 음성 설치 상태, 사용자 청취·다운로드 검증, NAudio 시험 빌드. 시스템 믹스에는 다른 앱의 소리가 함께 들어갈 수 있습니다.
