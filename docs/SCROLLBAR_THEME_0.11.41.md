# 0.11.41 Native Scrollbar Theme

12px native 스크롤바와 둥근 회보라 손잡이, warm gray track, hover/active 상태를 공통 CSS로 통일했습니다. 어두운 타임라인은 track #171a22 / thumb #9b8ba9를 사용합니다. 터치 포인터는 14px로 확대하며 고대비 모드에서는 Canvas/CanvasText/Highlight를 사용합니다. Firefox는 scrollbar-color 표준 속성, Chromium/Safari는 native pseudo-elements를 사용합니다.

가로 도구 모음·성우 칩의 scrollbar-width:none/display:none을 제거했습니다. 페이지와 세로 입력/목록 gutter를 확보해 스크롤 발생 시 폭 변화를 줄입니다. 스크롤 이벤트나 음성·저장 로직은 변경하지 않습니다.

검증: build/typecheck/lint PASS, 핵심 Web 12파일/81 PASS. Chromium에서 320/390/768/1024/1440 화면의 가로 넘침 없음, 12px·999px radius·밝은/어두운 색상 적용 확인. 180줄 장문 Ctrl/Cmd+End scrollTop 5419, 목소리 목록 612px 높이/836px 내용 스크롤 확인. 모바일 타임라인 356px viewport/640px 내용과 표시된 가로 스크롤바 시각 확인. 드래그 자동화에서는 이동을 확인하지 못해 드래그 성공으로 기록하지 않습니다.

한계: 실제 Firefox/Safari·터치 및 고대비 모드 런타임은 미실행. OS overlay 설정에 따라 손잡이 표시가 달라집니다. 초기 JS 513.01kB 기존 경고 유지. 브라우저 실측 너비는 터치 장치 자체 검증을 대체하지 않습니다.
