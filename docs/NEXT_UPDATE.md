# NEXT UPDATE

현재 기준: `0.9.3-alpha.2 · Web Quality Toolchain Stabilization`

## 목표 버전

`0.9.3-beta.1 Local STT Verification & Final Audio Export`

## 방향

검증된 로컬 모델 온보딩 기반 위에 Faster Whisper와 FFmpeg를 먼저 연결한다. 엔진 수를 늘리기보다
원문 대비 한국어 정확도와 장문 최종 결과물이라는 사용자 가치가 확인되는 경로를 우선한다.

## 1. Faster Whisper 한국어 검수 Adapter

- 선택 설치형 로컬 Faster Whisper Adapter와 readiness 진단
- 생성 음성 전사와 원문의 CER·WER 계산
- 숫자·날짜·금액·단위·영문·고유명사 오류 분류
- STT 모델이 없으면 검수 미실행으로 표시하고 합성 성공으로 위장하지 않음

## 2. 전체 WAV·MP3·자막 Export

- 현재 타임라인 순서와 쉼 블록을 반영한 WAV 병합
- FFmpeg가 있을 때만 MP3 변환 제공
- 문장별 시간 범위로 SRT·VTT 출력
- 실패·취소 블록이 있으면 불완전 결과를 명시하고 사용자가 선택한 경우에만 내보냄

## 3. 실패 문장 자동 재생성

- STT 오류 임계값을 넘은 문장만 새 job ID로 재생성
- 완료 음원과 사용자 수정 블록은 재사용
- 재시도 횟수 상한과 엔진 circuit breaker 유지
- 원문 재작성은 하지 않고 발음 사전·정규화 힌트만 적용

## 4. 다음 Adapter

- DeepFilterNet3 선택적 노이즈 제거
- OpenVoice V2 동의 기반 음색 변환
- Resemble Enhance는 라이선스·성능 검증 전 연구 경로로 유지

## 선행 조건과 위험

- 실제 모델 가중치와 공식 체크섬은 저장소·릴리스 ZIP에 포함하지 않는다.
- Faster Whisper·FFmpeg 설치 여부와 CPU·GPU 지연을 실제 장치에서 측정해야 한다.
- 0.9.3-alpha.2의 Web 도구체인을 GitHub Actions에서 실제 설치·lint·typecheck·test·build까지 확인한 뒤 기능 작업을 시작한다.
- 모델 매니페스트 생성값은 사용자가 확인한 모델 출처·버전·라이선스를 사용한다.
- Web 정식 검사는 공용 npm registry가 가능한 GitHub Actions에서 반드시 녹색을 확인한다.
- 녹색 확인 뒤 `package-lock.json`을 생성·커밋하고 CI 설치를 `npm ci`로 전환한다.
- Python 3.10 uv·Ruff 검사는 네트워크가 가능한 CI에서 반드시 재확인한다.
