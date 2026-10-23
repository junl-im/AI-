# NEXT UPDATE

현재 기준: 0.11.66 · Audio Capture Fallbacks

## 목표 버전

0.11.67 · Basic Voice File Engine & Device QA

- 승인된 5성우 원본 자산·권리와 파일 출력 엔진을 확보하거나 Windows WASAPI 루프백을 사용하는 로컬 도우미의 설치·연결·보안 경계를 검토합니다. 정적 GitHub Pages의 Web Speech API만으로 PCM을 얻을 수는 없습니다.
- 사용자 PC와 다른 PC의 Chrome/Edge에서 스테레오 믹스/가상 루프백 장치 목록, 비무음 WebM, WAV·MP3 파일, Dock 재생을 실기기로 검증합니다.
- 입력 장치가 없는 PC에도 확실히 작동하는 파일 생성 경로를 결정합니다. 원본 성우와 다른 모델 음색을 동일하다고 표시하지 않습니다.

예상 영역: 성우 파일 출력 엔진 또는 Windows 로컬 도우미, 녹음 장치 진단, 다른 PC QA.
선행 조건: 승인 음성 자산·권리 또는 로컬 도우미 배포 방식, 실제 다른 PC 접근. 0.11.66의 WebM 변환은 소리가 담긴 파일에만 유효합니다.
