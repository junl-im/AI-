# Heartbeat 6.8.3 → 6.8.3.1 덮어쓰기 패치

## 적용 방법

1. GitHub Desktop에서 현재 변경사항을 커밋하거나 별도 백업합니다.
2. `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.8.3-to-6.8.3.1-web-quality-test-compatibility-patch.zip`을 저장소 루트에 압축 해제합니다.
3. 같은 경로의 파일 덮어쓰기를 허용합니다. `.git`은 포함되지 않습니다.
4. GitHub Desktop의 Changes에서 아래 manifest 파일을 확인합니다.
5. 가능하면 `npm run quality:web-repro` 또는 GitHub Actions Web quality를 실행합니다.

## 해결 대상

- `file.text is not a function` Evidence Intake 테스트 2건
- LinkedPlayerDock Browser Speech `speak()` 미호출 테스트 2건
- TypeScript 5.9 `BufferSource`·`BlobPart` TypedArray 오류 재발 방지

## 주의

브라우저 음성의 성별 미확인·반대 성별 자동 대체 차단 정책은 변경하지 않습니다. 테스트 fixture만 해당 정책과 일치하도록 수정했습니다.
