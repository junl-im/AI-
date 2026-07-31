# TEST

## 계층

1. 단위 테스트: 숫자 읽기, 정규화, 문장 분할, WAV 병합
2. 파이프라인 테스트: 장문 분할, 자식 WAV 정리, 결과 지표
3. 어댑터 테스트: 주입된 Melo 모델, 설치된 eSpeak 실제 WAV
4. API 계약 테스트: 엔진 목록, 진단, 전처리, A/B 비교, 취소
5. 컴포넌트 테스트: 엔진 상태, 생성, 품질 연구소, 결과 표시
6. 실기기: Android Chrome, iOS Safari, 설치형 PWA

## 명령

```bash
npm run quality:rules
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:api
```

## 0.4.0 추가 검사

- 큰 정수의 한국어 읽기
- 날짜, 금액, 퍼센트, 영문 약어 전처리
- 40~500자 분할 기준 검증
- 같은 PCM 형식 WAV 병합과 구간 무음
- 장문 파이프라인의 자식 WAV 삭제
- 처리 시간, 파일 크기, RTF 응답
- 품질 진단의 Python·메모리·엔진 상태
- 평가 문장 API
- Mock 비교가 음원 없이도 안전한 결과를 반환하는지 확인
- 지원하지 않는 감정·피치 UI 비활성화

## 한국어 평가 세트

`docs/evaluation/KOREAN_TTS_SENTENCES.json`에 기본, 숫자, 날짜, 시각, 금액, 단위, 영문, 높임말, 긴 문장 분할 항목을 관리합니다.

## 배포 차단 기준

- 테스트 실패
- 500줄 제한 위반
- AI, Local TTS, Demo 표시 혼동
- 전처리 과정에서 원문 일부가 유실되는 문제
- 서로 다른 WAV 형식을 강제로 병합하는 문제
- 자식 임시 WAV가 병합 후 남는 문제
- 저장 루트 밖 파일 접근
- 사용자 문장 또는 비밀키가 로그·저장소에 포함됨
