# 0.11.43 Recovery & Preview Lifecycle

## 변경
applyAppUpdate가 SW 갱신 실패에도 finally에서 강제 reload하던 경로를 제거했습니다. 오프라인·getRegistrations/update 오류에서는 error 상태와 현재 화면을 유지합니다. 성공한 준비 후에만 build query로 이동합니다. applying 중 중복 적용/확인 요청을 막고, 먼저 시작했던 확인 응답도 applying을 덮지 않습니다. controllerchange listener와4초 대기 timer는 성공·실패 모두 정리합니다.

상단 알림과 설정 모두 재시도 가능하며, remote가 현재 build와 같은 확인 오류는 새 업데이트로 표시하지 않습니다. 버튼 최소44px. 업데이트 적용은 사용자의 버튼 클릭으로만 실행합니다.

useDirectBrowserPreview가 카카오 인앱 직접 SpeechSynthesis의 상태·runId·watchdog·cleanup을 소유합니다. tap handler 내 speak 호출을 유지하며 취소/종료/watchdog 후 start/error callback을 무시합니다. 기존 field-device 계측 검사는 새 hook으로 이동해 모든 요구사항을 유지했습니다. HomePage1194→1106줄.

## 브라우저 검증
Chromium390/1440: PWA ready/활성화를 기다린 뒤 offline 전환·reload, IndexedDB 대본 복원, 캐시된 설정 chunk 진입과 편집기 왕복 모두 PASS. 별도 context에서 version manifest/SW 실패를 주입해 실패 후 화면 유지·offline 시 reload 없음·연결 복구 후 재적용 및 대본 복원 PASS. 버튼44px·가로 넘침 없음.

주요17화면 단색 텍스트 대비 미달0건. 단색 계산은 이미지·모든 상태 또는 전체 접근성 인증이 아닙니다.

## 한계
실제 Kakao iOS/Android·Firefox/Safari·기기 키보드 검증과 승인 Neural 청취는 미실행입니다. 네트워크/SW 오류는 QA fixture로 주입했으며 실제 배포 인프라 장애 성공을 의미하지 않습니다. 엔진 모델·승인 음성·동의·자동 업로드 정책은 유지합니다. 초기 index406.43kB/gzip128.46kB로500kB 경고 없음.

## 최종 로컬 검사
Web82파일/322 PASS, API244 PASS/1 skip, Worker16 PASS. lint/typecheck/build/Ruff PASS, preflight55/55 PASS. 실제 Pages와 GitHub 전체 CI는 push 뒤 확인합니다.
