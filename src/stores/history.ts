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

export const getCurrentSnapshot = ({
  actions,
  deltaIndex,
  latestSnapshot,
}: EditorHistoryState) => {
  if (!latestSnapshot) {
    return null;
  }

  return actions
    .slice(actions.length - deltaIndex)
    .reduceRight(revertHistoryAction, latestSnapshot);
};

export const currentSnapshot = computed(historyStore, getCurrentSnapshot);

export const canUndo = computed(
  historyStore,
  ({ actions, deltaIndex }) => deltaIndex < actions.length,
);

export const canRedo = computed(
  historyStore,
  ({ deltaIndex }) => deltaIndex > 0,
);

export const initializeHistory = (snapshot: LevelData) => {
  historyStore.set({
    actions: [],
    deltaIndex: 0,
    latestSnapshot: snapshot,
  });
};

export const recordHistoryAction = (action: EditorHistoryAction) => {
  const history = historyStore.get();
  const snapshot = getCurrentSnapshot(history);

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

export const createPasteAction = (
  snapshot: LevelData,
  layerId: string,
  tiles: TilePlacement[],
): AddHistoryAction | ReplaceHistoryAction | null => {
  if (tiles.length === 0) {
    return null;
  }

  const layer = snapshot.layers.find((item) => item.id === layerId);

  if (!layer) {
    return null;
  }

  const pastedKeys = new Set(tiles.map(coordinateKey));
  const deletedTiles = layer.tiles.filter((tile) =>
    pastedKeys.has(coordinateKey(tile)),
  );

  if (deletedTiles.length === 0) {
    return {
      type: 'add',
      layerId,
      tiles,
    };
  }

  return {
    type: 'replace',
    layerId,
    add: tiles,
    delete: deletedTiles,
  };
};
