import type { Application, Container, Graphics } from 'pixi.js';

import type { Cell, TilePlacement } from '@/models/level';

export type PixiScene = {
  app: Application;
  background: Graphics;
  grid: Graphics;
  overlay: Graphics;
  preview: Graphics;
  tileLayer: Graphics;
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
      baseSelection: TilePlacement[];
      additive: boolean;
      moved: boolean;
    };
