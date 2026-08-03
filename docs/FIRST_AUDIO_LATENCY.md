# First-Audio Readiness Latency

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.4`

## 지표 정의

Heartbeat 5의 `first_audio_ms`는 요청 처리를 시작한 시점부터 **첫 사용 가능한 음성 파일이 서버에
준비된 시점**까지의 시간입니다.

- 한 구간 TTS: 최종 음성 파일이 준비된 시점이므로 보통 `processing_ms`와 같습니다.
- 여러 구간 TTS: 첫 번째 구간 WAV가 준비된 시점이며, 전체 병합 완료 전입니다.
- Browser Speech: 실제 `SpeechSynthesisUtterance.onstart`를 결과에 저장하지 않으므로 `null`입니다.
- 실제 스피커 출력 시작, 네트워크 다운로드, 브라우저 decode·autoplay 대기는 포함하지 않습니다.

따라서 UI는 `첫 음성 준비`와 `전체 생성`을 분리해 표시합니다. 이 값으로 사용자가 실제로 들은
시점을 보증하지 않습니다.

## API 계약

`POST /api/v1/tts/synthesize`와 작업 결과 응답에 다음 선택 필드가 추가됩니다.

```json
{
  "first_audio_ms": 840,
  "processing_ms": 2310,
  "segment_count": 4
}
```

`first_audio_ms <= processing_ms`가 정상 계약입니다. 기존 서버처럼 필드가 없으면 Web은
`processing_ms`를 호환 값으로 사용합니다.

## 현재 활용

- 결과 카드: 첫 음성 준비와 전체 생성 시간을 별도 표시
- 타임라인: 준비된 블록에 첫 음성 준비 시간을 표시
- 장문 API: 첫 구간 파일 준비와 최종 병합 완료의 차이를 측정

## Heartbeat 6 Web 지표

Heartbeat 6은 다음을 분리 측정합니다.

1. 서버 첫 구간 준비
2. Web 첫 바이트 수신
3. `HTMLAudioElement`의 `playing` 이벤트
4. Browser Speech의 `SpeechSynthesisUtterance.onstart`
5. 사용자가 누른 시점부터 실제 발화 이벤트까지의 end-to-end 지연

여러 구간 장문은 `segment-ready`와 단기 서명 URL로 첫 WAV 파일을 최종 병합 전에 Web Player
Queue에 연결합니다. `첫 바이트`는 부분 음원 fetch의 첫 response chunk를 기준으로 하며 직접 URL
fallback은 `loadeddata` 근사값입니다. `실제 재생`과 Browser Speech 시작은 각각 브라우저 이벤트를
기준으로 하므로 autoplay 정책과 사용자 제스처 대기 시간이 포함될 수 있습니다.
