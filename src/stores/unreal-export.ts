import type { LevelData } from '@/models/level';

import { sanitizeFileName } from './level-file';

const UNREAL_EXPORT_FILE_EXTENSION = '.ue.json';

export type UnrealExportTile = {
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
  enemies: [];
};

const getTileTypeMap = (level: LevelData) =>
  new Map(level.tileTable.map((tile) => [tile.tileId, tile.name]));

const getTileType = (tileTypes: Map<number, string>, tileId: number) => {
  const type = tileTypes.get(tileId);

  if (!type) {
    throw new Error(`타일 ${tileId}의 팔레트 매핑을 찾을 수 없습니다.`);
  }

  return type;
};

export const buildUnrealExportData = (level: LevelData): UnrealExportData => {
  const tileTypes = getTileTypeMap(level);
  const tiles: UnrealExportTile[] = [];

  for (const layer of [...level.layers].sort(
    (first, second) => first.order - second.order,
  )) {
    for (const tile of layer.tiles) {
      if (tile.x < 0 || tile.y < 0) {
        throw new Error(
          'UE Export는 음수 좌표를 지원하지 않습니다. 타일을 원점 오른쪽/위쪽으로 이동한 뒤 다시 시도하세요.',
        );
      }

      tiles.push({
        x: tile.x,
        y: tile.y,
        type: getTileType(tileTypes, tile.tileId),
      });
    }
  }

  return {
    map: {
      width:
        tiles.length > 0 ? Math.max(...tiles.map((tile) => tile.x)) + 1 : 0,
      height:
        tiles.length > 0 ? Math.max(...tiles.map((tile) => tile.y)) + 1 : 0,
      tileSize: level.gridSize,
    },
    tiles,
    enemies: [],
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
