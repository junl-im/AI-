# 0.11.44 Mobile Editing & Session Clarity

## 변경
760px 이하에서는 composer focus-within 동안 성우/생성 버튼 sticky를 풀고, 대본 textarea focus 중에는 일반 도크와 더빙 재생 도크를 static으로 전환합니다. 입력에서 벗어나면 기존 도크 고정이 복귀합니다. 스크롤·재생 이벤트는 변경하지 않습니다.

저장 상태는 hydration·변경 내용 저장 중·영구 저장·이 탭에만 보관을 구분합니다. memory mode는 과거 저장 시간이 있어도 창을 닫으면 사라진다는 안내를 표시합니다. 저장 revision과 draft 변경 counter를 검사해 이전 저장 완료가 최신 변경의 저장 중 상태/시간을 덮지 않습니다. 예상 밖 저장 rejection은 임시 보관 상태로 처리해 미처리 promise 오류를 막습니다. 헤더는 작업 저장 상태 role=status로 제공합니다.

useWorkspaceRestoration이 저장 대본 정규화·명시적 새 작업/프로젝트 우선 경계와 restore callback을 소유합니다. 실제 state 적용과 새 작업 초기화는 HomePage에 유지해 동작 범위를 제한했습니다. HomePage1106→1093줄. 저장 schema/엔진/동의/업로드 정책 유지.

## 검증 및 한계
Web83파일/324 PASS, API244 PASS/1 skip, Worker16 PASS. 저장 지연/새 변경 경합과 실패/메모리 문구 회귀 테스트 포함. Chromium360/390/430/768/1024/1440 긴 대본 끝 스크롤 및 reload 복원, 가로 넘침 없음. 모바일360/390/430 높이420에서 성우·생성·도크 static 및 focus 이탈 도크 fixed 복귀 PASS. 저장소를 차단한390px에서 메모리 경고·가로 넘침 없음 확인.

주요17화면 단색 텍스트 대비 미달0건. 계산은 이미지·모든 상태/전체 접근성 인증이 아닙니다. 실제 모바일 키보드/Firefox/Safari/Neural 청취는 미실행. viewport 높이 축소는 실제 기기 키보드 동작을 대신하지 않습니다.

추가 회귀: Chromium390/1440 PWA offline reload·설정 chunk·대본 보존, 업데이트 실패 시 화면 유지·offline 유지·연결 복구 후 재적용/reload 복원 PASS. lint/typecheck/Ruff·preflight55/55 PASS. 초기 index406.43kB/gzip128.46kB, 500kB 경고 없음.
