# SoriON AI 0.2.0 → 0.3.0 패치

## 적용 기준

- 기준 버전: `0.2.0`
- 대상 버전: `0.3.0`
- 패치 유형: 저장소 루트 덮어쓰기
- 삭제 파일: 없음
- 모델 파일 포함: 없음

## 적용 순서

1. GitHub Desktop에서 현재 변경사항을 커밋하거나 별도 백업합니다.
2. 현재 `package.json` 버전이 `0.2.0`인지 확인합니다.
3. `.git` 폴더는 삭제하거나 이동하지 않습니다.
4. 패치 ZIP의 내용을 저장소 루트에 압축 해제해 덮어씁니다.
5. `docs/patches/0.3.0/PATCH_MANIFEST.txt`와 GitHub Desktop Changes를 비교합니다.
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

7. 로컬 API를 실행하고 설정 화면의 엔진 목록을 확인합니다.
8. 다음 메시지로 커밋합니다.

```text
feat: add Korean TTS engine pilot
```

## 주요 변경

- 선택 설치형 MeloTTS 한국어 AI 어댑터
- Windows, macOS, Linux Local TTS
- AI → Local → Mock 자동 선택
- 생성 취소, 제한 시간, 동시 작업 제한
- 임시 WAV 저장·다운로드·30분 정리
- 엔진 상태 카드와 AI·Local·Demo 표시
- 한국어 품질 평가 문장 세트

## 주의

- MeloTTS 모델은 패치에 포함되지 않으며 별도 설치가 필요합니다.
- Local TTS는 실제 음성이지만 AI 모델이 아닙니다.
- GitHub Pages만 실행하면 Python 엔진이 없어 Demo WAV가 사용됩니다.
