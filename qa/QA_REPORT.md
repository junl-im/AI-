# QA Report v1.6.4

## 결과

- 등록 검사: 224/224 통과
- 저장소 전용 브라우저 감사: 데스크톱·모바일 page error 0
- 문제 자동 이동: 하단 이동 이벤트 각 1회
- 정리 취소: mutation 0, 상단 복귀 0
- 정리 성공: mutation 1, 건강 상태 정상, 상단 복귀 1
- 4 viewport 일반 감사: 오류·Promise rejection·console error·가로 overflow 0
- CSS ownership: 충돌 0, 동일값 중복 0, shadow 0, `!important` 593
- 서비스워커 lifecycle 및 SHA-256 셸 무결성 통과
- GPU/media 비교: 두 모드 디코딩 성공, runtime error 0
- 프로세스 메모리 보조 감사: JS heap slope 약 0.0055MiB/cycle

## 신규 회귀 범위

- 읽기 전용 저장소 정리 미리보기
- 취소 시 하단 위치 유지와 무삭제
- 성공 상태 확인 후 최상단 복귀
- 미해결 상태에서 자동 복귀 금지
- 네이티브 상단 버튼의 키보드 탭 순서 보존

## 상속 근거

구조 우선순위 대상 CSS와 장시간 미디어 처리 경로는 변경되지 않아 v1.6.3의 검증 자료를 v1.6.4 버전 메타데이터로 명시적으로 상속했습니다.
