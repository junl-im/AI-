# 0.11.54 · 브라우저 한국어 WAV 엔진 검토와 구현

## 결정

정적 GitHub Pages에서도 사용자가 명시적으로 `대사 WAV 파일 만들기`를 누르면 한국어 WAV 바이트를 생성한다. Web Speech API의 `speechSynthesis`는 재생 경로이며 음성 PCM 파일 반환 API가 아니다. 따라서 기존 Web Speech 결과를 WAV라고 표시하지 않고 별도 브라우저 모델을 사용한다.

## 조사한 원본 소스

- [Supertonic 공식 아카이브](https://github.com/supertone-oss-archive/supertonic): 브라우저 WebGPU/WASM 예제, 한국어 합성, WAV 작성기. 코드 라이선스 MIT. 해당 아카이브의 `web` helper를 `src/vendor/supertonicHelper.js`로 포함하고 원본 라이선스와 고지를 보존했다. 아카이브이므로 향후 유지보수 보장은 없다.
- [Supertonic 3 모델](https://huggingface.co/supertone-oss-archive/supertonic-3): OpenRAIL-M 라이선스. 리비전 `aafc6e32416a594460b32413efc49d7fe4ce6d46`으로 고정해 ONNX/스타일 파일을 사용자 선택 시 로드한다. 서비스·배포 시 모델 라이선스와 금지 용도를 계속 준수한다.
- [ONNX Runtime Web 공식 문서](https://onnxruntime.ai/docs/get-started/with-javascript/web.html): 브라우저에서 WebGPU 또는 WASM 실행. `onnxruntime-web@1.30.0`을 고정한다.
- [MDN SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis): 기존 기기 음성은 재생용 API. 사용자 탭 오디오 공유 WebM 녹음은 별도 대체 경로로 유지한다.

Piper의 공식 음성 목록에는 한국어가 없어 이번 웹 기본 선택에서 제외했다. XTTS-v2는 한국어를 지원하지만 모델 크기·브라우저 런타임·음성 복제 권리 처리에 서버 설계가 필요해 이번 정적 Pages 패치에는 포함하지 않았다.

## 연결 방식

`src/tts/supertonicWav.ts`가 모델을 지연 로드하고 WebGPU 실패 시 WASM으로 다시 시도한다. 다섯 기본 성우 ID는 모델의 F2/M1/F3/M2/M3 스타일로 매핑한다. 이는 원본 성우의 음색 재현이 아니다. 생성된 WAV는 `blob:` URL로 Dock과 타임라인에 연결된다. 사용자는 클립별 WAV 또는 전체 타임라인 WAV를 내려받을 수 있다. 전체 WAV 결합은 pause 길이를 반영하고 PCM16 mono 형식을 확인한다.

첫 실행 모델 다운로드는 약 380MB이며 네트워크와 기기 메모리에 의존한다. 취소는 현재 단계 완료 후 반영될 수 있다. 브라우저 캐시가 모델을 보관할 수 있지만 저장 지속성은 보장하지 않는다. 새로고침 후 `blob:` 음원은 사라지므로 즉시 다운로드해야 한다. 자동 기기 간 동기화나 원본 5성우의 고유 음색 품질 보증은 아직 없다.

## 실제 검증

Chrome headless에서 Vite 개발 서버로 한국어 문장 `안녕하세요. 소리온입니다.`를 합성해 WAV Blob 245,484바이트, 약 2.78초, 스타일 F2를 얻었다. WebGPU 시도 후 WASM fallback으로 성공했다. 이는 파일 생성 검증이며 사람 청취 품질 인증은 아니다. 타임라인 클릭 탐색·WAV 결합·저장 버튼의 단위 테스트와 전체 웹 품질 검사는 릴리스 기록에 남긴다.
