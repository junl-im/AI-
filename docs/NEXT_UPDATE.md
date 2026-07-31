# NEXT UPDATE

## 목표 버전

`0.5.0 Korean TTS Production Readiness`

## 목표

품질 연구소에서 얻은 진단과 A/B 결과를 저장·내보내고, 실제 MeloTTS 설치부터 장시간 생성 운영까지 반복 가능한 절차로 만든다.

## 예상 구현

- MeloTTS 설치 단계별 Setup Wizard
- 패키지·한국어 MeCab·모델 파일·장치별 상세 진단
- 모델 worker 프로세스 분리와 재시작
- 생성 진행률 SSE 또는 polling API
- 품질 별점·메모 IndexedDB 영구 저장
- JSON·CSV 품질 보고서 내보내기
- 평가 세트 일괄 실행과 중단·재개
- FFmpeg 선택 어댑터를 통한 샘플레이트 통일
- 긴 문장 생성 큐와 구간별 실패 재시도
- 외부 API 주소 설정과 연결 테스트
- 공개 음원 라우트 인증 설계 초안

## 예상 변경 영역

- `services/api/app/workers/`
- `services/api/app/services/quality_reports.py`
- `services/api/app/api/routes/quality.py`
- `src/pages/QualityPage.tsx`
- `src/quality/`
- `src/projects/`
- `docs/QUALITY_LAB.md`
- `docs/SECURITY.md`
- `docs/HANDOVER.md`

## 선행 조건

- 일반 개발 PC에서 `0.4.0` production build 통과
- 실제 MeloTTS 또는 시스템 음성으로 장문 병합 1회 성공
- 품질 연구소 A/B 결과 청취 확인
- GitHub Pages의 `BUILD v0.4.0` 확인

## 위험 요소

- MeloTTS 의존성과 최신 PyTorch·Python 조합이 충돌할 수 있습니다.
- 모델 프로세스를 분리하면 취소·정리·로그 관리가 복잡해집니다.
- 브라우저 저장 보고서에는 사용자 입력 문장이 포함되므로 삭제와 내보내기 동의가 필요합니다.
- FFmpeg를 기본 의존성으로 강제하면 설치 난이도가 높아질 수 있습니다.

## 이번 버전에서 넘기는 결정

- 품질 별점과 메모는 아직 영구 저장하지 않습니다.
- 주소·전화번호·수식의 읽기 규칙은 자동 적용하지 않습니다.
- WAV 병합은 같은 형식의 비압축 PCM만 허용합니다.
- 모델 파일은 전체 ZIP과 패치 ZIP에 포함하지 않습니다.
