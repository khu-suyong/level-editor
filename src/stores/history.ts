import { computed, map } from 'nanostores';

import type { Cell, LevelData, TilePlacement } from '@/models/level';

export type TileMove = {
  start: Cell;
  end: Cell;
  tileId: number;
};

export type AddHistoryAction = {
  type: 'add';
  layerId: string;
  tiles: TilePlacement[];
};

export type DeleteHistoryAction = {
  type: 'delete';
  layerId: string;
  tiles: TilePlacement[];
};

export type ReplaceHistoryAction = {
  type: 'replace';
  layerId: string;
  add: TilePlacement[];
  delete: TilePlacement[];
};

export type MoveHistoryAction = {
  type: 'move';
  layerId: string;
  moves: TileMove[];
};

export type EditorHistoryAction =
  | AddHistoryAction
  | DeleteHistoryAction
  | MoveHistoryAction
  | ReplaceHistoryAction;

export type EditorHistoryState = {
  actions: EditorHistoryAction[];
  deltaIndex: number;
  latestSnapshot: LevelData | null;
};

const coordinateKey = (cell: Cell) => `${cell.x},${cell.y}`;

const normalizeTiles = (tiles: TilePlacement[]) => {
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

const updateLayerTiles = (
  snapshot: LevelData,
  layerId: string,
  update: (tiles: TilePlacement[]) => TilePlacement[],
) => ({
  ...snapshot,
  layers: snapshot.layers.map((layer) =>
    layer.id === layerId
      ? { ...layer, tiles: normalizeTiles(update(layer.tiles)) }
      : layer,
  ),
});

const removeTiles = (tiles: TilePlacement[], targets: ReadonlyArray<Cell>) => {
  const targetKeys = new Set(targets.map(coordinateKey));

  return tiles.filter((tile) => !targetKeys.has(coordinateKey(tile)));
};

export const applyHistoryAction = (
  snapshot: LevelData,
  action: EditorHistoryAction,
) => {
  if (action.type === 'add') {
    return updateLayerTiles(snapshot, action.layerId, (tiles) => [
      ...removeTiles(tiles, action.tiles),
      ...action.tiles,
    ]);
  }

  if (action.type === 'delete') {
    return updateLayerTiles(snapshot, action.layerId, (tiles) =>
      removeTiles(tiles, action.tiles),
    );
  }

  if (action.type === 'replace') {
    return updateLayerTiles(snapshot, action.layerId, (tiles) => [
      ...removeTiles(tiles, [...action.delete, ...action.add]),
      ...action.add,
    ]);
  }

  return updateLayerTiles(snapshot, action.layerId, (tiles) => [
    ...removeTiles(tiles, [
      ...action.moves.map((move) => move.start),
      ...action.moves.map((move) => move.end),
    ]),
    ...action.moves.map((move) => ({
      ...move.end,
      tileId: move.tileId,
    })),
  ]);
};

export const revertHistoryAction = (
  snapshot: LevelData,
  action: EditorHistoryAction,
) => {
  if (action.type === 'add') {
    return updateLayerTiles(snapshot, action.layerId, (tiles) =>
      removeTiles(tiles, action.tiles),
    );
  }

  if (action.type === 'delete') {
    return updateLayerTiles(snapshot, action.layerId, (tiles) => [
      ...removeTiles(tiles, action.tiles),
      ...action.tiles,
    ]);
  }

  if (action.type === 'replace') {
    return updateLayerTiles(snapshot, action.layerId, (tiles) => [
      ...removeTiles(tiles, [...action.add, ...action.delete]),
      ...action.delete,
    ]);
  }

  return updateLayerTiles(snapshot, action.layerId, (tiles) => [
    ...removeTiles(tiles, [
      ...action.moves.map((move) => move.end),
      ...action.moves.map((move) => move.start),
    ]),
    ...action.moves.map((move) => ({
      ...move.start,
      tileId: move.tileId,
    })),
  ]);
};

export const historyStore = map<EditorHistoryState>({
  actions: [],
  deltaIndex: 0,
  latestSnapshot: null,
});

// computed

export const currentSnapshot = computed(historyStore, (history) => {
  if (!history.latestSnapshot) {
    return null;
  }

  return history.actions
    .slice(history.actions.length - history.deltaIndex)
    .reduceRight(revertHistoryAction, history.latestSnapshot);
});

export const canUndo = computed(
  historyStore,
  ({ actions, deltaIndex }) => deltaIndex < actions.length,
);

export const canRedo = computed(
  historyStore,
  ({ deltaIndex }) => deltaIndex > 0,
);

// actions

export const initializeHistory = (snapshot: LevelData) => {
  historyStore.set({
    actions: [],
    deltaIndex: 0,
    latestSnapshot: snapshot,
  });
};

export const recordHistoryAction = (action: EditorHistoryAction) => {
  const history = historyStore.get();
  const snapshot = currentSnapshot.get();

  if (!snapshot) {
    return;
  }

  const activeActions =
    history.deltaIndex === 0
      ? history.actions
      : history.actions.slice(0, history.actions.length - history.deltaIndex);

  historyStore.set({
    actions: [...activeActions, action],
    deltaIndex: 0,
    latestSnapshot: applyHistoryAction(snapshot, action),
  });
};

export const undoHistory = () => {
  const history = historyStore.get();

  if (history.deltaIndex >= history.actions.length) {
    return;
  }

  historyStore.setKey('deltaIndex', history.deltaIndex + 1);
};

export const redoHistory = () => {
  const history = historyStore.get();

  if (history.deltaIndex === 0) {
    return;
  }

  historyStore.setKey('deltaIndex', history.deltaIndex - 1);
};

export const addTiles = (layerId: string, tiles: TilePlacement[]) => {
  if (tiles.length === 0) {
    return;
  }

  recordHistoryAction({ type: 'add', layerId, tiles });
};

export const deleteTiles = (layerId: string, tiles: TilePlacement[]) => {
  if (tiles.length === 0) {
    return;
  }

  recordHistoryAction({ type: 'delete', layerId, tiles });
};

export const moveTiles = (layerId: string, moves: TileMove[]) => {
  if (moves.length === 0) {
    return;
  }

  recordHistoryAction({ type: 'move', layerId, moves });
};

export const replaceTiles = (
  layerId: string,
  add: TilePlacement[],
  deletedTiles: TilePlacement[],
) => {
  if (add.length === 0 && deletedTiles.length === 0) {
    return;
  }

  recordHistoryAction({
    type: 'replace',
    layerId,
    add,
    delete: deletedTiles,
  });
};
