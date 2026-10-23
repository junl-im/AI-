# 0.11.77 긴 음성 MP3 작업 스레드 검증

기존 `wavToMp3`는 브라우저 메인 스레드에서 PCM을 인코딩했다. 0.11.77은 전용 모듈 Web Worker에 WAV Blob을 보내 인코딩하고, 완성된 MP3 ArrayBuffer를 전송 가능한 객체로 돌려받는다. 진행률은 메시지로 전달하며 취소하면 Worker를 즉시 종료한다. Worker를 시작하거나 실행할 수 없는 환경은 기존 청크형 메인 스레드 인코더로 복귀한다. 인코딩 자체의 오류와 사용자 취소는 복귀 없이 오류로 처리한다.

Chrome 로컬 사이트에서 24kHz 단일 채널 PCM 181초 테스트 신호를 인코딩했다. Worker 2회 생성(취소 시험·완료 시험), 취소 성공, 인코딩 중 UI 타이머 151회 진행, 인코딩 약 3.96초, 다운로드 MP3 2,896,896바이트, 재디코딩 181.056초·피크 0.232를 확인했다. 이 신호는 엔진 장시간 성우 녹음 대신 변환·다운로드 성능을 측정한 합성 테스트 음원이다.

같은 PC의 Chrome 0.11.77 로컬 화면에서도 7개 기본 성우 대사의 실제 저장 버튼을 눌렀다. MP3 422,556바이트(MPEG `fffb90c4`, 재디코딩 26.410초·피크 0.636)와 WAV 2,326,340바이트(`RIFF`)를 다운로드했다. 이는 새 Worker가 기존 Windows 출력 캡처와 연결된 실제 UI 경로에서도 동작한다는 증거다.

브라우저 기본 성우의 실제 3분 연속 녹음, 다른 PC의 Chrome/Edge, PC별 음색 청감, NAudio 새 `WasapiRecorder` 전환은 이번 검증에 포함되지 않았다. WAV·MP3가 무음 입력을 복구하지 못하는 경계도 그대로다. 기존 Windows 보조 앱 0.11.74 바이너리를 유지한다.

기술 근거: [MDN Worker 생성](https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker), [MDN Worker 종료](https://developer.mozilla.org/en-US/docs/Web/API/Worker), [MDN transferable 객체](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects), [Vite Worker 문서](https://vite.dev/guide/features.html).
