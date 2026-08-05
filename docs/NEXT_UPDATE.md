# NEXT UPDATE

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.7.1 · Voice Preset Fidelity Hotfix`

## 목표 버전

`0.9.3-beta.3 · Engine Heartbeat 6.8 · Preset Evidence Review, Consent Manifest & CosyVoice Benchmarks`

## 최우선 구현

- 프리셋별 `manifest.json`에 표시 이름, 선언 성별, 화자 동의, 사용 범위, 출처, WAV SHA-256과 검토자를 기록
- Engine Doctor에서 5개 전용 WAV 준비 여부, manifest 일치, 중복 WAV checksum과 청취 확인 상태를 분리 표시
- 5개 프리셋 동일 문장 A/B 미리듣기와 운영자 승인·거부 기록
- Browser/System/Melo가 실제로 선택한 화자 이름, 성별 판정 근거와 후보 부족 사유를 진단 화면에 표시
- CosyVoice 프리셋 5종의 first audio, RTF, 실패율, handoff 오차 전용 측정 schema

## 기존 6.8 범위 유지

- 가져온 증거의 검토 상태, 격리·삭제와 보존 기간 정책
- commit·run artifact와 evidence intake record의 출처 교차 확인
- 장치·GPU·모델 digest별 표본 수와 P50/P95 집계
- 로컬 ZIP의 streaming writer 검토와 저메모리 모바일 대안
- 검증된 package-lock이 포함된 독립 release snapshot 확정
- Android Chrome·iOS Safari·설치형 PWA 실제 장시간 증거 등록

## 선행 조건과 위험

- 실제 5개 화자 WAV, 명시적 동의와 이용 권리 자료가 필요합니다.
- 음성 파일만으로 성별·신원·권리를 자동 판정하지 않습니다.
- 기기 내장 음성의 이름과 성별 메타데이터는 운영체제마다 다르므로 사람이 청취 검토해야 합니다.
- 실제 모델·기기 없이 READY, 인물 일치 또는 성능 수치를 자동 생성하지 않습니다.
- 프리셋 후보 부족을 해결하기 위해 반대 성별이나 같은 화자를 다시 묵시적으로 허용하지 않습니다.
