# NEXT UPDATE

Current baseline: `0.11.35 R4 · Windows npm portability`

## 목표 버전

`0.11.36 · Prosody Director & Long-form Naturalness`

### 핵심 기능

1. 성우별 cadence/softness/articulation/pause identity를 문장부호와 문장 길이에 따라 실제 prosody 계획으로 확장합니다.
2. 긴 문장에서 과도한 정속 낭독을 피하고 절·문장 경계 pause를 자연스럽게 조절합니다.
3. 숫자·영문·괄호·인용문이 포함된 한국어 문장의 발음/호흡 회귀 세트를 강화합니다.
4. Listening QA에서 낮은 점수를 받은 축을 preset별 튜닝 제안으로 연결하되 자동 승인하지 않습니다.
5. 실제 Neural reference가 없으면 5/5 READY를 주장하지 않습니다.

### 유지할 결정

- 현실적인 말하기 속도를 벗어나는 과속 보정 금지.
- 장문 청취 피로도 4/5 미만은 성우 출시 인증 금지.
- local-only MY VOICE는 사용자 명시 동작 없이 서버에 자동 업로드하지 않습니다.

### R3에서 넘기는 결정

- visual CI는 고정 remote-debugging port를 다시 사용하지 않습니다.
- Chromium bootstrap failure는 15초대 fail-fast + 강제 child cleanup을 유지합니다.
- DBus 경고만으로 visual regression을 실패 처리하지 않습니다.
- 0.11.36 기능 개발은 현재 R3의 GitHub Actions Web quality green 확인 후 진행합니다.

### R4에서 넘기는 결정

- GitHub Desktop에서 로컬 변경을 검토한 뒤 commit/push합니다.
- npm 실행은 shell 없이 Node CLI를 사용하고 fixture는 Windows/Linux 공통으로 유지합니다.
- 다음 변경 영역은 voice prosody, 한국어 전처리, Listening QA이며 GitHub CI green과 실제 승인된 voice/model 검증이 선행 조건입니다.
