# NEXT UPDATE

Current baseline: 0.11.36 · Calm Studio & Research-led UX

## 목표 버전

0.11.37 · Prosody Director & Listening Verification

사용자의 광범위한 비교 조사와 디자인 개선 요청을 먼저 반영해 기존 0.11.36 자연스러움 계획을 이월했습니다.

1. 성우별 cadence/softness/articulation/pause 계획과 한국어 숫자·영문·괄호·인용문 회귀 세트를 강화합니다.
2. 승인된 실제 Neural reference로 장문 청취 피로·발음·속도를 측정하고 낮은 점수는 자동 승인하지 않습니다.
3. 기존 STT를 활용한 원문 대조와 wavesurfer.js 파형 미리보기를 별도 검토합니다. 긴 파일 메모리·지연 로딩·부분 오디오 전환을 먼저 확인합니다.
4. 성우 선택/설정 창의 키보드·포커스 흐름을 점검하고 필요할 때 Radix를 점진 도입합니다.
5. 초기 JS 번들 분할을 검토합니다. 새 엔진 추가는 기존 CosyVoice 경로 실측 이후로 둡니다.

예상 영역: prosody 계획/성우 preset, Listening QA, 생성 결과 미리보기, 선택 대화상자, Vite 청크 구성.

선행 조건: 현재 CI green, 승인 음성 자산과 사용 권리, 실제 엔진 준비, 모바일 실기기 확인. 모델 없이는 품질 READY를 주장하지 않습니다. 과속 보정·자동 업로드·측정 전 동시성 확대를 금지합니다.

유지 결정: shell-free Windows npm CLI 실행과 lock fallback/restoration, Chromium 자동 debug port/fail-fast cleanup, 동작 줄이기 설정, 빈 대본 전용 예제, 기본 편집과 프로 패널 분리. 유료 API 자동 연결 없음. 픽셀 baseline은 별도 승인된 증거만 사용합니다.
