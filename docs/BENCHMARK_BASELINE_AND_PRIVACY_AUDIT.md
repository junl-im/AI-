# Benchmark Baseline & Privacy-Safe Audit Bundle

기준 버전: `0.9.5`

## 자동 성능 기준선

Worker 자동 telemetry는 모델 ID·버전·digest, 엔진, 프리셋, 장치 profile,
가속기와 GPU가 같은 경우에만 하나의 그룹으로 묶습니다. 모델이나 장치가 바뀌면
기존 성능 저하로 오판하지 않고 새 그룹으로 분리합니다.

각 그룹은 최소 10건이 모인 뒤 다음 두 구간을 비교합니다.

- 기준 구간: 시간순 최초 5건
- 최근 구간: 시간순 최신 5건
- 두 구간은 비중첩이며 동일 레코드를 양쪽에 재사용하지 않습니다.

판정 지표는 실패율, first audio P95, RTF P95, 최종 WAV handoff 오차 P95입니다.
단일 지표 악화는 `warning`, 두 개 이상 또는 최근 실패율 20% 이상은 `regressed`로
표시합니다. 10건 미만은 `insufficient`이며 성능 통과로 표현하지 않습니다.

이 기준선은 자동 회귀 경보용입니다. 실제 장치 인증과 10·30·60분 soak를 대체하지
않으며, 저장소에서 임의 성능 수치를 생성하지 않습니다.

## 개인정보 제외 감사 묶음

`GET /api/v1/quality/privacy-audit-bundle`은 다음 정보만 JSON으로 만듭니다.

- 승인 event, voice ID, 시각, WAV·manifest·검수 묶음 SHA-256
- 서명 방식과 key ID
- active signing 준비 여부, 신뢰 key 개수, 교체 잔여 수와 갱신 우선순위 집계
- 모델·프리셋·장치 profile별 성능 회귀 판정
- 실기기 coverage와 누락 시나리오

다음 값은 포함하지 않습니다.

- 실제 WAV와 모델 가중치
- 동의서·권리 원문
- HMAC 비밀키와 운영자 token
- actor, reviewer, 사용자 선언 ID와 IP
- 승인 signature 원문
- GPU 원문 이름

GPU 정보는 원문 대신 장치 profile·가속기·GPU 문자열을 결합한 SHA-256 fingerprint로
대체합니다. 이 fingerprint는 동일 조건을 구분하기 위한 값이며 실제 장치 신원을
보증하지 않습니다.

다운로드 전에 `POST /api/v1/quality/privacy-audit-bundle/verify`가 레코드별 SHA-256,
정규화 레코드 SHA-256과 전체 bundle SHA-256을 다시 계산합니다. checksum은 변조
탐지용이며 발행자 신원이나 측정 진실성을 보증하는 전자서명이 아닙니다.
