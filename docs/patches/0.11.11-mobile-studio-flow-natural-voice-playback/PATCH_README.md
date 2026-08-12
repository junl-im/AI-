# 0.11.11 Mobile Studio Flow & Natural Voice Playback Patch

기준: **SoriON AI 0.11.10 Horizontal Timeline Workspace**

프로젝트 루트에 ZIP 내용을 덮어쓴 뒤 Windows는 `APPLY_PATCH.cmd`, macOS/Linux는 `./APPLY_PATCH.sh`를 실행합니다.

이번 패치는 모바일 홈 Player/Dock 일관성, 단일 현재 voice + popup 비교, preview-only, voice 상황/장단점 안내, composer keyboard navigation, 모바일 horizontal timeline 폭 활용, 생성 음성 재생 상태 연결을 개선합니다.

목소리 추천과 natural speed/pitch 범위는 선택·설정 안전 보조이며 실제 음질을 보장하지 않습니다. 승인된 WAV·화자 동의·사람 검수 전에는 CosyVoice preset을 production-ready로 해석하지 않습니다.

삭제 파일은 없습니다. 적용 후 dependency-free preflight가 통과해야 하며, GitHub Actions `Web quality`가 semantic TypeScript/Vitest/Vite/Chromium 최종 gate입니다.
