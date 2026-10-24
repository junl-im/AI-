# NEXT UPDATE

현재 기준: 0.11.79 · Byeol Voice Playback Fix

## 목표 버전

0.11.80 · Byeol Listening QA & Cross-PC Download

- 별하의 운세 결과·장문 대본을 실제로 듣고 혜린·소리와 A/B 비교합니다. 이제 별하 미리듣기와 생성은 F1 WAV로 통일됐으므로 장문 운율과 음량을 검증합니다.
- 다른 Windows PC의 Chrome/Edge에서 별하와 기존 기본 성우의 MP3/WAV를 내려받아 재생·음색을 확인합니다. 설치 음성 목록과 성우 선택 결과를 함께 기록합니다.
- 3분 이상 실제 단일 대사와 여러 쉼 구간의 원본 음색 녹음 파일 길이·피크·디코딩, 취소 후 재시도와 128MB 경계를 검증합니다.
- Windows 보조 앱을 NAudio 3 `WasapiRecorder`로 이전하는 시험 빌드를 만들고 이전/기존 빌드의 출력 음질·무음 진단을 비교합니다. 실기기 증거가 통과하기 전까지 현 바이너리를 유지합니다.
- Worker 실패 시 메인 스레드 복귀의 장시간 응답성과 모바일·Edge 호환성을 추가 측정합니다.
- 0.11.79 로컬 브라우저에서 짧은 별하 대본의 MP3 저장 응답이 비정상적으로 오래 걸린 원인을 측정하고 변환 경로의 시간 제한·진행률·복구를 보강합니다.

예상 영역: `src/tts/supertonicWav*`, `src/quality/voiceListeningQa*`, `src/export/windowsLoopbackCapture*`, `tools/windows-audio-bridge`, 다른 PC 실기기 QA. 0.11.79는 별하 선택·미리듣기·생성 경로를 F1 파일 음성으로 연결했습니다. 장문 청감·다른 PC 결과는 다음 검증 대상입니다.
선행 조건: 다른 Windows PC의 음성 설치 상태, 사용자 청취·다운로드 검증, NAudio 시험 빌드. 별하 전용 실제 화자 기반 CosyVoice 음색은 승인된 WAV·동의·권리·사람 검수가 선행되어야 합니다. 시스템 믹스에는 다른 앱의 소리가 함께 들어갈 수 있습니다.
