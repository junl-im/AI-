# 다운로드 기술 조사 · 0.11.76

목표는 **선택한 기본 성우의 실제 소리**를 WAV/MP3 파일로 저장하는 것이다. 파일 형식 변환은 입력에 담긴 소리만 보존하며 무음 녹음을 복구하지 못한다.

| 경로 | 원본 성우 음색 | 파일 확보 조건 | 판단 |
| --- | --- | --- | --- |
| Web Speech `SpeechSynthesisUtterance` | 재생 시 가능 | API가 PCM 또는 파일 바이트를 제공하지 않음 | 직접 내보내기 불가. 브라우저·운영체제 출력 캡처 필요 |
| 화면 공유 `getDisplayMedia` + `MediaRecorder` | 오디오 트랙에 포함된 경우 | 사용자가 선택한 소스, 브라우저 및 OS의 오디오 지원 | 보조 경로. `audio: true`도 트랙을 보장하지 않음 |
| Windows WASAPI 출력 루프백 | 해당 PC에서 실제 들리는 음색 | 같은 출력 장치로 재생되고 보조 앱이 실행됨 | 기본 성우 원음 저장의 주 경로. 다른 앱 소리 혼입 가능 |
| Windows `System.Speech` 파일 합성 | 설치된 동일 음성이 합성 엔진에 보일 때만 | 설치 성우와 브라우저 성우 매핑 필요 | 음색 동등성 미검증. 일반 대체품으로 표시하지 않음 |
| 로컬 Supertonic 모델 | 기존 기본 성우와 다름 | 모델 다운로드·실행 성공 | 다른 음색의 직접 파일 생성 경로 유지 |
| 서버 TTS 파일 | 서버가 제공한 음색 | 서버·음성 자산·권리·네트워크 | 향후 원본 음색 자산 확보 시 별도 선택지 |

이번 패치는 루프백의 녹음 완료 직후 WAV를 보존하고 MP3 실패 시 WAV를 자동 다운로드한다. MP3 인코더의 전체 PCM 복사본을 없애고 1,152샘플 버퍼를 재사용한다. 64프레임마다 UI에 제어를 돌려 진행률과 취소를 반영한다. 다운로드는 브라우저 IndexedDB 보관 완료를 기다리지 않는다. 파일 링크는 자동 다운로드가 차단된 브라우저의 재시도 수단이다.

이 PC의 Chrome에서 로컬 0.11.76 저장 버튼을 실제 눌러 7개 클립의 MP3 422,138바이트(시작 `fffb90c4`, 재디코딩 26.384초, 피크 0.637)와 WAV 2,322,756바이트(`RIFF`)를 받았다. MP3 실패 시 WAV 링크·자동 다운로드는 회귀 테스트로 확인했다. 다른 PC 실기기와 모든 기본 성우의 음색 일치는 아직 검증하지 않았다.

다음 개선 후보는 전용 Web Worker에서 MP3를 인코딩해 메인 UI 간섭을 더 줄이는 것이다. Worker 번들에서 LAME 라이브러리 호환성과 긴 파일 메모리를 실측한 뒤 이전한다. `showSaveFilePicker`는 짧은 사용자 활성화 시간이 필요하므로 녹음·인코딩 뒤 호출하는 자동 저장 경로에 바로 맞지 않는다. 현재 Blob URL 다운로드와 재시도 링크를 유지한다.

근거(공식 문서):

- [MDN SpeechSynthesisUtterance](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance) — 발화 요청·재생 인터페이스. PCM/파일 출력 메서드는 목록에 없다.
- [MDN getDisplayMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia) — 시스템 오디오 힌트와 실제 오디오 트랙의 브라우저·OS 의존성.
- [NAudio WasapiRecorder](https://github.com/naudio/NAudio/blob/main/Docs/WasapiRecorder.md) — 출력 장치 루프백, 신호가 없을 때 버퍼 미전달, 새 녹음 API.
- [Microsoft SpeechSynthesizer](https://learn.microsoft.com/en-us/dotnet/api/system.speech.synthesis.speechsynthesizer) — 설치 음성 선택 및 WAV 출력.
- [MDN Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) — 긴 CPU 작업의 별도 스레드 처리.
- [MDN 사용자 활성화](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/User_activation) 및 [HTML 다운로드 속성](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a) — 저장 대화상자의 제약, Blob 다운로드의 브라우저별 동작.
