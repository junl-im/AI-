# PROJECT NOTES - v1.0.6

## 점검 결과

각 Dock 탭을 눌렀을 때 화면이 떨리는 원인은 기능 자체보다 **스크롤 reveal 담당이 여러 곳에 흩어진 구조**였습니다.

```text
기존 위험
├─ hyperflow-tabs.js가 탭 전환 후 스크롤
├─ workspace-comfort.js가 다시 지연 스크롤
├─ flow-quality-gate.js가 상태 복구 후 또 스크롤
└─ 패널 하이라이트 애니메이션이 겹쳐 떨림처럼 보임
```

## v1.0.6 처리

```text
Motion Stability 모듈 추가
→ reveal 요청 병합
→ 중복 스크롤 차단
→ smooth scroll 중복 제거
→ 패널 하이라이트 완화
→ 안내 문구 모션 차단
```

## 다음 점검 후보

- 실제 PC 브라우저에서 Dock 탭 8개 모두 이동 테스트.
- 모바일에서 4+4 Dock 이동 시 하단 Dock에 가려지는지 확인.
- 후보 카드 선택 후 미리보기 패널 위치가 적당한지 확인.
- 글라스 디자인이 저사양 PC에서 무겁게 느껴지면 blur 강도 옵션화.
