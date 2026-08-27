# NEXT UPDATE

Current baseline: `0.11.35 R2 · Web Quality Syntax Hotfix`

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
