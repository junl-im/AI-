# DATABASE

## 로컬 우선 저장

로그인하지 않은 사용자의 프로젝트는 브라우저 IndexedDB `sorion-ai`의 `projects` 저장소에 저장합니다.

### projects

- `id`: UUID
- `title`: 표시 제목
- `text`: 입력 문장
- `voiceId`: 음성 프리셋
- `emotion`: 감정 프리셋
- `status`: `draft` 또는 `generated`
- `lastJobId`: 마지막 생성 작업
- `engineId`: 결과를 만든 엔진 식별자
- `audioSource`: `api` 또는 `browser-demo`
- `outputFormat`: `mp3`, `wav`, `flac`
- `createdAt`, `updatedAt`: ISO 8601

0.2.0에서 새 필드는 선택 항목이므로 기존 IndexedDB 레코드와 호환됩니다. DB 버전 마이그레이션은 필요하지 않습니다.

## 음원 저장

현재 생성 음원 Blob 또는 외부 URL은 IndexedDB에 영구 저장하지 않습니다. 페이지를 다시 열면 프로젝트 메타데이터는 남지만 이전 데모 음원은 다시 재생할 수 없습니다.

향후 음원 영구 저장을 추가할 때는 다음을 먼저 결정합니다.

- 사용자 기기 Blob 저장 용량과 정리 기준
- 서버 객체 저장소의 접근 권한
- 자동 만료와 사용자 삭제
- 프로젝트와 음원 revision 연결

## Firestore 예정 구조

```text
users/{uid}
users/{uid}/projects/{projectId}
users/{uid}/favorites/{voiceId}
users/{uid}/usage/{yyyyMM}
```

## 저장 금지

Firestore에는 원본 음성, 생성 음원, 모델 파일을 직접 저장하지 않습니다. 음원 저장이 필요해지면 별도 객체 저장소와 수명 주기 정책을 설계합니다.

## 동기화

- `updatedAt`과 명시적 revision을 사용합니다.
- 충돌 시 조용히 덮어쓰지 않습니다.
- 삭제는 복구 기간을 둔 soft delete를 우선 검토합니다.

## 0.3.0 엔진 모드

기존 프로젝트 레코드의 `engineId`, `audioSource`, `outputFormat` 선택 필드를 유지합니다. 새 프로젝트에는 선택 필드 `engineMode`를 저장해 `ai`, `local`, `mock`을 구분합니다. 기존 IndexedDB 레코드는 이 필드가 없어도 정상 표시됩니다.

## IndexedDB v2

데이터베이스 이름은 `sorion-ai`, 현재 버전은 3이다.

### `qualityReviews`

- key: `id`
- 문장과 엔진 ID를 기반으로 만든 안정적인 로컬 ID
- `sentence`, `engineId`, `engineName`, `engineMode`
- `rating`, `note`
- `elapsedMs`, `durationSeconds`, `realtimeFactor`
- `createdAt`, `updatedAt`

평가 문장에는 개인 정보가 들어갈 수 있으므로 Firebase에 자동 동기화하지 않는다. JSON·CSV 내보내기는 사용자가 명시적으로 눌렀을 때만 수행한다.


## IndexedDB v3 · `voiceProfiles`

- key: `id` UUID
- `displayName`, `status`, `engineId`
- `fileName`, `mimeType`, `sampleBlob`
- `analysis`: 길이, 샘플레이트, 채널, RMS, 무음, 클리핑, 상태, 안내
- `consent`: 권리 확인, AI 고지, 금지 용도 확인, 동의 시각, 사용 목적
- `createdAt`, `updatedAt`

원본 Blob은 기본적으로 이 기기에만 저장하며 자동 Firebase 동기화 대상이 아니다. 사용자가 동의를 철회하면 프로필과 Blob을 함께 삭제한다.
