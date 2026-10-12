# 0.11.37 · Intelligent Studio & Prosody Director

## 구현 결과
밝은 라벤더 스튜디오, 성우 비교 카드, 대본 특성에 따른 추천과 청취 주의 안내를 추가했습니다. 추천은 로컬 규칙 분석이며 LLM 호출이나 자동 성우 변경·생성을 하지 않습니다. 기본 편집과 프로 패널 분리, 사용자의 대본 보존, 동작 줄이기 설정을 유지합니다.

| 기본 성우 | 강화한 용도 | 분할 기준(최대 글자) | 기본 구간 여백 |
|---|---|---:|---:|
| 혜린 | 따뜻한 대화 | 150 | 160ms |
| 도윤 | 숫자·단계 설명 | 140 | 190ms |
| 소리 | 장문 호흡 | 170 | 240ms |
| 준호 | 다큐멘터리 종결 | 160 | 280ms |
| 민준 | 짧고 경쾌한 전달 | 125 | 110ms |

기준은 기존 preset 속도 범위 내에서 적용됩니다. 숫자·영문·괄호가 많은 대본은 원문으로 판별해 속도와 여백을 보수적으로 보정합니다. 실제 음색은 승인 reference와 엔진에 달려 있으며 위 표는 청취로 입증한 음질 순위가 아닙니다.

## 엔진 점검과 개선
- 구간 파일에 부족한 끝 무음만 보충합니다. 점진 재생 구간을 연결한 PCM과 최종 PCM이 같도록 최종 병합의 중복 여백을 제거했습니다.
- FFmpeg 템포 보정은 60초 제한, 취소·시간 초과 시 프로세스 종료와 임시 파일 정리를 적용했습니다. 취소는 Worker job에도 전달합니다.
- prosody 정책 버전을 preview cache key에 포함했습니다. 이전 정책의 음원·검증 증거를 새 정책에 그대로 재사용하지 않습니다.
- 청취 READY는 모든 고정 시나리오의 자연스러운 속도 점수 4 이상을 요구합니다. 중복 시나리오는 최신 기록만 집계하고 알 수 없는 ID는 제외합니다.
- 추가 스트레스 대본은 숫자·날짜·영문·괄호·장문 경계를 점검하기 위한 자료입니다. 고정 QA 시나리오를 바꾸거나 자동 승인하지 않습니다.

## 파형·접근성·로딩
실제 결과 WAV에서 사용자가 ‘파형 보기’를 눌렀을 때만 분석합니다. 20MB/5분 이하 PCM 또는 float WAV로 제한하고 헤더를 검사한 뒤 Web Audio로 디코딩합니다. 채널 전체의 실제 진폭을 표시하며 키보드 탐색바를 제공합니다. 분석 종료 시 AudioContext를 닫고 화면 전환 시 요청을 취소합니다. 긴 파일·지원하지 않는 형식은 기존 플레이어를 사용합니다.

성우 선택창의 방향키/Home/End 이동과 Escape 후 포커스 복귀를 확인했습니다. 모달 포커스 순환은 숨김·inert·음수 tabindex 요소를 제외합니다. 타임라인을 필요할 때 불러와 main JS가 567.95kB에서 약 519kB로 감소했습니다. 여전히 500kB 경고가 있어 추가 분할이 필요합니다.

## 검증과 제한
웹·API·Worker 회귀 검사, lint/typecheck/build, 저장소 preflight, Chrome 8개 폭과 선택창·타임라인 동작을 확인합니다. 상세 결과는 CHANGELOG와 validation 증거에 기록합니다. SQLite TTL 테스트의 짧은 실제 sleep은 제어 가능한 시계로 교체해 Windows 시간 오차에 영향받지 않도록 했습니다.

승인된 실제 5성우 WAV 및 CosyVoice 모델이 이번 작업에 제공되지 않아 실제 Neural 생성·장문 청취·실기기 음질 인증은 하지 못했습니다. 합성 테스트 톤은 파형 디코딩 검사용으로만 쓰며 성우 품질 증거로 사용하지 않습니다. 유료 API·자동 업로드·새 모델 다운로드·생성 동시성 확대는 없습니다.

## 조사 반영
이전 [비교 조사](UIUX_RESEARCH_0.11.36.md)의 단계적 편집·성우 비교·지연 로딩을 반영했습니다. 현재 제한된 파형 요구에는 추가 라이브러리 대신 네이티브 Web Audio를 사용했습니다. 큰 파일의 peaks 서비스와 정밀 편집이 필요할 때 wavesurfer.js 도입을 다시 판단합니다.
- [MDN decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData)
- [MDN AudioContext.close](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/close)
- [Python asyncio subprocess](https://docs.python.org/3.10/library/asyncio-subprocess.html)
