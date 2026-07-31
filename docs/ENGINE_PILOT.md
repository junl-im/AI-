# KOREAN TTS ENGINE PILOT

> 이 문서는 0.3.0의 MeloTTS 파일럿 기록입니다. 현재 주력 엔진 방향은 `docs/ENGINE_STRATEGY.md`를 따릅니다. MeloTTS는 로컬 대체 엔진으로 유지합니다.

## 엔진 우선순위

`0.3.0`의 `auto` 선택 순서는 다음과 같습니다.

1. MeloTTS Korean AI
2. 운영체제 한국어 Local TTS
3. SoriON Mock
4. 웹 브라우저 Demo WAV

## MeloTTS 선택 이유

MeloTTS 공식 프로젝트는 한국어를 지원하고 CPU 실시간 추론을 목표로 하며 코드와 라이브러리를 MIT 라이선스로 공개합니다.

- 공식 저장소: https://github.com/myshell-ai/MeloTTS
- 공식 설치 문서: https://github.com/myshell-ai/MeloTTS/blob/main/docs/install.md

모델·의존성의 실제 배포 조건은 서비스 출시 전에 다시 검토해야 합니다. 이 문서는 법률 자문이 아닙니다.

## MeloTTS 설치

공식 프로젝트는 Linux/macOS에서 저장소 설치를 안내하고 Windows/macOS에서는 Docker 사용도 안내합니다. SoriON API와 같은 Python 환경에 설치하려면 다음 형태를 사용합니다.

```bash
git clone https://github.com/myshell-ai/MeloTTS.git external/MeloTTS
cd external/MeloTTS
pip install -e .
```

한국어 전처리에는 환경에 따라 `python-mecab-ko`가 추가로 필요할 수 있습니다. 모델 파일은 Git에 커밋하지 않습니다.

설치 후 `.env`:

```text
SORION_ENABLE_MELO_TTS=true
SORION_MELO_DEVICE=auto
SORION_DEFAULT_TTS_ENGINE=auto
```

API를 재시작하고 `GET /api/v1/engines`에서 `melo.ready=true`를 확인합니다.

## Local TTS 준비

### Windows

Windows 설정에서 한국어 언어 및 음성 패키지를 설치합니다. SoriON은 `System.Speech`에서 첫 한국어 음성을 자동 선택합니다.

특정 음성 이름을 지정할 때:

```text
SORION_SYSTEM_TTS_VOICE=Microsoft Heami Desktop
```

### macOS

기본 후보는 `Yuna`입니다. 시스템 설정에서 한국어 음성을 내려받고 필요하면 환경 변수로 이름을 변경합니다.

### Linux

`espeak-ng` 또는 `espeak`와 한국어 음성이 필요합니다.

```bash
sudo apt-get install espeak-ng
espeak-ng --voices=ko
```

## 기능 제한

- MeloTTS 파일럿은 WAV와 속도 조절만 연결합니다.
- Local TTS는 운영체제마다 음질과 음성이 다릅니다.
- 현재 감정·피치 값은 Local TTS에서 완전히 동일하게 표현되지 않을 수 있습니다.
- MeloTTS 모델 로딩은 첫 요청에서 수행되므로 첫 생성이 느릴 수 있습니다.
- GitHub Pages에서는 Python 엔진을 실행할 수 없습니다.

## 운영 전 필수 확인

- 모델 및 체크포인트 라이선스 재검토
- Windows, macOS, Linux 실제 음질 비교
- 한국어 숫자·날짜·영문 혼용 평가
- GPU 서버 비용과 동시 처리량 측정
- 사용자 입력 및 생성 음원 보존 정책 검토
