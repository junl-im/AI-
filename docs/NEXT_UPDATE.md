# NEXT UPDATE

Current baseline: 0.11.38 · Streamed Waveform & Leaner Controls

## 목표 버전
0.11.39 · Voice Evidence & Field Performance

1. 승인된 5성우 reference WAV·권리·CosyVoice 모델 경로를 확보하고 동일 한국어 장문·숫자·영문·종결 대본을 실제 생성해 청취합니다. 기준 미달은 READY로 올리지 않습니다.
2. 성우별 호흡·속도는 실제 측정 후 조정하고 정책 변경 시 cache 무효화·재청취를 유지합니다.
3. 모바일 실기기에서 큰 WAV 파형의 메모리·지연·취소·재생 동시 사용을 측정합니다. 다운로드 부담이 크면 서버 peak 캐시 또는 Web Worker를 검토합니다.
4. main JS 500kB 경고를 줄이되 세션 복구·대본 보존·접근성 계약을 유지합니다.

예상 영역: reference/Listening QA·prosody, streamWavPeaks·AudioWaveform, 초기 UI 청크.
선행 조건: 승인 WAV와 사용 권리·모델 환경, 실제 PC/모바일 장치, CI green. 현재 성우 자산 미제공으로 음질 인증은 미완료입니다.
유지 결정: 로컬 추천은 자동 생성·성우 변경을 하지 않음. 기존 세션 mount 유지. 유료 API·모델 자동 다운로드·음성 자동 업로드·측정 전 동시성 확대 없음.
