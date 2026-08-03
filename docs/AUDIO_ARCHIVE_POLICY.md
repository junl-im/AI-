# Audio Archive Policy

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.5`

## 기본 정책

TTS 결과, 부분 구간, 최종 Export 음원과 자막은 FastAPI의 임시 `AudioStore`에 저장됩니다. 기본 TTL은 30분이며 서버가 정기적으로 만료 파일을 삭제합니다.

`POST /api/v1/exports`는 다음 정책 정보를 반환합니다.

- `server_expires_at`: 현재 Export 파일을 내려받을 수 있는 예상 만료 시각
- `server_retention_minutes`: 서버 임시 보관 분
- `preservation_mode: download-only`: 장기 보존은 사용자 다운로드로만 수행

## 사용자 보존

Quality/편집 UI의 `음원·SRT·VTT를 내 기기에 보존`은 세 파일 다운로드를 시작하고 파일명·형식·기록 시각만 브라우저 localStorage에 최대 20건 저장합니다.

- 음성 바이트, 원문, 전체 URL과 Secret은 로컬 보존 기록에 넣지 않습니다.
- `기록 삭제`는 localStorage 메타데이터만 제거합니다.
- 이미 내려받은 파일은 브라우저 다운로드 폴더에서 사용자가 직접 삭제합니다.
- 서버에 장기 archive 복사본을 만들지 않습니다.

## 이유

사용자 음성을 서버에 무기한 보존하면 동의 철회, 저장 용량, 접근 제어와 개인정보 삭제 의무가 함께 발생합니다. Heartbeat 6.5는 보존을 명시적 다운로드로 제한해 서버 임시 파일과 사용자 소유 파일의 수명 경계를 분리합니다.
