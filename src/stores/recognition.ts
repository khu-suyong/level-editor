import { clampGridSize, DEFAULT_GRID_SIZE } from '@/helpers/grid-size';
import type {
  Cell,
  CvShape,
  LayerBounds,
  LevelData,
  LevelLayer,
  RecognitionBinaryData,
  RecognitionImage,
  RecognitionPayload,
  RecognizedObject,
  TileMapping,
  TilePlacement,
} from '@/models/level';

import { currentSnapshot, replaceLevel } from './history';
import {
  createRandomPaletteTile,
  isCvShape,
  normalizeCvShape,
} from './palette';

type CellRange = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type RecognizedObjectTarget = {
  object: RecognizedObject;
  objectId: string;
  range: CellRange | null;
};

type RecognitionImageAsset = {
  imageData: ImageData;
  payload: RecognitionPayload;
};

export type RecognitionLayerBuildOptions = {
  importId?: string;
  layerName?: string;
  origin?: Cell;
  tileSize?: number;
  viewportWidth?: number;
};

export type RecognitionLayerBuildResult = {
  importId: string;
  layer: LevelLayer;
  tileMappings: TileMapping[];
};

const DEFAULT_VIEWPORT_WIDTH = 1024;
const DARK_PIXEL_COVERAGE_THRESHOLD = 0.008;
const DARK_PIXEL_LUMINANCE_THRESHOLD = 200;
const STRUCTURE_CV_SHAPE = 'structure' satisfies CvShape;
const FALLBACK_PIXEL_SHAPE = STRUCTURE_CV_SHAPE;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const coordinateKey = (cell: Cell) => `${cell.x},${cell.y}`;

const slugify = (value: string) => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'recognition';
};

const getUniqueId = (base: string, existingIds: Set<string>) => {
  if (!existingIds.has(base)) {
    return base;
  }

  let index = 2;

  while (existingIds.has(`${base}-${index}`)) {
    index += 1;
  }

  return `${base}-${index}`;
};

const getNextLayerOrder = (level: LevelData) => {
  if (level.layers.length === 0) {
    return 0;
  }

  return Math.max(...level.layers.map((layer) => layer.order)) + 1;
};

const getLayerBounds = (
  payload: RecognitionPayload,
  options: RecognitionLayerBuildOptions,
): LayerBounds => {
  const tileSize = clampGridSize(options.tileSize ?? DEFAULT_GRID_SIZE);
  const viewportWidth = Math.max(
    options.viewportWidth ?? DEFAULT_VIEWPORT_WIDTH,
    tileSize,
  );
  const targetWidthCells = Math.max(
    1,
    Math.floor((viewportWidth * 0.5) / tileSize),
  );
  const targetHeightCells = Math.max(
    1,
    Math.round(targetWidthCells * (payload.image.height / payload.image.width)),
  );
  const origin = options.origin ?? { x: 0, y: -targetHeightCells };

  return {
    x: origin.x,
    y: origin.y,
    width: targetWidthCells,
    height: targetHeightCells,
  };
};

const getObjectCellRange = (
  object: RecognizedObject,
  payload: RecognitionPayload,
  bounds: LayerBounds,
): CellRange | null => {
  const boundsRight = bounds.x + bounds.width;
  const boundsTop = bounds.y + bounds.height;
  const scaleX = bounds.width / payload.image.width;
  const scaleY = bounds.height / payload.image.height;
  const left = bounds.x + object.x * scaleX;
  const right = bounds.x + (object.x + object.width) * scaleX;

  // Image coordinates are top-left/downward; editor cells are bottom-left/upward.
  const top = boundsTop - object.y * scaleY;
  const bottom = boundsTop - (object.y + object.height) * scaleY;
  const clippedLeft = clamp(Math.min(left, right), bounds.x, boundsRight);
  const clippedRight = clamp(Math.max(left, right), bounds.x, boundsRight);
  const clippedBottom = clamp(Math.min(bottom, top), bounds.y, boundsTop);
  const clippedTop = clamp(Math.max(bottom, top), bounds.y, boundsTop);

  if (clippedLeft >= clippedRight || clippedBottom >= clippedTop) {
    return null;
  }

  return {
    minX: Math.floor(clippedLeft),
    maxX: Math.ceil(clippedRight) - 1,
    minY: Math.floor(clippedBottom),
    maxY: Math.ceil(clippedTop) - 1,
  };
};

const getObjectCenterCell = (
  object: RecognizedObject,
  payload: RecognitionPayload,
  bounds: LayerBounds,
): Cell => {
  const boundsTop = bounds.y + bounds.height;
  const scaleX = bounds.width / payload.image.width;
  const scaleY = bounds.height / payload.image.height;
  const projectedCenterX = bounds.x + (object.x + object.width / 2) * scaleX;
  const projectedCenterY = boundsTop - (object.y + object.height / 2) * scaleY;

  return {
    x: clamp(
      Math.round(projectedCenterX - 0.5),
      bounds.x,
      bounds.x + bounds.width - 1,
    ),
    y: clamp(
      Math.round(projectedCenterY - 0.5),
      bounds.y,
      bounds.y + bounds.height - 1,
    ),
  };
};

const cloneRecognitionBinaryData = (
  data: RecognitionBinaryData,
): RecognitionBinaryData => ({ ...data });

const cloneRecognitionPayload = (
  payload: RecognitionPayload,
): RecognitionPayload => ({
  ...payload,
  image: {
    ...payload.image,
    ...(payload.image.data
      ? { data: cloneRecognitionBinaryData(payload.image.data) }
      : {}),
  },
  objects: payload.objects.map((object) => ({
    ...object,
    ...(object.data ? { data: cloneRecognitionBinaryData(object.data) } : {}),
  })),
});

const getRecognitionImageDataUrl = (data: RecognitionBinaryData) =>
  `data:${data.mimeType};base64,${data.value}`;

const hasRecognitionImageSource = (image: RecognitionImage) =>
  Boolean(image.data || image.src);

const getRecognitionImageBlob = async (image: RecognitionImage) => {
  const source = image.data
    ? getRecognitionImageDataUrl(image.data)
    : image.src;

  if (!source) {
    return null;
  }

  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(`Recognition image load failed: ${response.status}`);
  }

  return response.blob();
};

const blobToRecognitionBinaryData = async (
  blob: Blob,
): Promise<RecognitionBinaryData> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const value = result.includes(',') ? result.split(',')[1] : result;

      if (!value) {
        reject(new Error('Recognition image binary read failed.'));
        return;
      }

      resolve({
        encoding: 'base64',
        mimeType: blob.type || 'image/png',
        value,
      });
    });
    reader.addEventListener('error', () => {
      reject(
        reader.error ?? new Error('Recognition image binary read failed.'),
      );
    });
    reader.readAsDataURL(blob);
  });

const blobToImageData = async (blob: Blob) => {
  if (typeof document === 'undefined') {
    throw new Error('Recognition image decoding requires a browser document.');
  }

  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');

  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const context = canvas.getContext('2d');

  if (!context) {
    bitmap.close();
    throw new Error('Recognition image canvas context is unavailable.');
  }

  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  return context.getImageData(0, 0, canvas.width, canvas.height);
};

const getRecognitionImageAsset = async (
  payload: RecognitionPayload,
): Promise<RecognitionImageAsset | null> => {
  if (!hasRecognitionImageSource(payload.image)) {
    return null;
  }

  const blob = await getRecognitionImageBlob(payload.image);

  if (!blob) {
    return null;
  }

  const data = payload.image.data
    ? cloneRecognitionBinaryData(payload.image.data)
    : await blobToRecognitionBinaryData(blob);
  const imageData = await blobToImageData(blob);

  return {
    imageData,
    payload: {
      ...cloneRecognitionPayload(payload),
      image: {
        ...payload.image,
        data,
      },
    },
  };
};

const isCellInRange = (cell: Cell, range: CellRange) =>
  cell.x >= range.minX &&
  cell.x <= range.maxX &&
  cell.y >= range.minY &&
  cell.y <= range.maxY;

const getRecognizedObjectTargets = (
  payload: RecognitionPayload,
  bounds: LayerBounds,
  importId: string,
) => {
  const objectIds = new Set<string>();

  return payload.objects.map<RecognizedObjectTarget>((object, objectIndex) => {
    const objectId = getUniqueId(
      `${importId}-${slugify(object.id ?? `object-${objectIndex + 1}`)}`,
      objectIds,
    );

    objectIds.add(objectId);

    return {
      object,
      objectId,
      range: getObjectCellRange(object, payload, bounds),
    };
  });
};

const findObjectTargetForCell = (
  cell: Cell,
  targets: RecognizedObjectTarget[],
) => {
  for (let index = targets.length - 1; index >= 0; index -= 1) {
    const target = targets[index];

    if (target?.range && isCellInRange(cell, target.range)) {
      return target;
    }
  }

  return null;
};

const getCellImageSampleBounds = (
  cell: Cell,
  bounds: LayerBounds,
  payload: RecognitionPayload,
  imageData: ImageData,
) => {
  const xOffset = cell.x - bounds.x;
  const yOffset = cell.y - bounds.y;
  const payloadLeft = (xOffset / bounds.width) * payload.image.width;
  const payloadRight = ((xOffset + 1) / bounds.width) * payload.image.width;
  const payloadTop =
    ((bounds.height - yOffset - 1) / bounds.height) * payload.image.height;
  const payloadBottom =
    ((bounds.height - yOffset) / bounds.height) * payload.image.height;
  const scaleX = imageData.width / payload.image.width;
  const scaleY = imageData.height / payload.image.height;

  return {
    minX: clamp(Math.floor(payloadLeft * scaleX), 0, imageData.width - 1),
    maxX: clamp(Math.ceil(payloadRight * scaleX), 1, imageData.width),
    minY: clamp(Math.floor(payloadTop * scaleY), 0, imageData.height - 1),
    maxY: clamp(Math.ceil(payloadBottom * scaleY), 1, imageData.height),
  };
};

const hasDarkPixelCoverage = (
  cell: Cell,
  bounds: LayerBounds,
  payload: RecognitionPayload,
  imageData: ImageData,
) => {
  const sampleBounds = getCellImageSampleBounds(
    cell,
    bounds,
    payload,
    imageData,
  );
  let darkPixels = 0;
  let totalPixels = 0;

  for (let y = sampleBounds.minY; y < sampleBounds.maxY; y += 1) {
    for (let x = sampleBounds.minX; x < sampleBounds.maxX; x += 1) {
      const offset = (y * imageData.width + x) * 4;
      const alpha = imageData.data[offset + 3] ?? 0;

      totalPixels += 1;

      if (alpha < 16) {
        continue;
      }

      const red = imageData.data[offset] ?? 255;
      const green = imageData.data[offset + 1] ?? 255;
      const blue = imageData.data[offset + 2] ?? 255;
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;

      if (luminance <= DARK_PIXEL_LUMINANCE_THRESHOLD) {
        darkPixels += 1;
      }
    }
  }

  return (
    totalPixels > 0 && darkPixels / totalPixels >= DARK_PIXEL_COVERAGE_THRESHOLD
  );
};

const buildTileMappingResolver = (
  level: LevelData,
  createMissingTiles = true,
) => {
  const shapeTiles = new Map(
    level.tileTable.flatMap((tile) =>
      tile.cvShapes.map((shape) => [shape, tile] as const),
    ),
  );
  const tileMappings: TileMapping[] = [];

  const resolveTile = (rawShape: string): TileMapping | null => {
    const normalizedShape = normalizeCvShape(rawShape);

    if (!isCvShape(normalizedShape)) {
      return null;
    }

    const existingTile = shapeTiles.get(normalizedShape);

    if (existingTile) {
      return existingTile;
    }

    if (!createMissingTiles) {
      return null;
    }

    const createdTileMapping = createRandomPaletteTile(
      [...level.tileTable, ...tileMappings],
      [normalizedShape],
    );
    const tileMapping =
      normalizedShape === STRUCTURE_CV_SHAPE
        ? {
            ...createdTileMapping,
            isTerrain: true,
          }
        : createdTileMapping;

    tileMappings.push(tileMapping);
    shapeTiles.set(normalizedShape, tileMapping);

    return tileMapping;
  };

  return {
    resolveTile,
    tileMappings,
  };
};

const hasStructureRecognizedObject = (payload: RecognitionPayload) =>
  payload.objects.some(
    (object) => normalizeCvShape(object.shape) === STRUCTURE_CV_SHAPE,
  );

export const getNonTerrainStructureTileMapping = (
  level: LevelData,
  payload: RecognitionPayload,
): TileMapping | null => {
  if (!hasStructureRecognizedObject(payload)) {
    return null;
  }

  return (
    level.tileTable.find(
      (tile) => tile.cvShapes.includes(STRUCTURE_CV_SHAPE) && !tile.isTerrain,
    ) ?? null
  );
};

const resolveTileWithFallback = (
  shape: string,
  tileMappingResolver: ReturnType<typeof buildTileMappingResolver>,
) =>
  tileMappingResolver.resolveTile(shape) ??
  tileMappingResolver.resolveTile(FALLBACK_PIXEL_SHAPE);

const getTargetTile = (
  target: RecognizedObjectTarget,
  tileMappingResolver: ReturnType<typeof buildTileMappingResolver>,
) => tileMappingResolver.resolveTile(target.object.shape);

const buildObjectBoundsTiles = (
  importId: string,
  targets: RecognizedObjectTarget[],
  tileMappingResolver: ReturnType<typeof buildTileMappingResolver>,
) => {
  const tileMap = new Map<string, TilePlacement>();

  for (const target of targets) {
    if (!target.range) {
      continue;
    }

    const tile = getTargetTile(target, tileMappingResolver);

    if (!tile?.isTerrain) {
      continue;
    }

    for (let y = target.range.minY; y <= target.range.maxY; y += 1) {
      for (let x = target.range.minX; x <= target.range.maxX; x += 1) {
        tileMap.set(coordinateKey({ x, y }), {
          x,
          y,
          tileId: tile.tileId,
          source: {
            type: 'recognition',
            importId,
            objectId: target.objectId,
          },
        });
      }
    }
  }

  return tileMap;
};

const buildObjectCenterTiles = (
  payload: RecognitionPayload,
  bounds: LayerBounds,
  importId: string,
  targets: RecognizedObjectTarget[],
  tileMappingResolver: ReturnType<typeof buildTileMappingResolver>,
) => {
  const tileMap = new Map<string, TilePlacement>();

  for (const target of targets) {
    const tile = getTargetTile(target, tileMappingResolver);

    if (!tile || tile.isTerrain) {
      continue;
    }

    const cell = getObjectCenterCell(target.object, payload, bounds);

    tileMap.set(coordinateKey(cell), {
      ...cell,
      tileId: tile.tileId,
      source: {
        type: 'recognition',
        importId,
        objectId: target.objectId,
      },
    });
  }

  return tileMap;
};

const buildImagePixelTiles = (
  payload: RecognitionPayload,
  bounds: LayerBounds,
  importId: string,
  imageData: ImageData,
  targets: RecognizedObjectTarget[],
  tileMappingResolver: ReturnType<typeof buildTileMappingResolver>,
) => {
  const tileMap = new Map<string, TilePlacement>();
  const fallbackObjectId = `${importId}-image`;

  for (let yOffset = 0; yOffset < bounds.height; yOffset += 1) {
    for (let xOffset = 0; xOffset < bounds.width; xOffset += 1) {
      const cell = {
        x: bounds.x + xOffset,
        y: bounds.y + yOffset,
      };

      if (!hasDarkPixelCoverage(cell, bounds, payload, imageData)) {
        continue;
      }

      const target = findObjectTargetForCell(cell, targets);
      const tile = resolveTileWithFallback(
        target?.object.shape ?? FALLBACK_PIXEL_SHAPE,
        tileMappingResolver,
      );

      if (!tile?.isTerrain) {
        continue;
      }

      tileMap.set(coordinateKey(cell), {
        ...cell,
        tileId: tile.tileId,
        source: {
          type: 'recognition',
          importId,
          objectId: target?.objectId ?? fallbackObjectId,
        },
      });
    }
  }

  return tileMap;
};

const sortTileMap = (tileMap: Map<string, TilePlacement>) =>
  [...tileMap.values()].sort((first, second) => {
    if (first.y !== second.y) {
      return first.y - second.y;
    }

    return first.x - second.x;
  });

export const buildRecognitionLayer = (
  level: LevelData,
  payload: RecognitionPayload,
  options: RecognitionLayerBuildOptions = {},
): Promise<RecognitionLayerBuildResult> => {
  return buildRecognitionLayerAsync(level, payload, options);
};

const buildRecognitionLayerAsync = async (
  level: LevelData,
  payload: RecognitionPayload,
  options: RecognitionLayerBuildOptions,
): Promise<RecognitionLayerBuildResult> => {
  const existingLayerIds = new Set(level.layers.map((layer) => layer.id));
  const existingImportIds = new Set(
    level.layers.flatMap((layer) =>
      layer.id.startsWith('cv-') ? [layer.id, layer.id.slice(3)] : [layer.id],
    ),
  );
  const baseImportId = slugify(
    options.importId ?? payload.id ?? payload.name ?? 'recognition-import',
  );
  const importId = getUniqueId(baseImportId, existingImportIds);
  const layerId = getUniqueId(`cv-${importId}`, existingLayerIds);
  const layerName =
    options.layerName ??
    payload.name ??
    payload.image.name ??
    `CV Import ${getNextLayerOrder(level) + 1}`;
  const bounds = getLayerBounds(payload, options);
  const tileMappingResolver = buildTileMappingResolver(level);
  const imageAsset = await getRecognitionImageAsset(payload);
  const sourcePayload = imageAsset?.payload ?? cloneRecognitionPayload(payload);
  const objectTargets = getRecognizedObjectTargets(
    sourcePayload,
    bounds,
    importId,
  );
  const terrainTileMap = imageAsset
    ? buildImagePixelTiles(
        sourcePayload,
        bounds,
        importId,
        imageAsset.imageData,
        objectTargets,
        tileMappingResolver,
      )
    : buildObjectBoundsTiles(importId, objectTargets, tileMappingResolver);
  const objectCenterTileMap = buildObjectCenterTiles(
    sourcePayload,
    bounds,
    importId,
    objectTargets,
    tileMappingResolver,
  );
  const tileMap = new Map([...terrainTileMap, ...objectCenterTileMap]);

  return {
    importId,
    layer: {
      id: layerId,
      name: layerName,
      order: getNextLayerOrder(level),
      bounds,
      source: {
        type: 'recognition',
        importId,
        payload: sourcePayload,
      },
      tiles: sortTileMap(tileMap),
    },
    tileMappings: tileMappingResolver.tileMappings,
  };
};

export const rebuildRecognitionLayerTiles = async (
  level: LevelData,
  layer: LevelLayer,
  bounds: LayerBounds,
) => {
  if (layer.source?.type !== 'recognition') {
    return null;
  }

  const imageAsset = await getRecognitionImageAsset(layer.source.payload);

  if (!imageAsset) {
    return null;
  }

  const tileMappingResolver = buildTileMappingResolver(level, false);
  const objectTargets = getRecognizedObjectTargets(
    imageAsset.payload,
    bounds,
    layer.source.importId,
  );

  const terrainTileMap = buildImagePixelTiles(
    imageAsset.payload,
    bounds,
    layer.source.importId,
    imageAsset.imageData,
    objectTargets,
    tileMappingResolver,
  );
  const objectCenterTileMap = buildObjectCenterTiles(
    imageAsset.payload,
    bounds,
    layer.source.importId,
    objectTargets,
    tileMappingResolver,
  );

  return sortTileMap(new Map([...terrainTileMap, ...objectCenterTileMap]));
};

export const insertRecognitionLayer = (
  payload: RecognitionPayload,
  options: RecognitionLayerBuildOptions = {},
): Promise<string | null> => {
  return insertRecognitionLayerAsync(payload, options);
};

const insertRecognitionLayerAsync = async (
  payload: RecognitionPayload,
  options: RecognitionLayerBuildOptions,
) => {
  const snapshot = currentSnapshot.get();

  if (!snapshot) {
    return null;
  }

  const result = await buildRecognitionLayer(snapshot, payload, options);

  replaceLevel({
    ...snapshot,
    tileTable: [...snapshot.tileTable, ...result.tileMappings],
    layers: [...snapshot.layers, result.layer],
  });

  return result.layer.id;
};
