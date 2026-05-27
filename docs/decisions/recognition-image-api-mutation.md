# 인식 이미지 업로드 API 연결

## 결정 요약

- 인식용 데이터는 프론트엔드에서 이미지 파일을 선택한 뒤 서버 API로 업로드해서 가져온다.
- 백엔드 구현은 이 저장소 범위에서 제외한다.
- 프론트 API 클라이언트는 동일 오리진의 `POST /api/recognitions`를 호출한다.
- 업로드 요청은 `multipart/form-data`를 사용하고 이미지 파일은 `image` 필드에 담는다.
- API 상태 관리는 `@tanstack/solid-query`의 mutation으로 처리한다.

## 구현 범위

- 루트에 `QueryClientProvider`를 연결한다.
- ToolBar에는 기존 버튼 그룹과 분리된 단일 `+` 버튼을 둔다.
- `+` 버튼은 숨겨진 `input[type=file][accept="image/*"]`를 열고, 선택된 이미지 파일로 mutation을 실행한다.
- mutation 성공 시 서버 응답을 인식 payload 목록으로 정규화하고 결과 Dialog를 연다.
- 결과 Dialog에서는 payload 목록을 선택하고, 읽기 전용 JSON 미리보기를 확인한 뒤 `Insert Layer`로 기존 `insertRecognitionLayer` 흐름에 연결한다.
- mutation 실패 또는 응답 정규화 실패는 API 실패 Dialog로 표시한다.
- 레이어 삽입 실패는 API 실패 Dialog가 아니라 결과 Dialog 내부 상태 메시지로 표시한다.
- 기존 `PropertyPanel`의 `CV Debug` 더미 삽입 UI는 제거하고 줌/그리드 정보만 유지한다.

## 응답 정규화

- 서버 응답 형태는 아직 고정되지 않았으므로 프론트에 정규화 함수를 둔다.
- 정규화 함수는 다음 형태를 후보로 지원한다.
  - `RecognitionPayload`
  - `RecognitionPayload[]`
  - `{ items: ... }`
  - `{ data: ... }`
  - `{ payload: ... }`
- 최종 후보는 `RecognitionPayloadSchema`로 엄격하게 검증한다.
- 후보 중 하나라도 유효하지 않으면 전체 요청을 실패 처리한다.

## 검증

- `pnpm run build`
- `pnpm run biome`

## 질문과 답변 요약

- API 엔드포인트는 무엇으로 할까? 동일 오리진 `POST /api/recognitions`로 결정했다.
- 응답 형태는 어떻게 할까? 서버 응답 형태는 미정이므로 프론트에서 현재 `RecognitionPayload` 형태로 가공하는 함수를 둔다.
- UI 흐름은 어떻게 할까? 서버 결과 목록을 선택해서 삽입하는 흐름으로 결정했다.
- TanStack Query primitive는 무엇을 쓸까? 이미지 업로드가 포함되므로 mutation으로 결정했다.
- 실패는 어떻게 보여줄까? API 실패는 Dialog로 보여주기로 했다.
- 요청 본문은 무엇으로 보낼까? 이미지 데이터를 보낸다.
- 이미지는 어디서 가져올까? ToolBar의 독립 `+` 버튼으로 파일 선택을 연다.
- 이미지 전송 형식은 무엇으로 할까? `multipart/form-data`의 `image` 필드로 보낸다.
- 결과 선택 UI는 어디에 둘까? 성공 후 결과 Dialog에서 처리한다.
- 검증은 어디까지 할까? `pnpm run build`와 `pnpm run biome`만 실행한다.
