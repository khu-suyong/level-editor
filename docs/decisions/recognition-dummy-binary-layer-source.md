# 인식 더미 데이터와 원본 이미지 기반 리사이즈

## 결정 요약

- 인식 디버그 샘플은 `src/helpers/dummy.ts`에서 관리한다.
- 마리오형 더미 스테이지는 실제 PNG 파일로 `src/helpers/dummy-images/`에 둔다.
- 더미 payload는 실제 PNG asset URL을 `image.src`에 포함한다.
- 인식 레이어를 만들 때 `image.src` 또는 `image.data`를 읽어 원본 이미지를 디코드하고, 레이어의 `source.payload`에 원본 payload를 보존한다.
- `image.src`만 있는 경우에도 삽입 시 원본 PNG를 base64 `image.data`로 보강해 레이어가 원본 바이너리를 함께 보존하게 한다.

## 구현 범위

- CV shape 프리셋은 `triangle`, `rectangle`, `circle`, `line` 네 가지만 허용한다.
- 기존 샘플의 shape 값은 네 가지 기본 도형 중 하나로 치환한다.
- 원본 이미지가 있는 인식 레이어는 삽입과 리사이즈 시 이미지의 어두운 픽셀 커버리지를 기준으로 타일을 생성한다.
- 픽셀 기반 타일의 tileId는 해당 셀이 포함되는 객체 bbox의 shape 매핑을 우선 사용하고, 없으면 `line` 매핑을 사용한다.
- 원본 이미지가 없는 인식 payload는 기존 객체 bbox 기반 생성과 기존 리사이즈 방식을 유지한다.

## 검증

- `pnpm run build`
- `pnpm run biome`

## 질문과 답변 요약

- 바이너리 형식은 무엇으로 할까? base64 PNG로 결정했다.
- 레이어에는 무엇을 보존할까? 전체 `RecognitionPayload`를 보존하기로 했다.
- 리사이즈 시 무엇을 기준으로 타일을 다시 심을까? 바이너리 또는 실제 이미지 소스가 있으면 이미지 픽셀 기반으로 하고, 없으면 기존 방식을 유지하기로 했다.
- 픽셀 기반 생성에서 tileId는 어떻게 정할까? 객체 shape를 우선 사용하기로 했다.
- 마리오형 더미 이미지는 몇 개 만들까? 4개로 결정했다.
- shape 프리셋을 추가할까? 추가하지 않고 `triangle`, `rectangle`, `circle`, `line`만 사용하기로 했다.
- 검증 범위는 어디까지 할까? `pnpm run build`와 `pnpm run biome`만 실행하기로 했다.
- base64만 둘까, 실제 PNG 파일도 만들까? 레이어 조절 시 반투명 원본 이미지를 보여줄 수 있도록 실제 PNG 파일도 만들기로 했다.
## 추가 결정: 리사이즈 중 원본 이미지 표시

- 바이너리 데이터 또는 실제 이미지 소스가 있는 recognition layer는 크기조절 드래그 중 실제 이미지를 반투명하게 표시한다.
- 이미지는 리사이즈 프리뷰 bounds에 맞춰 늘어나며, 리사이즈 핸들과 bounds outline 아래에 깔린다.
- 바이너리 데이터가 없고 이미지 소스도 없는 레이어는 기존 초록색 bounds 프리뷰만 표시한다.

## 추가 질문과 답변

- 바이너리 데이터가 있는 layer는 크기조절 시 어떻게 보여줄까? 실제 이미지를 반투명하게 표시하기로 했다.
