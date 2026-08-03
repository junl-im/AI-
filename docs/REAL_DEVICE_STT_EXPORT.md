# 실기기 검증, STT 실측, 최종 Export

현재 기준: `0.9.3-beta.3`

## 삭제 파일 재발 방지

`public/sorion-icon.svg`는 영구 폐기 파일이다. `.gitignore`만으로 이미 추적된 파일은 제거되지
않으므로 최초 적용 시 반드시 다음 명령을 실행하고 삭제 변경을 커밋한다.

```bash
npm run cleanup:stale-brand
npm run quality:stale-files
git status
```

`npm install` 또는 `npm ci`의 prepare 단계가 `.githooks/pre-push`를 등록한다. 훅은 push 전에
삭제 파일 재유입과 프로젝트 규칙을 검사한다. 패치 ZIP은 `APPLY_PATCH.cmd` 또는
`APPLY_PATCH.sh`를 사용해야 `DELETE_LIST.txt`의 파일도 실제로 삭제된다.

## 실기기 검증 기록

`POST /api/v1/quality/device-benchmarks`는 장치, 엔진, 모델, 샘플 길이, 첫 음성 지연,
처리 시간, 음원 길이, 메모리·VRAM, 재시도와 실패 수를 기록한다. 서버는 RTF와
`ready`, `warning`, `failed` 상태를 계산한다. `GET /api/v1/quality/device-benchmarks/summary`는 5개 장치 프로필과 10·30·60분 조합의 완료 여부를 반환하며 Web Quality 화면이 이를 표시한다. 기록은 기본적으로
`.sorion/quality/device-benchmarks.jsonl`에만 저장된다.

실제 검증 대상은 Windows CUDA, Apple Silicon, CPU 저속 모드, Android Chrome,
iOS Safari다. 저장소와 CI는 실기기 결과를 만들어 내지 않으며 측정한 값만 기록한다.

## Faster Whisper STT 실측

- `GET /api/v1/quality/stt/probe`: 선택 설치 상태 확인
- `POST /api/v1/quality/stt/measure`: 원문과 전사문으로 CER, WER, 핵심 토큰 오류 계산
- `POST /api/v1/quality/stt/transcribe`: 로컬 Faster Whisper 전사 후 즉시 측정
- `POST /api/v1/quality/stt/verify-segments`: 서버 WAV를 일괄 검수하고 재생성할 문장 ID만 반환

핵심 토큰은 날짜, 금액, 퍼센트, 숫자·단위, 영문을 분리한다. CER 8%, WER 15%를 넘거나
핵심 토큰 오류가 있으면 `needs_regeneration=true`다. Faster Whisper는 대형 선택 의존성이므로
기본 설치와 릴리스 ZIP에 포함하지 않는다. API 환경에 사용자가 직접 설치하고 모델 다운로드와
라이선스를 확인해야 한다.

## 최종 Export

`POST /api/v1/exports`는 타임라인의 완료 WAV와 쉼 블록을 순서대로 병합한다. 실제 WAV frame
길이로 SRT와 VTT 시간을 만든다. 실패·취소·대기 구간이 있으면 기본적으로 HTTP 409로 차단한다.
명시적으로 `allow_incomplete=true`를 보낸 경우만 미완료 구간을 건너뛴다.

WAV는 Python 표준 라이브러리만으로 생성한다. MP3는 로컬 `ffmpeg`가 있을 때만 변환하며,
없으면 WAV 사용을 안내한다. Web 타임라인의 `최종 WAV + 자막`, `최종 MP3 + 자막` 버튼은
서버가 보관 중인 실제 API WAV만 사용한다. Browser Speech와 Demo Blob은 최종 서버 Export에
포함되지 않는다.

## 선택 재생성

타임라인의 `STT 검수 · 실패만 재생성`은 완료된 서버 WAV만 보낸다. API는 CER 8%, WER 15%, 날짜·금액·퍼센트·단위·영문 오류를 기준으로 실패 ID를 고른다. Web은 해당 블록의 기존 job·track·audio 연결을 제거한 뒤 새 TTS job을 만든다. 재생성 횟수는 작업공간 세션에 보존되며 기본 최대 2회다. 한도 도달 블록은 `blocked`로 표시하고 자동 반복을 멈춘다.

## beta.3 검증 증거와 장문 soak

`POST /api/v1/quality/stt/regeneration-comparisons`는 같은 문장 ID의 재생성 전후 전사문을 비교해 CER·WER·핵심 토큰 개선량을 저장한다. `GET /api/v1/quality/evidence-summary`는 STT 개선 기록과 10·30·60분 WAV·MP3 soak 6개 시나리오를 반환한다.

```bash
cd services/api
uv run python -m scripts.run_export_soak --minutes 10 30 60 --formats wav mp3
```

Export는 WAV와 긴 쉼을 청크 단위로 기록하고 임시 파일 완성 후 최종 이름으로 교체한다. 오류나 FFmpeg timeout이면 부분 WAV·MP3·자막을 삭제한다. soak 결과는 `.sorion/quality/export-soak.jsonl`에 저장되며 실제 음원은 기본 삭제된다.

`GET /api/v1/quality/evidence-bundle`은 장치 이름과 메모를 기본 제거한다. 실제 음원, 모델 파일, 로컬 경로는 포함하지 않는다. 합성 무음 soak는 구조 검증이며 실제 음질·장치 성능 증거가 아니다.


## Engine Heartbeat 6.4 모바일 인증 확장

실기기 기록은 `baseline`, `network-switch`, `background-resume`, `installed-pwa` 시나리오를 구분합니다. 네트워크·백그라운드·PWA 복구 시나리오는 재생 완료와 SSE 재연결·음원 fetch 복구를 모두 기록해야 READY가 됩니다. Quality summary는 Android/iOS 각각 4개 시나리오와 10·30·60분 조합을 `certification_coverage`로 별도 반환합니다.
