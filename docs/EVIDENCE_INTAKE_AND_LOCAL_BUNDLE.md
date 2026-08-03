# EVIDENCE INTAKE AND LOCAL EXPORT BUNDLE

현재 제품 버전은 `0.9.3-beta.3`, 내부 패치 식별자는 `Engine Heartbeat 6.7`이다.

## Evidence Intake

Quality Lab은 최대 5MiB의 다음 JSON을 가져온다.

- SoriON field evidence schema v2
- Heartbeat 6.6 또는 6.7의 완료된 Web quality run report schema v1

파일 선택 뒤 바로 저장하지 않는다. 서버 preview가 schema, app version, 허용 필드, 레코드 checksum과 전체 checksum을 다시 계산한다. Web quality report는 7개 phase 순서·명령·성공 상태, package manifest·lock SHA, phase log SHA, dist SHA, evidence SHA와 report SHA를 검증한다.

preview가 통과해야 사용자가 최종 등록할 수 있다. 등록 시 다음 중복을 차단한다.

- 동일 bundle/report SHA-256
- 다른 export 시각을 가졌지만 동일한 record/evidence SHA-256
- 현재 서버가 이미 보유한 field evidence record

원본 JSON은 `.sorion/quality/imported-evidence/<sha256>.json`에 저장하고, 출처·commit SHA·run ID·등록 시각만 JSONL index에 남긴다. 사용자 원문과 음성 바이트를 새로 추출하거나 복제하지 않는다.

## Local Export Bundle

사용자가 선택한 WAV, MP3, SRT, VTT와 JSON을 서버 업로드 없이 브라우저 메모리에서 ZIP으로 만든다.

- 최대 20개
- 총 250MiB 이하
- 경로·제어문자를 제거한 안전한 파일명
- 중복 파일명 자동 suffix
- 각 파일의 SHA-256과 media type을 `sorion-bundle-manifest.json`에 기록
- 진행률과 사용자 취소
- 100MiB 초과 시 모바일 메모리 경고

ZIP은 stored 방식으로 생성한다. 암호화, 전자서명 또는 장기 서버 보관 기능은 아니다. SHA-256은 파일 변경 탐지용이며 발행자 신원을 증명하지 않는다.

## Lock integrity

Heartbeat 6.7부터 repository preflight가 npm lock 존재·루트 버전·직접 dependencies를 필수 검사한다. 덮어쓰기 패치는 기존 저장소의 검증된 `package-lock.json`을 변경하거나 삭제하지 않는다.

6.6 전체 ZIP에 lock이 포함되지 않았으므로 그 ZIP에서 직접 이어받은 독립 전체본은 검증된 저장소 lock을 먼저 추가해야 한다. 검증되지 않은 lock을 릴리스가 임의 생성하거나 덮어쓰지 않는다.
