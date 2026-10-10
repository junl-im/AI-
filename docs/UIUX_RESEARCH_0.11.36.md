# 소리온 비교 조사와 UI/UX 개선 · 0.11.36

조사일: 2026-10-10 KST. 대상: 한국어 장문·다화자 음성 제작, 로컬/무료 엔진, PC·모바일 웹.

## 조사 방법과 범위

공식 제품 소개·도움말과 공개 저장소·라이선스를 비교했습니다. 유료 서비스에 로그인해 직접 생성하거나 체감 속도·음질을 측정한 비교는 아닙니다. 소리온은 로컬 빌드를 실제 Chromium에서 렌더링하고 기존 테스트와 함께 검증했습니다. 공유 ChatGPT 대화는 내용을 확보하지 못했으므로 근거에 포함하지 않았습니다.

## 실제 유사 서비스 6곳

| 서비스 / 공식 근거 | 유용한 방식 | 소리온 적용 판단 |
|---|---|---|
| [ElevenLabs Studio](https://elevenlabs.io/docs/help-center/product/studio/studio/what-is-studio) | 대본·문서 기반 프로젝트, 문단별 목소리, 챕터, 생성 이력과 타임라인 | 대본을 중심에 놓고 고급 설정을 문맥에 따라 노출. 챕터와 문단 잠금은 후속 후보 |
| [Descript](https://www.descript.com/features) / [문서처럼 편집](https://help.descript.com/hc/en-us/articles/10164808475149-Inline-notes) | 텍스트와 미디어 편집을 연결하고 필요할 때 타임라인 사용 | 기본은 대본 편집, 전문 패널은 선택. 현재 소리온의 문장 분할을 단어 정렬 편집으로 과장하지 않음 |
| [Murf Studio](https://help.murf.ai/murf-studio-basics) | 목소리 선택·미리듣기, 블록별 속도·쉼·발음 설정 | 현재 선택한 목소리와 설정 적용 범위를 명확히. 문장 설정 확장은 엔진 지원 여부와 함께 제공 |
| [Typecast](https://help.typecast.ai/en/collections/3703019-voice) / [Lite와 웹 차이](https://help.typecast.ai/en/articles/13191841-app-what-s-the-difference-between-the-typecast-lite-app-and-the-typecast-web-service) | 모바일은 간단한 음성 편집에 집중, 웹은 더 넓은 편집 기능 | 모바일에서 큰 입력창·버튼과 짧은 흐름 우선, PC에서 고급 패널 사용 |
| [Vrew](https://vrew.ai/en/feature/speech-editor/) | 텍스트로 음성 내용을 수정하고 다시 생성 | 한국어 문장 편집 흐름을 유지. 향후 자막·원문 대조 검증 후보 |
| [Fish Audio](https://fish.audio/) | 텍스트 입력 → 목소리 선택 → 생성·듣기 | 기본 동작을 하나의 눈에 띄는 생성 버튼으로 집중 |

유료 서비스의 UX 패턴을 참고했으며 유료 API 연결, 계정 생성, 구독은 추가하지 않았습니다. 제품 이미지·코드를 복제하지 않았습니다.

## 오픈소스 후보와 도입 우선순위

라이선스는 저장소 코드 기준입니다. 모델 가중치·음성 데이터·상표의 권리와 이용 조건은 별도 확인이 필요합니다. 아래 프로젝트를 이번 버전에 새 의존성으로 설치하지 않았습니다.

| 후보 / 공식 저장소 | 코드 라이선스 / 적용점 | 결정과 주의점 |
|---|---|---|
| [wavesurfer.js](https://github.com/katspaugh/wavesurfer.js) / [문서](https://wavesurfer.xyz/docs/) | BSD-3-Clause. 파형·Regions·Timeline·Minimap | **P1** 생성 결과 파형 미리보기 후보. 지연 로딩, 긴 오디오의 미리 계산한 peaks/duration, CORS 검증 필요. 실제 오디오 절단·믹싱 엔진은 별도 |
| [Radix Primitives](https://github.com/radix-ui/primitives) / [접근성](https://www.radix-ui.com/primitives/docs/overview/accessibility) | MIT. Dialog 포커스·키보드 이동 패턴 | **P1** 성우 선택·설정 대화상자부터 점진 적용 검토. 전체 디자인 시스템 교체는 보류 |
| [RealtimeTTS](https://github.com/KoljaB/RealtimeTTS) | MIT. 여러 엔진과 실시간 출력 연결 | **P2** 취소·큐·첫 음성 지연 처리 참고. 기존 Worker/부분 오디오 계약과 비교 후 필요한 부분만 도입 |
| [TTS WebUI](https://github.com/rsxdalv/TTS-WebUI) | MIT. Gradio/React, 확장형 엔진 UI | **P2** 엔진 어댑터와 상태 표시 참고. 모든 엔진을 한 화면에 나열하는 복잡성은 피함 |
| [AllTalk TTS](https://github.com/erew123/alltalk_tts) | AGPL-3.0. 로컬 음성·내레이터·저 VRAM 운용 | **참조** 운용 흐름 참고. 코드 결합·배포 전 AGPL 의무 검토, 무분별한 코드 복사 금지 |
| [CosyVoice](https://github.com/FunAudioLLM/CosyVoice) | Apache-2.0. 한국어 포함 다국어·스트리밍 | **P0** 기존 소리온 어댑터의 실제 모델·승인 reference·장문 품질 검증 우선. 엔진을 새로 추가하는 것보다 기존 경로 안정화 |
| [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS) | Apache-2.0. 다국어·음성 복제·음성 설계 | **P2** 한국어·하드웨어별 비교 실험 후보. 모델 카드·VRAM·동의 조건 확인 후 별도 평가, 자동 다운로드 없음 |
| [faster-whisper](https://github.com/SYSTRAN/faster-whisper) | MIT. CTranslate2 기반 STT | **P1** 생성 음성과 대본 불일치 검출 후보. 기존 STT와 중복·CPU/GPU 비용 비교, 낮은 신뢰도는 수동 검토 |
| [whisper.cpp](https://github.com/ggml-org/whisper.cpp) | MIT. 로컬 CPU 중심 STT 경로 | **P2** GPU 없는 환경의 검증 대안. 모바일 웹에서 즉시 실행 가능하다고 가정하지 않음 |
| [audiobookshelf](https://github.com/advplyr/audiobookshelf) | GPL-3.0. 챕터·메타데이터·이어서 듣기 | **참조** 장문 프로젝트 정리 패턴. 코드 도입 전 GPL 의무 별도 검토 |
| [Audacity](https://github.com/audacity/audacity) | 주로 GPLv3, 일부 코드 GPLv2 이상 등 예외 | **참조** 파형 선택·재생·되돌리기 관례. 라이브러리처럼 직접 결합하지 않음 |

우선순위: P0 기존 음성 경로의 실제 품질 → P1 사용성·검증 보강 → P2 새 엔진 비교. 라이선스 링크는 각 공식 저장소의 LICENSE에서 확인할 수 있습니다. 프로젝트 인기는 음질이나 한국어 적합성의 증거로 사용하지 않았습니다.

## 이번 버전에 적용한 변화

1. 밝은 소개 화면에 작업공간 미리보기와 3단계 흐름을 배치했습니다. 미리보기임을 명시하며 실제 생성 결과처럼 표시하지 않습니다.
2. 편집 화면은 차분한 어두운 배경을 유지하고 글자 크기·간격·대비와 버튼 크기를 개선했습니다.
3. 빈 대본에 내레이션·강의/안내·두 사람 대화 예제를 제공합니다. 누르면 대본만 채우고 입력창으로 이동하며 음성을 자동 생성하지 않습니다. 작성 중인 대본에는 예제를 숨깁니다.
4. PC 프로 패널 버튼의 의미를 글자로 표시합니다. 모바일 도구 버튼을 두 열로 정돈하고 입력 글자를 16px 이상으로 유지합니다.
5. OS의 동작 줄이기 설정을 페이지 전환과 새 CSS 상호작용에 반영합니다.
6. 작업 화면 진입 때 sticky 헤더 높이를 스크롤 정렬에 반영해 제목이 가려지는 문제를 수정했습니다.
7. 오디오가 없는 작업 화면에서는 비활성 재생 컨트롤을 숨기고 주요 메뉴를 유지합니다. 생성 후 기존 재생·대기열 동작은 유지합니다.

새 UI 라이브러리·엔진·유료 의존성은 추가하지 않았습니다. 기존 권리·동의 검증, 생성 동시성 제한, 로컬 음성 경계를 유지합니다.

## 검증과 다음 실험

전체 웹 단위 테스트, lint, typecheck, build, 저장소 preflight와 실제 Chromium 반응형 렌더링을 실시합니다. 최종 결과는 HANDOVER/CHANGELOG에 기록합니다. 브라우저 화면 검사와 단위 테스트는 실제 CosyVoice 음질·모바일 실기기 인증을 대신하지 않습니다. 번들 분할 권고는 다음 성능 개선 대상으로 남습니다.

다음은 파형을 바로 추가하기보다 승인된 샘플로 장문 한국어 음질·취소·재시도·재생 흐름을 먼저 측정합니다. 파형 도입 시 첫 화면 JS 증가량, 긴 파일 메모리, 키보드 탐색, 부분 오디오→최종 오디오 전환을 비교합니다. 문장 자연스러움 계획은 0.11.37로 이월합니다.
