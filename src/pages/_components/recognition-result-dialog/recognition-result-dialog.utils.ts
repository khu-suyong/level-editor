import type { RecognitionPayload } from '@/models/level';

export const getPrimaryRecognitionPayload = (
  payloads: readonly RecognitionPayload[],
) => payloads[0] ?? null;

export const shouldCloseAfterRecognitionInsert = (layerId: string | null) =>
  Boolean(layerId);
