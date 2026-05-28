import mockRecognitionImageUrl from '@/helpers/dummy-images/mario-wide-stage.png';
import {
  type RecognitionPayload,
  RecognitionPayloadSchema,
} from '@/models/level';

const RECOGNITIONS_ENDPOINT = '/api/recognitions';
const USE_RECOGNITION_MOCK =
  import.meta.env.VITE_USE_RECOGNITION_MOCK !== 'false';

const MOCK_RECOGNITION_PAYLOAD = {
  id: 'mario-wide-stage-mock',
  name: 'Mario Wide Stage Mock Recognition',
  image: {
    width: 960,
    height: 360,
    name: 'mario-wide-stage.png',
    src: mockRecognitionImageUrl,
  },
  objects: [
    {
      id: 'left-ground-line',
      shape: 'line',
      x: 24,
      y: 312,
      width: 270,
      height: 12,
      confidence: 0.96,
    },
    {
      id: 'right-ground-line',
      shape: 'line',
      x: 374,
      y: 312,
      width: 562,
      height: 12,
      confidence: 0.96,
    },
    {
      id: 'left-blocks',
      shape: 'rectangle',
      x: 54,
      y: 220,
      width: 118,
      height: 38,
      confidence: 0.88,
    },
    {
      id: 'mid-platform',
      shape: 'rectangle',
      x: 342,
      y: 234,
      width: 170,
      height: 30,
      confidence: 0.9,
    },
    {
      id: 'right-platform',
      shape: 'rectangle',
      x: 612,
      y: 250,
      width: 134,
      height: 28,
      confidence: 0.9,
    },
    {
      id: 'pipe',
      shape: 'rectangle',
      x: 804,
      y: 188,
      width: 96,
      height: 130,
      confidence: 0.92,
    },
    {
      id: 'coins-a',
      shape: 'circle',
      x: 292,
      y: 192,
      width: 60,
      height: 52,
      confidence: 0.78,
    },
    {
      id: 'coins-b',
      shape: 'circle',
      x: 532,
      y: 208,
      width: 66,
      height: 28,
      confidence: 0.78,
    },
    {
      id: 'slope',
      shape: 'triangle',
      x: 708,
      y: 244,
      width: 144,
      height: 74,
      confidence: 0.82,
    },
  ],
} satisfies RecognitionPayload;

const MOCK_RECOGNITION_RESPONSE = [
  MOCK_RECOGNITION_PAYLOAD,
] satisfies RecognitionPayload[];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const unwrapRecognitionResponse = (response: unknown) => {
  if (!isRecord(response)) {
    return response;
  }

  if ('items' in response) {
    return response.items;
  }

  if ('data' in response) {
    return response.data;
  }

  if ('payload' in response) {
    return response.payload;
  }

  return response;
};

const formatValidationError = (response: unknown) => {
  const candidates = Array.isArray(response) ? response : [response];
  const result = RecognitionPayloadSchema.array().safeParse(candidates);

  if (result.success) {
    return result.data;
  }

  const issue = result.error.issues[0];

  if (!issue) {
    throw new Error('Recognition response validation failed.');
  }

  throw new Error(
    `Recognition response validation failed: ${
      issue.path.join('.') || 'payload'
    }: ${issue.message}`,
  );
};

export const normalizeRecognitionResponse = (
  response: unknown,
): RecognitionPayload[] =>
  formatValidationError(unwrapRecognitionResponse(response));

export const uploadRecognitionImage = async (file: File) => {
  if (USE_RECOGNITION_MOCK) {
    return normalizeRecognitionResponse(MOCK_RECOGNITION_RESPONSE);
  }

  const formData = new FormData();

  formData.append('image', file);

  const response = await fetch(RECOGNITIONS_ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      `Recognition upload failed: ${response.status} ${response.statusText}`,
    );
  }

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new Error('Recognition response JSON parse failed.');
  }

  return normalizeRecognitionResponse(responseBody);
};
