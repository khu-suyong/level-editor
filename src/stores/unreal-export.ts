import type { LevelData, TileMapping, TilePlacement } from '@/models/level';

import { sanitizeFileName } from './level-file';
import {
  createTerrainTileLookup,
  resolveTerrainEdges,
  resolveTerrainRole,
} from './terrain';

const UNREAL_EXPORT_FILE_EXTENSION = '.ue.json';

export type UnrealExportTile = {
  x: number;
  y: number;
  type: string;
};

export type UnrealExportObject = {
  x: number;
  y: number;
  type: string;
};

export type UnrealExportData = {
  map: {
    width: number;
    height: number;
    tileSize: number;
  };
  tiles: UnrealExportTile[];
  objects: UnrealExportObject[];
};

const getTileMappingMap = (level: LevelData) =>
  new Map(level.tileTable.map((tile) => [tile.tileId, tile]));

const getTerrainExportType = (
  tileMapping: TileMapping,
  tilesByCoordinate: ReturnType<typeof createTerrainTileLookup>,
  tile: TilePlacement,
) => {
  const role = resolveTerrainRole(resolveTerrainEdges(tilesByCoordinate, tile));
  const label = tileMapping.terrainExportTileLabels?.[role]?.trim();

  return label || tileMapping.name;
};

const getTileMapping = (
  tileMappings: Map<number, TileMapping>,
  tile: TilePlacement,
) => {
  const tileMapping = tileMappings.get(tile.tileId);

  if (!tileMapping) {
    throw new Error(`타일 ${tile.tileId}의 팔레트 매핑을 찾을 수 없습니다.`);
  }

  return tileMapping;
};

export const buildUnrealExportData = (level: LevelData): UnrealExportData => {
  const tileMappings = getTileMappingMap(level);
  const tiles: UnrealExportTile[] = [];
  const objects: UnrealExportObject[] = [];
  let width = 0;
  let height = 0;

  for (const layer of [...level.layers].sort(
    (first, second) => first.order - second.order,
  )) {
    const tilesByCoordinate = createTerrainTileLookup(layer);

    for (const tile of layer.tiles) {
      if (tile.x < 0 || tile.y < 0) {
        throw new Error(
          'UE Export는 음수 좌표를 지원하지 않습니다. 타일을 원점 오른쪽/위쪽으로 이동한 뒤 다시 시도하세요.',
        );
      }

      width = Math.max(width, tile.x + 1);
      height = Math.max(height, tile.y + 1);

      const tileMapping = getTileMapping(tileMappings, tile);
      const exportItem = {
        x: tile.x,
        y: tile.y,
        type: tileMapping.isTerrain
          ? getTerrainExportType(tileMapping, tilesByCoordinate, tile)
          : tileMapping.name,
      };

      if (tileMapping.isTerrain) {
        tiles.push(exportItem);
      } else {
        objects.push(exportItem);
      }
    }
  }

  return {
    map: {
      width,
      height,
      tileSize: level.gridSize,
    },
    tiles,
    objects,
  };
};

export const serializeUnrealExportData = (level: LevelData) =>
  JSON.stringify(buildUnrealExportData(level), null, 2);

export const getUnrealExportFileName = (level: LevelData) => {
  const baseName = sanitizeFileName(level.name || level.id);

  return baseName.endsWith(UNREAL_EXPORT_FILE_EXTENSION)
    ? baseName
    : `${baseName}${UNREAL_EXPORT_FILE_EXTENSION}`;
};
