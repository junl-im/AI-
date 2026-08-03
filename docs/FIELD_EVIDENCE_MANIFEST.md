# FIELD EVIDENCE MANIFEST

## schema v2

Quality evidence bundle은 device benchmark, STT regeneration comparison과 Export soak record를 정규화해 manifest를 만든다. `exported_at`은 묶음 digest에서 제외돼 같은 레코드 집합은 같은 SHA-256을 가진다.

manifest 필드:

- `record_count`와 category별 개수
- 각 레코드의 category, 익명 ID와 SHA-256
- 정규화된 전체 records SHA-256
- app version, redaction 상태, summary와 manifest를 포함한 bundle SHA-256

## 개인정보 최소화

기본 bundle은 실제 장치 이름을 device profile로 치환하고 브라우저 상세 버전과 자유 메모를 제거한다. 사용자 원문, 음원 바이트, 모델 파일, 로컬 경로, 전체 User-Agent, IP와 Secret은 포함하지 않는다.

## 검증 흐름

Web은 bundle을 받은 뒤 `POST /api/v1/quality/evidence-bundle/verify`로 같은 payload를 보내 서버 재계산 결과가 일치할 때만 JSON 다운로드를 시작한다. 파일명에는 전체 SHA-256 앞 12자를 넣는다.

## 해석 제한

manifest는 export 이후 내용 변경과 전송 오류를 탐지한다. 알고리즘과 payload를 아는 사람은 새 checksum을 계산할 수 있으므로 발행자 인증, 부인 방지 또는 측정 진실성의 전자서명이 아니다. 실제 READY와 성능 수치는 측정 장치·시간·표본 수·운영 절차와 함께 검토한다.

## Heartbeat 6.7 Intake

Quality Lab은 이 bundle을 최대 5MiB까지 preview하고 서버 검증을 통과한 경우에만 등록한다. 동일 bundle SHA 또는 이미 존재하는 record SHA가 하나라도 있으면 전체 등록을 차단한다. Heartbeat 6.6·6.7 Web quality run report는 별도 schema 검증을 거치며 timestamp가 달라도 같은 evidence SHA면 중복으로 본다.

