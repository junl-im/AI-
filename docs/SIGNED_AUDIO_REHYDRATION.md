# Signed Audio Rehydration

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.4`

## 목적

최종 TTS 파일을 공개 파일명만으로 노출하지 않고, 작업 ID·파일명·만료 시각을 HMAC-SHA256으로 묶은 짧은 URL로 전달합니다. URL이 만료되거나 브라우저가 새로고침된 경우 저장된 작업 ID로 완료 결과를 다시 조회해 새 URL을 발급합니다.

## API 흐름

1. `POST /api/v1/tts/synthesize`가 서명된 `/tts/jobs/{job_id}/audio?...` 주소를 반환합니다.
2. Web은 API 음원 트랙에 `rehydration.kind=tts-final`과 `jobId`를 저장합니다.
3. 새로고침 시 `GET /api/v1/tts/jobs/{job_id}/result`를 조회해 새 서명 URL로 교체합니다.
4. 재생 중 `<audio>` 오류가 발생해도 같은 작업 결과를 한 번 조회하고 동일 트랙의 위치·재생 의도를 유지합니다.
5. 작업 결과 또는 실제 파일 TTL이 끝났으면 복원하지 않고 다시 생성을 안내합니다.

## 보안 경계

- final과 segment 서명은 같은 Secret을 사용해도 서로 다른 서명 도메인을 사용합니다.
- 서명은 작업 ID, 유형, 인덱스 또는 final 표식, 파일명, 만료 시각을 모두 포함합니다.
- URL TTL은 `SORION_SEGMENT_URL_TTL_SECONDS`, Secret은 `SORION_SEGMENT_URL_SIGNING_SECRET`을 사용합니다.
- 공개 운영에서는 영구 Secret을 설정해야 서버 재시작 뒤 기존 URL 검증이 가능합니다.
- 재발급 API는 파일을 재생성하거나 삭제된 파일을 복원하지 않습니다.

## 세션 정책

- 저장 창은 25분으로 서버 기본 30분 TTL보다 짧게 유지합니다.
- 부분 구간, Blob URL, revocable preview는 저장하지 않습니다.
- 복원 뒤 자동 재생하지 않으며 사용자의 재생 동작을 기다립니다.
