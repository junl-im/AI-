# SoriON AI 0.1.5 → 0.2.0 패치

## 적용 기준

- 기준 버전: `0.1.5`
- 대상 버전: `0.2.0`
- 패치 유형: 저장소 루트 덮어쓰기
- 삭제 파일: 없음

## 적용 순서

1. GitHub Desktop에서 현재 변경사항을 커밋하거나 별도 백업합니다.
2. 현재 `package.json` 버전이 `0.1.5`인지 확인합니다.
3. `.git` 폴더는 삭제하거나 이동하지 않습니다.
4. 패치 ZIP의 내용을 저장소 루트에 압축 해제해 덮어씁니다.
5. `docs/patches/0.2.0/PATCH_MANIFEST.txt`와 GitHub Desktop Changes를 비교합니다.
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

7. 모바일 360px, 390px, 430px 폭에서 생성과 다운로드 흐름을 확인합니다.
8. 다음 메시지로 커밋합니다.

```text
feat: add mobile voice workspace
```

## 주요 변경

- 모바일 Voice Workspace
- 한국어 음성 프리셋 카드와 감정 선택
- 숨김형 Advanced 속도·피치 설정
- 생성 상태, 실패, 재시도 UI
- 브라우저 기능 검증용 Demo WAV
- 오디오 플레이어와 WAV 다운로드
- 프로젝트 엔진·음원 출처 메타데이터
- 관련 테스트와 문서

## 주의

브라우저에서 생성하는 `DEMO WAV`는 실제 TTS 음성이 아닙니다. 실제 엔진 연결 전까지 Demo·Mock 표시를 제거하지 않습니다.
