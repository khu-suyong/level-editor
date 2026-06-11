import { computed } from 'nanostores';
import {
  createUniqueTileLabel,
  getTileLabelKey,
  normalizeTileLabel,
  tileLabelsEqual,
} from '@/helpers/tile-label';
import type {
  CvShape,
  LevelData,
  LevelLayer,
  RecognitionBinaryData,
  RecognitionPayload,
  TileIcon,
  TileMapping,
  TilePlacement,
} from '@/models/level';

import { currentSnapshot } from './history';
import {
  cloneTerrainExportTileLabels,
  createEmptyTerrainExportTileLabels,
  normalizeTerrainTileFields,
} from './terrain';

export const CV_SHAPE_PRESETS = [
  'structure',
  'triangle',
  'star',
] as const satisfies readonly CvShape[];

export const TILE_ICON_PRESETS = [
  'star',
  'triangle',
  'line',
  'door',
  'window',
  'stairs',
] as const satisfies readonly TileIcon[];

export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/u;

export const normalizeTileName = normalizeTileLabel;

export const getTileNameKey = getTileLabelKey;

export const getTileDisplayName = (tile: Pick<TileMapping, 'name'>) =>
  normalizeTileName(tile.name);

const backgroundColors = [
  '#2563eb',
  '#059669',
  '#dc2626',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#be123c',
  '#4f46e5',
] as const;

const iconColors = [
  '#f8fafc',
  '#111827',
  '#fef3c7',
  '#dbeafe',
  '#ecfeff',
] as const;

const randomItem = <T>(items: readonly T[]) =>
  items[Math.floor(Math.random() * items.length)] ?? items[0];

const cloneTileSource = (source: TilePlacement['source']) =>
  source ? { ...source } : undefined;

const cloneTile = (tile: TilePlacement): TilePlacement => ({
  ...tile,
  ...(tile.source ? { source: cloneTileSource(tile.source) } : {}),
});

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

const cloneLayer = (layer: LevelLayer): LevelLayer => ({
  ...layer,
  ...(layer.bounds ? { bounds: { ...layer.bounds } } : {}),
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

export const clonePaletteTile = (tile: TileMapping): TileMapping => ({
  ...tile,
  showBackground: tile.showBackground ?? true,
  showIcon: tile.showIcon ?? true,
  cvShapes: [...tile.cvShapes],
  isTerrain: Boolean(tile.isTerrain),
  ...(tile.terrainExportTileLabels
    ? {
        terrainExportTileLabels: cloneTerrainExportTileLabels(
          tile.terrainExportTileLabels,
        ),
      }
    : {}),
});

export const normalizePaletteTile = (tile: TileMapping): TileMapping =>
  normalizeTerrainTileFields({
    ...clonePaletteTile(tile),
    name: normalizeTileName(tile.name),
  });

export const cloneLevelData = (level: LevelData): LevelData => ({
  ...level,
  tileTable: level.tileTable.map(clonePaletteTile),
  layers: level.layers.map(cloneLayer),
});

export const isHexColor = (value: string) => HEX_COLOR_PATTERN.test(value);

export const normalizeCvShape = (value: string) => {
  const normalizedValue = value.trim().toLowerCase();

  if (
    normalizedValue === 'rectangle' ||
    normalizedValue === 'circle' ||
    normalizedValue === 'line'
  ) {
    return 'structure';
  }

  return normalizedValue;
};

export const isCvShape = (value: string): value is CvShape =>
  (CV_SHAPE_PRESETS as readonly string[]).includes(value);

export const getNextTileName = (tileTable: readonly TileMapping[]) =>
  createUniqueTileLabel(tileTable.map((tile) => tile.name));

export const sortPaletteTiles = (tileTable: readonly TileMapping[]) => [
  ...tileTable,
];

export const buildCvShapeMapping = (tileTable: readonly TileMapping[]) => {
  const mapping = new Map<CvShape, string>();

  for (const tile of tileTable) {
    for (const shape of tile.cvShapes) {
      mapping.set(shape, tile.name);
    }
  }

  return mapping;
};

export const cvShapeMappingStore = computed(currentSnapshot, (snapshot) =>
  snapshot
    ? buildCvShapeMapping(snapshot.tileTable)
    : new Map<CvShape, number>(),
);

export const createRandomPaletteTile = (
  tileTable: readonly TileMapping[],
  cvShapes: CvShape[] = [],
): TileMapping => {
  return {
    name: getNextTileName(tileTable),
    backgroundColor: randomItem(backgroundColors),
    icon: randomItem(TILE_ICON_PRESETS),
    iconColor: randomItem(iconColors),
    showBackground: true,
    showIcon: true,
    cvShapes: [...cvShapes],
    isTerrain: false,
    terrainExportTileLabels: createEmptyTerrainExportTileLabels(),
  };
};

export const validatePaletteTiles = (tileTable: readonly TileMapping[]) => {
  const errors: string[] = [];
  const tileNames = new Set<string>();
  const cvShapes = new Set<CvShape>();

  for (const tile of tileTable) {
    const tileName = normalizeTileName(tile.name);
    const tileNameKey = getTileNameKey(tile.name);

    if (!tileName) {
      errors.push('Tile name is required.');
    }

    if (tileNameKey && tileNames.has(tileNameKey)) {
      errors.push(`Tile name ${tileName} is already used.`);
    }

    tileNames.add(tileNameKey);

    if (!isHexColor(tile.backgroundColor)) {
      errors.push('Background color must be a #RRGGBB value.');
    }

    if (!TILE_ICON_PRESETS.includes(tile.icon)) {
      errors.push('Icon must be one of the palette presets.');
    }

    if (!isHexColor(tile.iconColor)) {
      errors.push('Icon color must be a #RRGGBB value.');
    }

    for (const shape of tile.cvShapes) {
      if (cvShapes.has(shape)) {
        errors.push(`CV shape ${shape} is already mapped.`);
      }

      cvShapes.add(shape);
    }

    if (tile.isTerrain && tile.terrainExportTileLabels) {
      for (const label of Object.values(tile.terrainExportTileLabels)) {
        if (typeof label !== 'string') {
          errors.push('Terrain export labels must be strings.');
          break;
        }
      }
    }
  }

  return errors;
};

export const validatePaletteTileUpdate = (
  level: LevelData,
  originalTileLabel: string | null,
  nextTile: TileMapping,
) => {
  const nextTileTable =
    originalTileLabel === null
      ? [
          ...level.tileTable.map(clonePaletteTile),
          normalizePaletteTile(nextTile),
        ]
      : level.tileTable.map((tile) =>
          tileLabelsEqual(tile.name, originalTileLabel)
            ? normalizePaletteTile(nextTile)
            : clonePaletteTile(tile),
        );

  return validatePaletteTiles(nextTileTable);
};

export const addPaletteTileToLevel = (
  level: LevelData,
  tile: TileMapping,
): LevelData => ({
  ...cloneLevelData(level),
  tileTable: sortPaletteTiles([...level.tileTable, normalizePaletteTile(tile)]),
});

export const updatePaletteTileInLevel = (
  level: LevelData,
  originalTileLabel: string,
  nextTile: TileMapping,
): LevelData => {
  const normalizedNextTile = normalizePaletteTile(nextTile);

  return {
    ...cloneLevelData(level),
    tileTable: sortPaletteTiles(
      level.tileTable.map((tile) =>
        tileLabelsEqual(tile.name, originalTileLabel)
          ? normalizedNextTile
          : clonePaletteTile(tile),
      ),
    ),
    layers: level.layers.map((layer) => ({
      ...layer,
      ...(layer.bounds ? { bounds: { ...layer.bounds } } : {}),
      tiles: layer.tiles.map((tile) => ({
        ...cloneTile(tile),
        tileLabel: tileLabelsEqual(tile.tileLabel, originalTileLabel)
          ? normalizedNextTile.name
          : tile.tileLabel,
      })),
    })),
  };
};

export const deletePaletteTileFromLevel = (
  level: LevelData,
  tileLabel: string,
  replacementTileLabel: string | null,
): LevelData => {
  const deletedTile = level.tileTable.find((tile) =>
    tileLabelsEqual(tile.name, tileLabel),
  );

  if (!deletedTile) {
    return cloneLevelData(level);
  }

  const deletedShapes = new Set(deletedTile.cvShapes);
  const nextTileTable = level.tileTable.flatMap((tile) => {
    if (tileLabelsEqual(tile.name, tileLabel)) {
      return [];
    }

    if (
      replacementTileLabel !== null &&
      tileLabelsEqual(tile.name, replacementTileLabel)
    ) {
      return [
        {
          ...clonePaletteTile(tile),
          cvShapes: [...new Set([...tile.cvShapes, ...deletedShapes])],
        },
      ];
    }

    return [clonePaletteTile(tile)];
  });

  return {
    ...cloneLevelData(level),
    tileTable: sortPaletteTiles(nextTileTable),
    layers: level.layers.map((layer) => ({
      ...layer,
      ...(layer.bounds ? { bounds: { ...layer.bounds } } : {}),
      tiles: layer.tiles.flatMap((tile) => {
        if (!tileLabelsEqual(tile.tileLabel, tileLabel)) {
          return [cloneTile(tile)];
        }

        if (replacementTileLabel === null) {
          return [];
        }

        return [
          {
            ...cloneTile(tile),
            tileLabel: replacementTileLabel,
          },
        ];
      }),
    })),
  };
};
