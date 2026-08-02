# NEXT UPDATE

현재 기준: `0.9.3-alpha.3 · Reproducible CI Lock Evidence Gate`

## 목표 버전

`0.9.3-beta.1 Real Device Verification, STT Measurement & Final Export`

## 방향

엔진을 더 늘리지 않는다. 다음 업데이트는 **실기기 검증**, **STT 실측**, **최종 Export 완성**의
세 축만 완료한다. CosyVoice, Faster Whisper, FFmpeg가 사용자 장치에서 실제로 연결되는 경로와
측정값을 제품 판단 기준으로 삼는다.

## 1. 실기기 검증

- Windows + NVIDIA CUDA, Apple Silicon MPS, CPU 저속 모드의 readiness와 생성 성공을 기록
- Android Chrome·iOS Safari PWA의 API 자동 연결과 Browser Speech 안전망 확인
- 10분·30분·60분 원고의 첫 음성 지연, RTF, 메모리, VRAM, 실패·재시도율 측정
- 모델·FFmpeg·API가 없을 때 성공으로 위장하지 않고 정확한 복구 안내 제공

## 2. STT 실측

- Faster Whisper 한국어 전사 Adapter와 모델 readiness 연결
- 원문 대비 CER·WER, 숫자·날짜·금액·단위·영문·고유명사 오류율 기록
- 오류 임계값을 넘은 문장만 제한 횟수로 재생성하고 완료 구간은 재사용
- 평가 문장과 실제 장문 샘플의 결과를 엔진·장치·모델 버전별로 보존

## 3. 최종 Export 완성

- 타임라인 순서, 쉼 블록, 사용자 수정과 재생성 결과를 반영한 전체 WAV 병합
- FFmpeg가 준비된 경우 MP3 변환, 준비되지 않으면 WAV만 명확히 제공
- 문장별 실제 시간 범위 기반 SRT·VTT 생성
- 실패·취소 구간이 있으면 불완전 Export를 기본 차단하고 명시적 선택만 허용

## CosyVoice 모델 롤오버 원칙

- 코드 버전과 모델 ID·버전·SHA-256·라이선스를 별도 관리한다.
- 새 모델은 기존 모델을 덮어쓰지 않고 새 매니페스트와 경로로 병행 설치한다.
- 동일 평가 세트와 실기기 표에서 품질·지연·메모리를 비교한 뒤 기본 모델을 전환한다.
- 전환 뒤에도 이전 매니페스트를 한 릴리스 동안 유지해 즉시 rollback할 수 있어야 한다.

## 선행 조건

- GitHub Actions에서 검증 생성한 `package-lock.json`, API·Worker `uv.lock`을 커밋한다.
- 일반 CI의 `npm ci`, `uv sync --locked`, 전체 npm tree, lint, typecheck, test, build가 녹색이어야 한다.
- 실제 모델 가중치, 사용자 음성, 라이선스 동의값과 Secret은 저장소·릴리스 ZIP에 포함하지 않는다.
