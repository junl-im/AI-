# NEXT UPDATE

현재 기준: `0.9.2 Korean Voice Orchestrator Blueprint & Rule Director`

## 목표 버전

`0.9.3 Free Local Pipeline Adapters & Korean Verification`

## 방향

0.9.2에서 확정한 카탈로그를 실제 무료 로컬 Adapter로 연결한다. 엔진 수를 늘리는 것이 아니라 한국어 품질과 저사양 안정성을 통과한 단계만 제품 파이프라인에 승격한다.

## 1. 무료 모델 온보딩

- CosyVoice 3 모델 존재·체크섬·모델 카드 확인
- CPU·CUDA·Apple Silicon 프로필과 예상 메모리 진단
- 모델 다운로드는 사용자 명시 실행, 중단·재개와 저장 위치 선택
- 준비되지 않은 모델은 정상·추천으로 표시하지 않음

## 2. 실제 파이프라인 Adapter

- OpenVoice V2 동의 기반 음색 변환 Worker
- Faster Whisper 한국어 전사·발음 검수
- DeepFilterNet3 선택적 노이즈 제거
- Resemble Enhance 고품질 오프라인 후처리 실험
- FFmpeg WAV·MP3 병합과 자막 출력

## 3. 한국어 자동 품질 검수

- 원문과 생성 음성 STT 결과의 CER·WER 계산
- 숫자·날짜·금액·단위·영문·고유명사 오류 분류
- 문장 끝 억양과 문단 호흡의 블라인드 평가
- 실패 문장만 자동 재생성하고 완료 결과 재사용

## 4. AI Director 연결

- Rule Director 계획을 장문 제작 화면에 적용
- 사용자 발음 사전 저장과 프로젝트별 override
- 로컬 LLM은 선택 기능이며 없으면 규칙 기반으로 완전 동작
- 원고 재작성은 사용자가 명시적으로 허용한 경우에만 실행
