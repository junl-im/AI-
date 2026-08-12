# 0.11.12 Editing History, Speaker Memory & Engine Routing Trace Patch

기준: **SoriON AI 0.11.11 Mobile Studio Flow & Natural Voice Playback**

프로젝트 루트에 ZIP 내용을 덮어쓴 뒤 Windows는 `APPLY_PATCH.cmd`, macOS/Linux는 `./APPLY_PATCH.sh`를 실행합니다.

이번 패치는 Timeline 최근 20단계 Undo/Redo, 개인정보 최소 화자-목소리 최근 배정 기억, 장문 생성 engine routing trace를 추가합니다.

Undo/Redo는 폐기된 audio URL/job을 되살리지 않습니다. 내용이나 voice가 달라지는 복원 clip은 queued로 돌아가며 다시 생성해야 합니다. 화자 기억은 raw 이름/대본을 저장하지 않고 hash key + voiceId만 저장합니다.

장문 동시성 상한은 기존 최대 2를 유지합니다. routing trace는 실제 engine usage/switch/fallback 관측값이며 음질 또는 처리용량 benchmark가 아닙니다.
