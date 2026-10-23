# NEXT UPDATE

현재 기준: 0.11.76 · Download Engine Stability

## 목표 버전

0.11.77 · Long-Form Export & Cross-PC Verification

- 다른 Windows PC의 Chrome/Edge에서 원본 기본 성우 MP3/WAV를 실제 내려받아 재생·음색을 확인합니다. PC마다 설치 음성이 다르므로 목록과 선택 결과를 함께 기록합니다.
- 3분 이상 단일 클립과 여러 쉼 구간의 파일 길이·피크·디코딩, 취소 후 재시도, 128MB 경계를 검증합니다.
- `@breezystack/lamejs`를 전용 Web Worker로 옮겨 긴 MP3 인코딩 시 UI 응답성과 메모리를 실측합니다. Worker 번들 호환성·브라우저 테스트가 선행 조건입니다.
- NAudio 3 `WasapiRecorder` 이전을 Windows 보조 앱 실기기 시험으로 검증합니다. 기존 바이너리는 이전이 입증될 때까지 유지합니다.

예상 영역: `src/export/wavToMp3*`, `GeneratedAudioSave`, `tools/windows-audio-bridge`, 다른 PC 실기기 QA. 이번 버전은 WAV 실패 복구·MP3 진행률·취소·다운로드 우선을 마쳤으며 다른 PC 결과와 원본 5성우의 음색 일치는 확인하지 않았습니다.
선행 조건: 다른 Windows PC의 음성 설치 상태와 청취·다운로드 검증. 시스템 믹스에는 다른 앱의 소리가 함께 들어갈 수 있습니다.
