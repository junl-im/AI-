# SoriON preset reference voices

실제 CosyVoice 프리셋 음색을 사용하려면 동의받은 한국어 기준 WAV를 이 폴더 또는 별도 폴더에 다음 이름으로 둡니다.

- `sori-warm.wav` — 혜린 · 여성 · 따뜻한 일상 톤
- `on-clear.wav` — 도윤 · 남성 · 또렷한 설명 톤
- `dam-calm.wav` — 소리 · 중성 · 편안한 장문 톤
- `jun-deep.wav` — 준호 · 남성 · 낮고 안정적인 다큐·오디오북 톤
- `min-energetic.wav` — 민준 · 남성 · 생동감 있는 광고·숏폼 톤

`START_ENGINE.cmd`는 이 폴더를 자동 연결합니다. API를 직접 실행할 때만 환경변수 `SORION_COSYVOICE_PRESET_DIRECTORY`에 폴더 경로를 설정합니다.

각 WAV는 다음 조건을 만족해야 합니다.

- 권리자와 화자의 명시적 동의를 받은 한국어 기준 음성
- PCM WAV, 모노 또는 스테레오
- 16kHz~48kHz, 1초~30초, 25MB 이하
- 과도한 무음과 클리핑이 없는 깨끗한 발화

음성 파일은 로컬에서만 관리하고 저장소에는 커밋하지 않습니다. 프리셋 이름과 성별 표시는 음색 탐색을 돕는 메타데이터이며 실제 화자의 정체성이나 품질을 보증하지 않습니다.
