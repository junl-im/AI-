# SoriON AI 0.3.0 → 0.4.0 패치

## 적용 기준

- 기준 버전: `0.3.0`
- 대상 버전: `0.4.0`
- 패치 유형: 저장소 루트 덮어쓰기
- 삭제 파일: 없음
- 모델 파일 포함: 없음

## 적용 순서

1. GitHub Desktop에서 현재 변경사항을 커밋하거나 별도 백업합니다.
2. 현재 `package.json` 버전이 `0.3.0`인지 확인합니다.
3. `.git` 폴더는 삭제하거나 이동하지 않습니다.
4. 패치 ZIP의 내용을 저장소 루트에 압축 해제해 덮어씁니다.
5. `docs/patches/0.4.0/PATCH_MANIFEST.txt`와 GitHub Desktop Changes를 비교합니다.
6. 다음 검사를 실행합니다.

```bash
npm install
npm run quality:rules
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:api
```

7. 웹과 API를 실행하고 하단 `품질` 탭을 확인합니다.
8. 다음 메시지로 커밋합니다.

```text
feat: add Korean voice quality lab
```

## 주요 변경

- 한국어 숫자·날짜·금액·퍼센트·영문 약어 전처리
- 긴 문장 자동 분할과 PCM WAV 병합
- 생성 시간·파일 크기·구간 수·RTF 지표
- 엔진 설치·모델 로딩·메모리 사전 진단
- 평가 문장과 최대 두 엔진 A/B 비교
- 엔진별 감정·속도·피치 지원 UI

## 주의

- 패치는 MeloTTS 모델이나 PyTorch를 포함하지 않습니다.
- WAV 병합은 같은 채널·샘플 폭·샘플레이트의 비압축 PCM만 지원합니다.
- GitHub Pages만 실행하면 품질 연구소의 서버 진단과 A/B 생성은 사용할 수 없습니다.
