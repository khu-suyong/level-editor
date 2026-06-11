import type {
  LayerBounds,
  LevelData,
  LevelLayer,
  RecognitionBinaryData,
  RecognitionPayload,
  TileMapping,
  TilePlacement,
} from '@/models/level';
import { cloneTerrainExportTileLabels } from './terrain';

export type LayerMoveDirection = 'up' | 'down';
export type LayerRenameResult =
  | {
      changed: boolean;
      layer: LevelLayer;
      level: LevelData;
      ok: true;
    }
  | {
      error: string;
      ok: false;
    };

const layerIdPrefix = 'layer';
const layerNamePrefix = 'Layer';

const cloneLayerBounds = (bounds: LayerBounds): LayerBounds => ({ ...bounds });

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

const cloneTile = (tile: TilePlacement): TilePlacement => ({
  ...tile,
  ...(tile.source ? { source: { ...tile.source } } : {}),
});

const cloneTileMapping = (tileMapping: TileMapping): TileMapping => ({
  ...tileMapping,
  showBackground: tileMapping.showBackground ?? true,
  showIcon: tileMapping.showIcon ?? true,
  cvShapes: [...tileMapping.cvShapes],
  isTerrain: Boolean(tileMapping.isTerrain),
  ...(tileMapping.terrainExportTileLabels
    ? {
        terrainExportTileLabels: cloneTerrainExportTileLabels(
          tileMapping.terrainExportTileLabels,
        ),
      }
    : {}),
});

const cloneLayer = (layer: LevelLayer): LevelLayer => ({
  ...layer,
  ...(layer.bounds ? { bounds: cloneLayerBounds(layer.bounds) } : {}),
  ...(layer.source
    ? {
        source: {
          ...layer.source,
          payload: cloneRecognitionPayload(layer.source.payload),
        },
      }
    : {}),
  tiles: layer.tiles.map(cloneTile),
});

const cloneLevelData = (level: LevelData): LevelData => ({
  ...level,
  tileTable: level.tileTable.map(cloneTileMapping),
  layers: level.layers.map(cloneLayer),
});

const normalizeLayerName = (name: string) => name.trim().toLowerCase();

const assignDisplayLayerOrders = (
  layers: readonly LevelLayer[],
): LevelLayer[] =>
  layers.map((layer, index) => ({
    ...cloneLayer(layer),
    order: layers.length - index - 1,
  }));

export const sortLayersForDisplay = (layers: readonly LevelLayer[]) =>
  [...layers].sort((first, second) => {
    if (first.order !== second.order) {
      return second.order - first.order;
    }

    return first.id.localeCompare(second.id);
  });

export const normalizeLayerOrders = (level: LevelData): LevelData => ({
  ...cloneLevelData(level),
  layers: assignDisplayLayerOrders(sortLayersForDisplay(level.layers)),
});

export const createEmptyLayer = (level: LevelData): LevelLayer => {
  const layerIds = new Set(level.layers.map((layer) => layer.id));
  const layerNames = new Set(
    level.layers.map((layer) => normalizeLayerName(layer.name)),
  );
  let index = 1;

  while (
    layerIds.has(`${layerIdPrefix}-${index}`) ||
    layerNames.has(normalizeLayerName(`${layerNamePrefix} ${index}`))
  ) {
    index += 1;
  }

  return {
    id: `${layerIdPrefix}-${index}`,
    name: `${layerNamePrefix} ${index}`,
    order: 0,
    tiles: [],
  };
};

export const addEmptyLayerToBottom = (level: LevelData) => {
  const layer = createEmptyLayer(level);
  const nextLayers = assignDisplayLayerOrders([
    ...sortLayersForDisplay(level.layers),
    layer,
  ]);
  const nextLayer = nextLayers.find((candidate) => candidate.id === layer.id);

  return {
    layer: nextLayer ?? layer,
    level: {
      ...cloneLevelData(level),
      layers: nextLayers,
    },
  };
};

export const moveLayerInLevel = (
  level: LevelData,
  layerId: string,
  direction: LayerMoveDirection,
): LevelData | null => {
  const layers = sortLayersForDisplay(level.layers);
  const currentIndex = layers.findIndex((layer) => layer.id === layerId);
  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= layers.length) {
    return null;
  }

  const nextLayers = [...layers];
  [nextLayers[currentIndex], nextLayers[nextIndex]] = [
    nextLayers[nextIndex],
    nextLayers[currentIndex],
  ];

  return {
    ...cloneLevelData(level),
    layers: assignDisplayLayerOrders(nextLayers),
  };
};

export const renameLayerInLevel = (
  level: LevelData,
  layerId: string,
  name: string,
): LayerRenameResult => {
  const nextName = name.trim();

  if (!nextName) {
    return {
      ok: false,
      error: '레이어 이름을 입력하세요.',
    };
  }

  const currentLayer = level.layers.find((layer) => layer.id === layerId);

  if (!currentLayer) {
    return {
      ok: false,
      error: '레이어를 찾을 수 없습니다.',
    };
  }

  const duplicateLayer = level.layers.find(
    (layer) =>
      layer.id !== layerId &&
      normalizeLayerName(layer.name) === normalizeLayerName(nextName),
  );

  if (duplicateLayer) {
    return {
      ok: false,
      error: '중복된 레이어 이름입니다.',
    };
  }

  if (currentLayer.name === nextName) {
    return {
      ok: true,
      changed: false,
      level,
      layer: currentLayer,
    };
  }

  const nextLevel = cloneLevelData(level);
  const nextLayer = nextLevel.layers.find((layer) => layer.id === layerId);

  if (!nextLayer) {
    return {
      ok: false,
      error: '레이어를 찾을 수 없습니다.',
    };
  }

  nextLayer.name = nextName;

  return {
    ok: true,
    changed: true,
    level: nextLevel,
    layer: nextLayer,
  };
};

export const getLayerDeleteFallbackId = (level: LevelData, layerId: string) => {
  const layers = sortLayersForDisplay(level.layers);
  const currentIndex = layers.findIndex((layer) => layer.id === layerId);

  if (currentIndex < 0) {
    return layers[0]?.id ?? null;
  }

  return layers[currentIndex - 1]?.id ?? layers[currentIndex + 1]?.id ?? null;
};

export const deleteLayerFromLevel = (
  level: LevelData,
  layerId: string,
): LevelData | null => {
  if (level.layers.length <= 1) {
    return null;
  }

  const layers = sortLayersForDisplay(level.layers);

  if (!layers.some((layer) => layer.id === layerId)) {
    return null;
  }

  return {
    ...cloneLevelData(level),
    layers: assignDisplayLayerOrders(
      layers.filter((layer) => layer.id !== layerId),
    ),
  };
};
