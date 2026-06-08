import type {
  Cell,
  LevelLayer,
  TerrainExportTileLabels,
  TileMapping,
  TilePlacement,
} from '@/models/level';

export const TERRAIN_EXPORT_LABEL_KEYS = [
  'center',
  'top',
  'bottom',
  'left',
  'right',
  'topLeft',
  'topRight',
  'bottomLeft',
  'bottomRight',
] as const satisfies ReadonlyArray<keyof TerrainExportTileLabels>;

export type TerrainRole = (typeof TERRAIN_EXPORT_LABEL_KEYS)[number];

export type TerrainEdges = {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
};

export const createEmptyTerrainExportTileLabels =
  (): TerrainExportTileLabels => ({
    center: '',
    top: '',
    bottom: '',
    left: '',
    right: '',
    topLeft: '',
    topRight: '',
    bottomLeft: '',
    bottomRight: '',
  });

export const cloneTerrainExportTileLabels = (
  labels: TerrainExportTileLabels | undefined,
): TerrainExportTileLabels | undefined =>
  labels
    ? TERRAIN_EXPORT_LABEL_KEYS.reduce<TerrainExportTileLabels>(
        (result, key) => {
          result[key] = labels[key] ?? '';

          return result;
        },
        createEmptyTerrainExportTileLabels(),
      )
    : undefined;

export const normalizeTerrainExportTileLabels = (
  labels: TerrainExportTileLabels | undefined,
): TerrainExportTileLabels | undefined => {
  if (!labels) {
    return undefined;
  }

  return TERRAIN_EXPORT_LABEL_KEYS.reduce<TerrainExportTileLabels>(
    (result, key) => {
      result[key] = labels[key].trim();

      return result;
    },
    createEmptyTerrainExportTileLabels(),
  );
};

export const normalizeTerrainTileFields = <T extends TileMapping>(
  tile: T,
): T => {
  const labels = normalizeTerrainExportTileLabels(tile.terrainExportTileLabels);

  return {
    ...tile,
    isTerrain: Boolean(tile.isTerrain),
    ...(labels ? { terrainExportTileLabels: labels } : {}),
  };
};

const cellKey = (cell: Cell) => `${cell.x},${cell.y}`;

const hasSameTerrainNeighbor = (
  tilesByCoordinate: ReadonlyMap<string, TilePlacement>,
  tile: TilePlacement,
  delta: Cell,
) => {
  const neighbor = tilesByCoordinate.get(
    cellKey({
      x: tile.x + delta.x,
      y: tile.y + delta.y,
    }),
  );

  return neighbor?.tileId === tile.tileId;
};

export const resolveTerrainEdges = (
  tilesByCoordinate: ReadonlyMap<string, TilePlacement>,
  tile: TilePlacement,
): TerrainEdges => ({
  top: !hasSameTerrainNeighbor(tilesByCoordinate, tile, { x: 0, y: 1 }),
  bottom: !hasSameTerrainNeighbor(tilesByCoordinate, tile, { x: 0, y: -1 }),
  left: !hasSameTerrainNeighbor(tilesByCoordinate, tile, { x: -1, y: 0 }),
  right: !hasSameTerrainNeighbor(tilesByCoordinate, tile, { x: 1, y: 0 }),
});

export const resolveTerrainRole = (edges: TerrainEdges): TerrainRole => {
  if (edges.top && edges.left) {
    return 'topLeft';
  }

  if (edges.top && edges.right) {
    return 'topRight';
  }

  if (edges.bottom && edges.left) {
    return 'bottomLeft';
  }

  if (edges.bottom && edges.right) {
    return 'bottomRight';
  }

  if (edges.top) {
    return 'top';
  }

  if (edges.bottom) {
    return 'bottom';
  }

  if (edges.left) {
    return 'left';
  }

  if (edges.right) {
    return 'right';
  }

  return 'center';
};

export const createTerrainTileLookup = (layer: LevelLayer) =>
  new Map(layer.tiles.map((tile) => [cellKey(tile), tile]));
