# SoriON Windows 오디오 보조 앱 (0.11.74)

GitHub Pages에서 기본 기기 성우를 선택해 생성한 뒤, 그 **PC에서 실제 재생되는 소리**를 Windows WASAPI 루프백으로 녹음합니다. 브라우저의 화면 공유 오디오가 무음인 PC를 위한 로컬 경로입니다. 별도 성우 모델을 쓰지 않으므로 재생된 음색을 캡처하지만, 설치되지 않은 성우를 만들어 내지는 못합니다.

## 사용

1. Windows 10/11 x64에서 `SoriON-Audio-Bridge-0.11.74-win-x64.zip`을 압축 해제합니다. EXE와 DLL 파일은 같은 폴더에 둡니다.
2. `SoriONAudioBridge.exe`를 실행하고 검은 창을 열어 둡니다. 앱이 토큰이 든 소리온 페이지를 기본 브라우저에 엽니다. 해당 토큰은 페이지 주소에서 즉시 지워지고 그 탭의 세션에만 보관됩니다. Chrome/Edge가 ‘이 기기의 앱 접근’을 물으면 허용하세요. 버튼이 안 보이면 저장 화면의 `Windows 보조 앱 연결 확인`을 누르세요.
3. 사이트에서 원하는 **기본 성우**로 대사를 생성한 뒤 `생성한 음성 저장하기`에서 `Windows 보조 앱으로 원래 음색 MP3 저장`을 누릅니다. 완성 후 MP3 다운로드가 시작되고 WAV·MP3 링크가 남습니다.
4. 녹음 중에는 다른 프로그램의 소리를 멈추세요. 이 앱은 기본 출력 장치의 **모든 소리**를 캡처합니다. 헤드폰 사용 여부와 관계없이 그 출력 장치의 디지털 믹스를 받습니다.

처음 연결할 때 Windows 방화벽이 묻는다면 앱은 `127.0.0.1:18717`에만 수신합니다. 공개 네트워크 수신은 필요하지 않습니다. 해당 포트가 이미 사용 중이면 앱을 중복 실행하지 말고 기존 창을 종료하세요. 앱 창을 닫으면 연결이 끊깁니다. 기본 출력 장치를 바꿨다면 앱을 다시 실행하세요.

## 검증 범위

0.11.74 빌드의 Windows 10/11 x64 자체 포함 폴더형 패키지를 실행했고, 공개 Pages 출처의 `/status`에서 기본 출력 장치 `헤드폰(High Definition Audio Device)`과 `Active` 상태를 확인했습니다. 공개 Pages 0.11.73의 실제 저장 버튼을 눌러 Microsoft Heami의 MP3(110,759바이트, 재디코딩 피크 0.565)와 WAV(RIFF, 607,728바이트)를 다운로드했습니다. 다른 PC와 성우별 청감 검증은 남아 있습니다.

Web Speech는 PCM을 페이지에 돌려주지 않습니다. 이 앱은 오직 녹음 시작·중지와 시스템 출력 WAV 반환을 수행하고, 웹 앱이 WAV를 이어 붙여 MP3로 변환합니다. 음성이 실제 출력되지 않거나 다른 장치로 나가면 무음 오류를 냅니다. 128MB 녹음 한도를 넘으면 부분 파일을 제공하지 않고 오류를 냅니다.

## 개발

```powershell
dotnet build tools/windows-audio-bridge/SoriONAudioBridge.csproj -c Release
dotnet publish tools/windows-audio-bridge/SoriONAudioBridge.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=false -o publish
```

NAudio.Wasapi 3.3.0의 Windows 시스템 믹스 루프백을 사용합니다. [원리](https://github.com/naudio/NAudio/blob/main/Docs/WasapiLoopbackCapture.md)와 [MIT 라이선스](https://github.com/naudio/NAudio/blob/main/LICENSE)를 참조하세요. 배포 ZIP에 라이선스 사본을 포함합니다. 기존 `WasapiLoopbackCapture`의 NAudio 3.3 사용 중단 경고는 녹음 검증을 유지하며 별도 패치에서 최신 `WasapiRecorder`로 이전할 예정입니다.
