import { type CvShape, type LevelData, LevelDataSchema } from '@/models/level';
import { isCvShape, normalizeCvShape } from './palette';

const LEVEL_FILE_EXTENSION = '.level.json';

export const LEVEL_FILE_ACCEPT = 'application/json,.json,.level.json';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const sanitizeFileName = (value: string) => {
  const fileName = value
    .trim()
    .replace(/[<>:"/\\|?*]+/gu, '-')
    .replace(/\s+/gu, '-')
    .replace(/-+/gu, '-')
    .replace(/^-|-$/gu, '');

  return fileName || 'level';
};

const normalizeLegacyCvShapes = (
  cvShapes: unknown,
  mappedShapes: Set<CvShape>,
) => {
  if (!Array.isArray(cvShapes)) {
    return cvShapes;
  }

  const normalizedShapes: unknown[] = [];

  for (const cvShape of cvShapes) {
    const normalizedShape =
      typeof cvShape === 'string' ? normalizeCvShape(cvShape) : cvShape;

    if (typeof normalizedShape === 'string' && isCvShape(normalizedShape)) {
      if (mappedShapes.has(normalizedShape)) {
        continue;
      }

      mappedShapes.add(normalizedShape);
    }

    normalizedShapes.push(normalizedShape);
  }

  return normalizedShapes;
};

const normalizeLegacyTileMapping = (
  tileMapping: unknown,
  mappedShapes: Set<CvShape>,
) => {
  if (!isRecord(tileMapping)) {
    return tileMapping;
  }

  return {
    ...tileMapping,
    cvShapes: normalizeLegacyCvShapes(tileMapping.cvShapes, mappedShapes),
  };
};

const normalizeLegacyTileTable = (tileTable: unknown) => {
  if (!Array.isArray(tileTable)) {
    return tileTable;
  }

  const mappedShapes = new Set<CvShape>();

  return tileTable.map((tileMapping) =>
    normalizeLegacyTileMapping(tileMapping, mappedShapes),
  );
};

const normalizeLegacyRecognitionPayload = (payload: unknown) => {
  if (!isRecord(payload) || !Array.isArray(payload.objects)) {
    return payload;
  }

  return {
    ...payload,
    objects: payload.objects.map((object) => {
      if (!isRecord(object) || typeof object.shape !== 'string') {
        return object;
      }

      return {
        ...object,
        shape: normalizeCvShape(object.shape),
      };
    }),
  };
};

const normalizeLegacyLayer = (layer: unknown) => {
  if (!isRecord(layer) || !isRecord(layer.source)) {
    return layer;
  }

  if (layer.source.type !== 'recognition') {
    return layer;
  }

  return {
    ...layer,
    source: {
      ...layer.source,
      payload: normalizeLegacyRecognitionPayload(layer.source.payload),
    },
  };
};

const normalizeLegacyLevelData = (levelData: unknown) => {
  if (!isRecord(levelData)) {
    return levelData;
  }

  return {
    ...levelData,
    tileTable: normalizeLegacyTileTable(levelData.tileTable),
    layers: Array.isArray(levelData.layers)
      ? levelData.layers.map(normalizeLegacyLayer)
      : levelData.layers,
  };
};

export const getLevelFileName = (level: LevelData) => {
  const baseName = sanitizeFileName(level.name || level.id);

  return baseName.endsWith(LEVEL_FILE_EXTENSION)
    ? baseName
    : `${baseName}${LEVEL_FILE_EXTENSION}`;
};

export const serializeLevelData = (level: LevelData) =>
  JSON.stringify(level, null, 2);

export const parseLevelFileText = (text: string): LevelData => {
  let parsedLevelData: unknown;

  try {
    parsedLevelData = JSON.parse(text);
  } catch {
    throw new Error('레벨 파일 JSON을 읽을 수 없습니다.');
  }

  const result = LevelDataSchema.safeParse(
    normalizeLegacyLevelData(parsedLevelData),
  );

  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.join('.') || 'level';
    const message = issue?.message || '레벨 파일 형식이 올바르지 않습니다.';

    throw new Error(`레벨 파일 검증 실패: ${path}: ${message}`);
  }

  return result.data;
};
