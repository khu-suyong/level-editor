import type { Cell, TilePlacement } from '@/models/level';

import { TILE_SIZE } from './constants';

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
