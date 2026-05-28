export const DEFAULT_GRID_SIZE = 32;
export const GRID_SIZE_MIN = 16;
export const GRID_SIZE_MAX = 64;
export const GRID_SIZE_STEP = 4;

export const clampGridSize = (gridSize: number) =>
  Math.min(
    GRID_SIZE_MAX,
    Math.max(
      GRID_SIZE_MIN,
      Number.isFinite(gridSize) ? Math.round(gridSize) : DEFAULT_GRID_SIZE,
    ),
  );
