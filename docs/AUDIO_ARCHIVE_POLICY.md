# Audio Archive Policy

현재 제품 정책: 2026-08-21 hardening 기준

## 공개 최종 Export

사용자용 `최종 MP3 + 자막` / `최종 WAV + 자막` 번들 기능과 `POST /api/v1/exports` 공개 API는 제거되었습니다. 타임라인에서 최종 번들을 생성·보존하는 제품 경로는 더 이상 제공하지 않습니다.

## 내부 품질 검증

장시간 오디오 병합, 자막 타이밍, FFmpeg 동작을 검증하는 `final_export.py`, `export_soak.py`, 관련 soak 스크립트는 **Quality/CI 내부 검증용**으로만 유지합니다. 이 코드는 공개 라우터에 연결되지 않습니다.

## 보존 원칙

일반 TTS/복제 결과는 기존 임시 AudioStore TTL 및 삭제 정책을 따릅니다. 내 목소리 기준 샘플은 명시적 동의 기록과 함께 VoiceCloneStore에 저장되며, 동의 철회 시 샘플과 메타데이터를 함께 삭제합니다. 공개 final bundle archive 메타데이터는 더 이상 생성하지 않습니다.
