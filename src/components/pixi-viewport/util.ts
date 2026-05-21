import type { Cell, TilePlacement } from '@/models/level';

import { TILE_SIZE } from './constants';
import type { LayerBounds, LayerResizeHandle } from './types';

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

export const getTileBounds = (tiles: TilePlacement[]): LayerBounds | null => {
  if (tiles.length === 0) {
    return null;
  }

  const minX = Math.min(...tiles.map((tile) => tile.x));
  const maxX = Math.max(...tiles.map((tile) => tile.x));
  const minY = Math.min(...tiles.map((tile) => tile.y));
  const maxY = Math.max(...tiles.map((tile) => tile.y));

  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
};

export const isCellInBounds = (cell: Cell, bounds: LayerBounds) =>
  cell.x >= bounds.left &&
  cell.x < bounds.left + bounds.width &&
  cell.y >= bounds.top &&
  cell.y < bounds.top + bounds.height;

export const getLayerResizeHandlePoints = (bounds: LayerBounds) => {
  const left = bounds.left * TILE_SIZE;
  const right = (bounds.left + bounds.width) * TILE_SIZE;
  const bottom = bounds.top * TILE_SIZE;
  const top = (bounds.top + bounds.height) * TILE_SIZE;
  const centerX = (left + right) / 2;
  const centerY = (bottom + top) / 2;

  return [
    { handle: 'nw', x: left, y: top },
    { handle: 'n', x: centerX, y: top },
    { handle: 'ne', x: right, y: top },
    { handle: 'e', x: right, y: centerY },
    { handle: 'se', x: right, y: bottom },
    { handle: 's', x: centerX, y: bottom },
    { handle: 'sw', x: left, y: bottom },
    { handle: 'w', x: left, y: centerY },
  ] satisfies Array<{ handle: LayerResizeHandle; x: number; y: number }>;
};

export const getLayerResizeHandleAt = (
  bounds: LayerBounds,
  worldPoint: Cell,
  hitRadius: number,
) => {
  for (const point of getLayerResizeHandlePoints(bounds)) {
    if (
      Math.abs(worldPoint.x - point.x) <= hitRadius &&
      Math.abs(worldPoint.y - point.y) <= hitRadius
    ) {
      return point.handle;
    }
  }

  return null;
};

export const getCellEdgePoint = (worldPoint: Cell): Cell => ({
  x: Math.round(worldPoint.x / TILE_SIZE),
  y: Math.round(worldPoint.y / TILE_SIZE),
});

export const getResizedLayerBounds = (
  sourceBounds: LayerBounds,
  handle: LayerResizeHandle,
  edgePoint: Cell,
): LayerBounds => {
  let minX = sourceBounds.left;
  let maxX = sourceBounds.left + sourceBounds.width;
  let minY = sourceBounds.top;
  let maxY = sourceBounds.top + sourceBounds.height;

  if (handle.includes('w')) {
    minX = Math.min(edgePoint.x, maxX - 1);
  }

  if (handle.includes('e')) {
    maxX = Math.max(edgePoint.x, minX + 1);
  }

  if (handle.includes('s')) {
    minY = Math.min(edgePoint.y, maxY - 1);
  }

  if (handle.includes('n')) {
    maxY = Math.max(edgePoint.y, minY + 1);
  }

  return {
    left: minX,
    top: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const moveLayerBounds = (
  sourceBounds: LayerBounds,
  delta: Cell,
): LayerBounds => ({
  left: sourceBounds.left + delta.x,
  top: sourceBounds.top + delta.y,
  width: sourceBounds.width,
  height: sourceBounds.height,
});

export const moveLayerTiles = (sourceTiles: TilePlacement[], delta: Cell) => {
  return normalizeTiles(
    sourceTiles.map((tile) => ({
      ...tile,
      x: tile.x + delta.x,
      y: tile.y + delta.y,
    })),
  );
};

export const scaleLayerTiles = (
  sourceTiles: TilePlacement[],
  sourceBounds: LayerBounds,
  targetBounds: LayerBounds,
) => {
  return normalizeTiles(
    sourceTiles.map((tile) => ({
      x: Math.round(
        targetBounds.left +
          ((tile.x - sourceBounds.left + 0.5) / sourceBounds.width) *
            targetBounds.width -
          0.5,
      ),
      y: Math.round(
        targetBounds.top +
          ((tile.y - sourceBounds.top + 0.5) / sourceBounds.height) *
            targetBounds.height -
          0.5,
      ),
      tileId: tile.tileId,
    })),
  );
};

export const tileColor = (tileId: number) => {
  const colors = [0x2563eb, 0x059669, 0xdc2626, 0xd97706, 0x7c3aed, 0x0891b2];

  return colors[tileId % colors.length] ?? colors[0];
};

export const getCellRect = (cell: Cell) => ({
  x: cell.x * TILE_SIZE,
  y: cell.y * TILE_SIZE,
});

export const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.matches('input, textarea, select, button')
  );
};
