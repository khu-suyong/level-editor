import type { Application, Container, Graphics } from 'pixi.js';

import type { Cell, TilePlacement } from '@/models/level';

export type PixiScene = {
  app: Application;
  background: Graphics;
  grid: Graphics;
  overlay: Container;
  preview: Container;
  tileLayer: Container;
  world: Container;
  pan: Cell;
};

export type ContextMenuState = {
  open: boolean;
  pointerX: number;
  pointerY: number;
  cell: Cell;
};

export type SelectionRect = {
  start: Cell;
  end: Cell;
};

export type LayerBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type LayerResizeHandle =
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'nw';

export type LayerResizeState = {
  handle: LayerResizeHandle;
  sourceBounds: LayerBounds;
  targetBounds: LayerBounds;
  previewTiles: TilePlacement[];
};

export type LayerMoveState = {
  sourceBounds: LayerBounds;
  targetBounds: LayerBounds;
  previewTiles: TilePlacement[];
};

export type DragState =
  | {
      mode: 'pan';
      pointerId: number;
      lastScreen: Cell;
    }
  | {
      mode: 'paint' | 'erase';
      pointerId: number;
      lastCell: Cell;
      cells: Cell[];
    }
  | {
      mode: 'select-rect';
      pointerId: number;
      startCell: Cell;
      startScreen: Cell;
      baseSelection: TilePlacement[];
      additive: boolean;
      moved: boolean;
    }
  | {
      mode: 'move-selection';
      pointerId: number;
      startCell: Cell;
    }
  | {
      mode: 'move-layer';
      pointerId: number;
      startCell: Cell;
      startScreen: Cell;
      lastCell: Cell;
      sourceBounds: LayerBounds;
      sourceTiles: TilePlacement[];
      moved: boolean;
    }
  | {
      mode: 'resize-layer';
      pointerId: number;
      handle: LayerResizeHandle;
      sourceBounds: LayerBounds;
      sourceTiles: TilePlacement[];
    };
