# SoriON AI 0.6.4 → 0.7.0 Patch

## 적용 기준

- 현재 저장소의 `package.json` 버전이 정확히 `0.6.4`여야 한다.
- 저장소 루트의 `.git` 폴더는 삭제하거나 덮어쓰지 않는다.
- 적용 전에 로컬 변경사항을 커밋하거나 별도로 백업한다.

## 적용 방법

1. `SoriON-AI-0.6.4-to-0.7.0-patch.zip`을 저장소 루트에 푼다.
2. 같은 이름의 파일은 모두 덮어쓴다.
3. 이번 패치의 삭제 대상은 없으므로 별도 삭제 명령은 실행하지 않는다.
4. `npm run quality:rules`를 실행한다.
5. GitHub Actions에서 Web, API, Worker quality와 Pages 배포를 확인한다.

## 로컬 실행

```bash
npm run dev:worker
npm run dev:api
npm run dev
```

Worker가 실제 모델을 준비하려면 `.env`의 모델 경로, adapter module, device를 설정하고 CosyVoice·PyTorch·torchaudio 의존성을 GPU 환경에 별도로 설치해야 한다.

## 안전 조건

- Worker `/ready`가 준비되지 않으면 복제 작업 생성은 차단된다.
- 모델 가중치와 대형 AI 의존성은 이 패치에 포함하지 않는다.
- 원본 음성의 사용 권한과 합성 음성 고지 동의를 유지한다.
