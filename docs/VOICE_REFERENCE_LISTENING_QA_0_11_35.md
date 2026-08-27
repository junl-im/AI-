# SoriON AI 0.11.35 · Voice Reference Intake & Listening QA

0.11.35는 성우 자산을 단순히 WAV 파일 존재 여부로 승인하지 않습니다. 실제 권리·동의·SHA-256·model/reference fingerprint를 통과한 reference와 별도로, 사람이 동일한 QA 문장을 듣고 성우별 자연스러움과 피로도를 기록해야 합니다.

## Listening QA gate

- 대상: 혜린, 도윤, 소리, 준호, 민준
- 시나리오: 일상 대화, 설명·정보, 장문·오디오북, 다큐·사건, 광고·숏폼
- 평가축: 부드러움, 현실 속도, 성우 개성, 발음 명료도, 호흡·쉼, 낮은 피로도
- READY: 5개 시나리오 완료 + 평균 4.0 이상 + 모든 세부 항목 3점 이상 + 장문 낮은 피로도 4점 이상
- 한 항목이라도 2점 이하이면 READY 금지

## 원칙

성우 차별화는 과도한 배속이나 pitch 조작이 아니라 reference timbre, cadence, articulation, pause identity를 우선합니다. 실제 rights-cleared reference가 없는 상태에서는 browser/system fallback을 Neural READY로 승격하지 않습니다. Listening QA 기록은 로컬에 저장하며 사용자가 명시적으로 JSON 내보내기를 실행할 때만 파일로 나갑니다.
