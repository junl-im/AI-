# PROJECT NOTES v1.6.32

- `gridManualPageSeconds`는 `gridManualPages`와 같은 index의 페이지 표시 시간 배열입니다.
- 각 페이지 시간은 1~10초이며 누락된 값은 `gridPageSeconds`로 복구합니다.
- 수동 페이지 선택은 각 페이지 시간의 cumulative cycle로 계산합니다.
- page reorder는 페이지 subject 배열과 duration을 항상 함께 이동합니다.
- 페이지 내부 subject는 drag-and-drop과 좌·우 버튼으로 재정렬할 수 있습니다.
- subject ID는 페이지당 최대 4개이며 중복과 빈 값은 정규화 과정에서 제거됩니다.
- focus는 현재 페이지의 `gridPageDuration`, `gridPageElapsed`를 제공합니다.
- energy 상태 UI는 활성 화자 에너지, grid 선택 여부, threshold와 hold 남은 시간을 표시합니다.
- energy 상태는 기존 preview render callback에서 갱신하며 별도 timer를 만들지 않습니다.
- 기존 threshold·hysteresis·hold, transition, manual paging, grid crop 계약을 유지합니다.
- 전체 QA 307/307, 배포 파일 1224개, v1.6.31 대비 변경·추가 48개입니다.
