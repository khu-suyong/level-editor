# 인식 API 목 응답 전환

## 결정 요약

- `uploadRecognitionImage(file: File)`의 함수 시그니처와 반환 타입은 유지한다.
- 기본 동작은 서버 요청 대신 목 인식 응답을 반환하는 것으로 한다.
- `VITE_USE_RECOGNITION_MOCK=false`일 때만 기존 `POST /api/recognitions` 요청을 사용한다.
- 목 응답은 `docs/images/chunk_0_0.png` 이미지를 기준으로 한 단일 `RecognitionPayload` 배열이다.

## 구현 내용

- `src/api/recognitions.ts`에서 `docs/images/chunk_0_0.png`를 Vite asset URL로 import한다.
- 목 모드에서는 전달받은 `File`을 업로드하거나 검증하지 않는다.
- 목 payload의 이미지는 다음 값을 사용한다.
  - `width: 2978`
  - `height: 2251`
  - `name: 'chunk_0_0.png'`
  - `src: chunk_0_0.png` asset URL
- 목 payload의 `objects`에는 이미지의 주요 사각형, 삼각형, 선 요소를 나타내는 `rectangle`, `triangle`, `line` 객체를 포함한다.
- 실제 API 모드에서는 기존 `FormData`, `fetch`, JSON parse, `normalizeRecognitionResponse` 검증 로직을 그대로 사용한다.

## 환경변수

- `VITE_USE_RECOGNITION_MOCK`가 설정되지 않았거나 `'true'`이면 목 응답을 반환한다.
- `VITE_USE_RECOGNITION_MOCK=false`이면 실제 API 요청을 보낸다.
- 목 응답은 서버 응답을 흉내 내기 위한 개발용 데이터이며, 별도 지연 시간은 추가하지 않는다.

## 검증

- `pnpm run build`
- `pnpm run biome`
- 기본 환경에서 이미지 import 버튼을 사용하면 서버 요청 없이 인식 결과 Dialog가 열리는지 확인한다.
- `VITE_USE_RECOGNITION_MOCK=false` 설정 시 기존 `/api/recognitions` 요청이 발생하는지 확인한다.
- 목 payload 삽입 시 `chunk_0_0.png` 기반 레이어가 생성되는지 확인한다.

## 질문과 답변 요약

- 목 응답 전환 범위는 어떻게 할까? 환경변수 플래그로 mock/API 동작을 전환하기로 했다.
- 목 응답 내용은 어떻게 할까? `chunk_0_0.png`를 사용하는 단일 실사용 payload로 구성하기로 했다.
- 플래그가 없을 때 기본 동작은 무엇으로 할까? 기본값은 목 응답 사용으로 결정했다.
