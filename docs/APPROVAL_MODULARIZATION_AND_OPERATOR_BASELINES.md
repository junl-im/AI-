# Approval Modularization & Operator Baselines

적용 버전: **SoriON AI 0.10.1**

## 승인 서비스 분리

기존 `voice_preset_approval.py`는 승인·재서명·갱신·파일 저장·이력을 한 파일에서 처리했습니다.
0.10.1에서는 공개 서비스 API를 유지하면서 다음 책임을 분리했습니다.

- `voice_preset_approval_primitives.py`: canonical JSON, SHA-256, manifest diff, 서명 payload
- `voice_preset_approval_storage.py`: 원자 manifest 교체, `fsync`, 승인 history JSONL
- `voice_preset_renewal.py`: 동의·권리 만료, WAV 결박, 신뢰 키 재서명 대기열
- `voice_preset_approval.py`: 승인·재서명·롤백 orchestration과 잠금 경계

승인 apply·재서명·rollback은 기존 thread lock, SQLite writer lease와 fencing token,
OS file lock, 적용 직전 WAV·manifest 재검증을 그대로 유지합니다.

## 운영자 확정 기준선

자동 기준선은 최초 5건과 최근 5건의 비중첩 비교를 계속 사용합니다.
운영자 확정 기준선은 별도로 최근 5건을 snapshot으로 저장합니다.

기준선 그룹은 다음 값이 모두 같아야 합니다.

- 엔진 ID
- 프리셋 ID
- 모델 ID·버전·digest
- 장치 profile
- accelerator 이름
- GPU 이름

snapshot에는 원본 음성이나 사용자 문장이 아니라 측정 ID·시각 목록의 SHA-256과 집계값만 저장합니다.
기준선 확정·교체·폐기는 운영자 인증과 명시적 확인 문구가 필요합니다.

## 회귀 판정

운영자 기준선과 최근 5건을 다음 항목으로 비교합니다.

- 실패율
- 첫 음성 P95
- RTF P95
- 최종 음원 교체 오차 P95

자동 기준선과 운영자 기준선은 서로 덮어쓰지 않습니다. 운영자 기준선을 폐기해도 자동 평가는 계속됩니다.
