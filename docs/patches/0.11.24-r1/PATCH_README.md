# 0.11.24 R1 PATCH README

기준: `0.11.24 · Recovery Batch & Editor Responsibility Split`  
결과: `0.11.24 R1 · Voice Pace Calibration`  
제품 semver: `0.11.24` 유지

## 적용

기준 0.11.24 저장소 루트에 PATCH ZIP을 그대로 압축 해제해 덮어씁니다. `.git`은 포함하지 않습니다.

## 변경 핵심

- 혜린 1.00 / 도윤 1.04 / 소리 0.98 / 준호 0.98 / 민준 1.08로 기본 Voice pace 보정.
- 소리/준호의 자연 속도 범위를 상향해 Voice 변경 시 사용자가 선택한 빠른 속도를 과도하게 낮추지 않음.
- Frontend/API multiplier 동기화 회귀 테스트와 static contract 추가.
- MY VOICE cadence 계약은 변경하지 않음.

삭제 파일은 없습니다.
