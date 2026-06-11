import { tileLabelsEqual } from '@/helpers/tile-label';
import type {
  Cell,
  LayerBounds,
  LevelLayer,
  TilePlacement,
} from '@/models/level';

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const coordinateKey = (cell: Cell) => `${cell.x},${cell.y}`;

export const cellsEqual = (first: Cell, second: Cell) =>
  first.x === second.x && first.y === second.y;

export const normalizeTiles = (tiles: TilePlacement[]) => {
  const tileMap = new Map<string, TilePlacement>();

  for (const tile of tiles) {
    tileMap.set(coordinateKey(tile), tile);
  }

  return [...tileMap.values()].sort((first, second) => {
    if (first.y !== second.y) {
      return first.y - second.y;
    }

    return first.x - second.x;
  });
};

export const uniqueCells = (cells: Cell[]) => {
  const cellMap = new Map<string, Cell>();

  for (const cell of cells) {
    cellMap.set(coordinateKey(cell), cell);
  }

  return [...cellMap.values()];
};

export type TileBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export const getTileBounds = (tiles: TilePlacement[]): TileBounds | null => {
  if (tiles.length === 0) {
    return null;
  }

  return tiles.reduce<TileBounds>(
    (bounds, tile) => ({
      minX: Math.min(bounds.minX, tile.x),
      maxX: Math.max(bounds.maxX, tile.x),
      minY: Math.min(bounds.minY, tile.y),
      maxY: Math.max(bounds.maxY, tile.y),
    }),
    {
      minX: tiles[0].x,
      maxX: tiles[0].x,
      minY: tiles[0].y,
      maxY: tiles[0].y,
    },
  );
};

export const layerBoundsToTileBounds = (bounds: LayerBounds): TileBounds => ({
  minX: bounds.x,
  maxX: bounds.x + bounds.width - 1,
  minY: bounds.y,
  maxY: bounds.y + bounds.height - 1,
});

export const tileBoundsToLayerBounds = (bounds: TileBounds): LayerBounds => ({
  x: bounds.minX,
  y: bounds.minY,
  width: bounds.maxX - bounds.minX + 1,
  height: bounds.maxY - bounds.minY + 1,
});

export const getLayerTileBounds = (layer: LevelLayer): TileBounds | null =>
  layer.bounds
    ? layerBoundsToTileBounds(layer.bounds)
    : getTileBounds(layer.tiles);

export const isCellInTileBounds = (cell: Cell, bounds: TileBounds) =>
  cell.x >= bounds.minX &&
  cell.x <= bounds.maxX &&
  cell.y >= bounds.minY &&
  cell.y <= bounds.maxY;

const floodFillNeighborDeltas: Cell[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

const expandTileBounds = (bounds: TileBounds, padding: number): TileBounds => ({
  minX: bounds.minX - padding,
  maxX: bounds.maxX + padding,
  minY: bounds.minY - padding,
  maxY: bounds.maxY + padding,
});

const isCellOnTileBoundsEdge = (cell: Cell, bounds: TileBounds) =>
  cell.x === bounds.minX ||
  cell.x === bounds.maxX ||
  cell.y === bounds.minY ||
  cell.y === bounds.maxY;

export const resolveFloodFillCells = (layer: LevelLayer, startCell: Cell) => {
  const tilesByCoordinate = new Map(
    layer.tiles.map((tile) => [coordinateKey(tile), tile]),
  );
  const startTile = tilesByCoordinate.get(coordinateKey(startCell)) ?? null;
  const visited = new Set<string>();
  const fillCells: Cell[] = [];
  const queue: Cell[] = [startCell];

  if (startTile) {
    for (let index = 0; index < queue.length; index += 1) {
      const cell = queue[index];
      const cellKey = coordinateKey(cell);

      if (visited.has(cellKey)) {
        continue;
      }

      visited.add(cellKey);

      const tile = tilesByCoordinate.get(cellKey);

      if (!tile || !tileLabelsEqual(tile.tileLabel, startTile.tileLabel)) {
        continue;
      }

      fillCells.push(cell);

      for (const delta of floodFillNeighborDeltas) {
        const neighbor = {
          x: cell.x + delta.x,
          y: cell.y + delta.y,
        };

        if (!visited.has(coordinateKey(neighbor))) {
          queue.push(neighbor);
        }
      }
    }

    return fillCells;
  }

  const boundedFillBounds = layer.bounds
    ? layerBoundsToTileBounds(layer.bounds)
    : null;
  const tileBounds = getTileBounds(layer.tiles);
  const fillBounds =
    boundedFillBounds ?? (tileBounds ? expandTileBounds(tileBounds, 1) : null);

  if (!fillBounds || !isCellInTileBounds(startCell, fillBounds)) {
    return [];
  }

  for (let index = 0; index < queue.length; index += 1) {
    const cell = queue[index];
    const cellKey = coordinateKey(cell);

    if (visited.has(cellKey)) {
      continue;
    }

    visited.add(cellKey);

    if (
      tilesByCoordinate.has(cellKey) ||
      !isCellInTileBounds(cell, fillBounds)
    ) {
      continue;
    }

    if (!boundedFillBounds && isCellOnTileBoundsEdge(cell, fillBounds)) {
      return [];
    }

    fillCells.push(cell);

    for (const delta of floodFillNeighborDeltas) {
      const neighbor = {
        x: cell.x + delta.x,
        y: cell.y + delta.y,
      };

      if (!visited.has(coordinateKey(neighbor))) {
        queue.push(neighbor);
      }
    }
  }

  return fillCells;
};

export const tileColor = (tileLabel: string) => {
  const colors = [0x2563eb, 0x059669, 0xdc2626, 0xd97706, 0x7c3aed, 0x0891b2];
  const colorIndex = [...tileLabel].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );

  return colors[colorIndex % colors.length] ?? colors[0];
};

export const getCellRect = (cell: Cell, gridSize: number) => ({
  x: cell.x * gridSize,
  y: cell.y * gridSize,
});
