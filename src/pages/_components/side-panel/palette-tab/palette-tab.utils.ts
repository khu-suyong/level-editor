import { tileLabelsEqual } from '@/helpers/tile-label';
import type { LevelData, TileMapping } from '@/models/level';
import { getTileDisplayName } from '@/stores/palette';

export type ReplacementOption = {
  value: string;
  label: string;
};

export type ReplacementRenderValue = string | ReplacementOption;

export const selectContentProps = { style: 'z-index: 1100' };

export const getUsedTileCount = (level: LevelData, tileLabel: string) =>
  level.layers.reduce(
    (count, layer) =>
      count +
      layer.tiles.filter((tile) => tileLabelsEqual(tile.tileLabel, tileLabel))
        .length,
    0,
  );

export const getPaletteDescription = (level: LevelData, tile: TileMapping) => {
  const usedCount = getUsedTileCount(level, tile.name);
  const terrain = tile.isTerrain ? 'Terrain' : 'Object';
  const shapes =
    tile.cvShapes.length > 0 ? `${tile.cvShapes.join(', ')}` : 'No Mapping';

  return `${usedCount} used / ${terrain} / ${shapes}`;
};

export const getReplacementValue = (value: ReplacementRenderValue) =>
  typeof value === 'string' ? value : value.value;

export const createReplacementOptions = (
  level: LevelData,
  deleteTargetLabel: string | null,
) =>
  level.tileTable
    .filter(
      (tile) =>
        !deleteTargetLabel || !tileLabelsEqual(tile.name, deleteTargetLabel),
    )
    .map((tile) => ({
      value: tile.name,
      label: getTileDisplayName(tile),
    }));
