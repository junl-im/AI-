# DATABASE

## 로컬 우선 저장

로그인하지 않은 사용자의 프로젝트는 브라우저 IndexedDB `sorion-ai`에 저장한다.

### projects

- `id`: UUID
- `title`: 표시 제목
- `text`: 입력 문장
- `voiceId`: 음성 프리셋
- `emotion`: 감정 프리셋
- `status`: draft 또는 generated
- `lastJobId`: 마지막 생성 작업
- `createdAt`, `updatedAt`: ISO 8601

## Firestore 예정 구조

```text
users/{uid}
users/{uid}/projects/{projectId}
users/{uid}/favorites/{voiceId}
users/{uid}/usage/{yyyyMM}
```

## 저장 금지

Firestore에는 원본 음성, 생성 음원, 모델 파일을 저장하지 않는다. 음원 저장이 필요해지면 별도 객체 저장소와 수명 주기 정책을 설계한다.

## 동기화

- `updatedAt`과 명시적 revision을 사용한다.
- 충돌 시 조용히 덮어쓰지 않는다.
- 삭제는 복구 기간을 둔 soft delete를 우선 검토한다.
