# 0.11.42 Lean Entry & Responsive Waveform

## 변경
첫 방문은 가벼운 LandingHome을 표시하고, 작업 진입 또는 저장된 세션이 있으면 HomePage를 동적 import합니다. 기존 세션 복원 hook이 계속 복원을 소유하며 페이지를 바꿔도 HomePage를 unmount하지 않습니다. chunk 실패는 빈 화면 대신 재불러오기 안내를 보여 줍니다. 느린 chunk 로딩 완료 후 진입 위치를 다시 맞추고 mount 전 새 작업 요청도 이전 대본 복원보다 우선합니다.

WAV 파형은 프레임 단위 분석 중 시간 예산 8ms를 32,768프레임 간격으로 확인해 실행 시간을 양보합니다. 캐시된 큰 단일 chunk에서도 취소 이벤트를 처리합니다. AbortSignal은 pending reader.cancel에도 연결해 fetch 응답 뒤 멈춘 스트림을 종료합니다. 잔여 데이터가 없으면 수신 청크를 불필요하게 복사하지 않습니다. 96개 peak와 기존 PCM·크기·길이 제한 유지.

비활성 대본 도구/생성 버튼은 native disabled 상태를 유지하면서 opacity1, text#62616c/background#e9e6ed로 읽기 쉽게 조정했습니다.

## 실측과 한계
이전0.11.41 초기 index513.01kB/gzip161.13kB → 현재405.46kB/gzip128.23kB, 약21.0% 축소. HomePage89.80kB 별도 chunk. 500kB 초과 빌드 경고 없음. PWA offline precache는 유지하므로 전체 전송량·로딩시간21% 개선을 뜻하지 않습니다.

Chromium390/1440: service worker를 차단한 격리 테스트에서 시작 전 HomePage 요청 없음, chunk600ms 지연 후 정렬, 설정 왕복·새로고침 대본 복원, 가로 넘침 없음, chunk실패 복구 안내 확인. service worker 활성 배포 검증은 Pages 반영 후 별도로 확인합니다.

합성32MB PCM WAV 단일 청크: 취소40.3ms, 완료988.3ms, UI타이머78회 진행, peak96개·무음값 정확. source TS를 동일 타깃 ES2022로 변환해 Chromium에 로드한 합성 테스트이며 실제 음원·메모리 프로파일·저사양 장치 측정을 대체하지 않습니다.

실제 Firefox/Safari·모바일 장치와 승인 성우 청취 검증은 미실행. 실제 Neural 모델 및 승인 WAV는 이번 버전에 추가하지 않습니다.

## 최종 로컬 검사
Web 전체80파일/311 PASS 이후 추가 새 작업 복원 케이스 포함 HomePage9 PASS(총312개). API244 PASS/1 skip, Worker16 PASS. lint/typecheck/build/Ruff PASS, preflight55/55 PASS. 주요17화면 단색 텍스트 대비 미달0건(전체 접근성 인증 아님). GitHub CI와 실제 Pages 버전은 push 후 별도 확인합니다.

## CI 복원 진입 경합 수정
첫 CI는 데스크톱/모바일 기본 레이아웃까지 통과했지만 recovery-fixture에서 자동 복원이 완료되어 사라진 시작 버튼을 15초 기다리다 실패했습니다. openStudio가 단발 alreadyOpen 검사 후 버튼만 기다리던 로직을, 매 poll마다 편집기 존재 확인과 시작 버튼 클릭을 같은 평가에서 수행하도록 수정했습니다. 검사·복원 fixture·출시 gate는 유지합니다.

실제 runner의 openStudio 함수를 Chromium에서 호출해 일반 시작과 단발 검사 직후 이미 편집기가 열린 경합 모두 PASS. 증거: docs/validation/0.11.42/runner-entry.json.
