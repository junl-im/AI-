# SoriON AI 0.7.3 → 0.8.0 패치

## 목적

초기 브랜드 랜딩은 유지하고, Dock 또는 시작 버튼을 누른 뒤의 생성 경험을
**ChatGPT형 대화 + CapCut형 문장 타임라인**으로 전면 개편합니다.
동시에 API 미설정·TTS 미준비·Demo 전용·Worker·GPU 상태를 작업 화면에서 바로
진단하고 연결할 수 있도록 엔진 연결 흐름을 복구합니다.

## 적용 가능한 기준

현재 저장소의 `package.json` 버전이 정확히 `0.7.3`일 때만 적용합니다.

## 주요 변경

- 랜딩과 편집 작업공간을 분리하고 편집 진입 후 상단 브랜드를 compact header로 축소
- ChatGPT형 메시지 composer, 추천 톤 칩, 마이크 입력, Enter 전송
- 혜린·도윤·소리 세로 보이스 목록과 모바일 접기·펼치기
- 문장·쉼 블록 타임라인, 순서 변경, 자르기, 수정, 개별 생성·재시도
- 첫 문장 완료 즉시 Dock 플레이어에 연결하는 Progressive Playback
- 채팅 안의 API 연결 시스템 메시지와 API·Worker·GPU 상태 바텀시트
- 실제 TTS 준비와 Demo 전용 상태를 분리해 연결 성공 오판 방지
- 작업공간 외곽 카드와 불필요한 중간 테두리 제거

## 적용 순서

1. 현재 변경사항을 커밋하거나 별도로 백업합니다.
2. `.git` 폴더는 유지합니다.
3. 이 패치 ZIP을 저장소 루트에 압축 해제합니다.
4. 같은 이름의 파일을 모두 덮어씁니다.
5. `package.json` 버전이 `0.8.0`인지 확인합니다.
6. `docs/HANDOVER.md`와 `DELIVERY_RULES.md`를 끝까지 읽습니다.
7. `npm run quality:rules`를 실행합니다.
8. Web·API·Worker GitHub Actions 결과를 확인합니다.
9. 실제 음성을 쓰려면 채팅의 `API 연결 안됨` 메시지에서 Voice API 주소를 연결합니다.
10. 커밋 후 Push하고 GitHub Pages 배포를 확인합니다.

## 삭제 파일

없음.

## 권장 브랜치

```text
feature/chat-to-timeline-workspace
```

## 권장 커밋

```text
feat: rebuild creation flow as chat timeline workspace
```

## 다음 기능 목표

`0.8.1 Timeline Persistence & Real Script Model Bridge`
