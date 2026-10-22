# 0.11.56 · 기본 성우 음색 저장 경로

기본 성우는 Web Speech API의 기기 음성이다. 이 API는 합성 PCM 파일을 애플리케이션에 반환하지 않으므로 원본 음색을 파일로 남기려면 실제 재생 소리를 캡처해야 한다. 0.11.56은 기존 `getDisplayMedia`/`MediaRecorder`의 WebM을 `AudioContext.decodeAudioData`로 PCM으로 변환하고, 단일 채널 16비트 WAV 및 128kbps MP3를 자동 생성한다. MP3 인코더는 `@breezystack/lamejs@1.2.7`(LGPL-3.0)을 별도 지연 로드한다.

사용자는 저장 화면에서 `기본 성우를 WAV·MP3로 저장`을 누르고 브라우저 공유 창에서 오디오가 포함된 탭 또는 화면 전체와 시스템 오디오를 선택한다. 전체 대사가 다시 재생·녹음된다. 변환 결과는 음성 유무 검사 후 미리 듣기와 두 형식의 다운로드로 제공된다. 음성이 실리지 않으면 무음 파일을 성공으로 표시하지 않고 다른 캡처 방법이나 음성 서버 연결을 안내한다. 별도 로컬 모델의 `다른 음색으로 WAV 만들기`는 대안으로 남기며 기본 성우 음색 보존과 구별한다.

Chrome에서 생성한 1초 MediaRecorder WebM(15,752B)을 실제 브라우저에서 WAV(84,714B)와 MP3(15,882B)로 변환하고 RIFF/MP3 프레임 헤더를 확인했다. 이 검사는 변환 파이프라인의 동작을 증명한다. **기기 내장 성우의 운영체제 출력이 화면 공유 오디오에 포함되는지는 기기별로 다르며 실제 사용자 PC 청취 테스트가 필요하다.** 녹음에는 다른 시스템 소리가 섞일 수 있다. 생성 파일은 탭의 임시 Blob URL이므로 즉시 내려받아야 한다.

근거: [MDN getDisplayMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia), [MDN decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData), [MDN restrictOwnAudio](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/restrictOwnAudio), [Chrome Screen Capture](https://developer.chrome.com/docs/extensions/how-to/web-platform/screen-capture).
