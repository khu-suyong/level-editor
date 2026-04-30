import type { Accessor } from 'solid-js';

import type { Cell, LevelData, TilePlacement } from '@/models/level';
import {
  setClipboard,
  setSelection,
  type TileClipboard,
} from '@/stores/editor';
import { createPasteAction, type EditorHistoryAction } from '@/stores/history';

import { DEFAULT_TILE_ID } from './constants';
import { cellsEqual, coordinateKey, normalizeTiles, uniqueCells } from './util';

type UsePixiEditorActionsParams = {
  activeLayerId: Accessor<string>;
  clipboard: Accessor<TileClipboard | null>;
  onAction: (action: EditorHistoryAction) => void;
  selection: Accessor<TilePlacement[]>;
  snapshot: Accessor<LevelData>;
};

export const usePixiEditorActions = ({
  activeLayerId,
  clipboard,
  onAction,
  selection,
  snapshot,
}: UsePixiEditorActionsParams) => {
  const getActiveLayer = () =>
    snapshot().layers.find((layer) => layer.id === activeLayerId()) ??
    snapshot().layers[0] ??
    null;

  const getActiveTiles = () => getActiveLayer()?.tiles ?? [];

  const findTileAt = (cell: Cell) =>
    getActiveTiles().find((tile) => cellsEqual(tile, cell)) ?? null;

  const getDefaultTileId = () =>
    snapshot().tileTable[0]?.tileId ?? DEFAULT_TILE_ID;

  const dispatchAddOrReplace = (tiles: TilePlacement[]) => {
    const changedTiles = tiles.filter((tile) => {
      const existingTile = findTileAt(tile);

      return !existingTile || existingTile.tileId !== tile.tileId;
    });
    const action = createPasteAction(
      snapshot(),
      activeLayerId(),
      normalizeTiles(changedTiles),
    );

    if (action) {
      onAction(action);
      setSelection(normalizeTiles(changedTiles));
    }
  };

  const selectTilesInRect = (
    startCell: Cell,
    endCell: Cell,
    baseSelection: TilePlacement[],
    additive: boolean,
  ) => {
    const minX = Math.min(startCell.x, endCell.x);
    const maxX = Math.max(startCell.x, endCell.x);
    const minY = Math.min(startCell.y, endCell.y);
    const maxY = Math.max(startCell.y, endCell.y);
    const selected = getActiveTiles().filter(
      (tile) =>
        tile.x >= minX && tile.x <= maxX && tile.y >= minY && tile.y <= maxY,
    );

    if (!additive) {
      setSelection(selected);
      return;
    }

    setSelection(normalizeTiles([...baseSelection, ...selected]));
  };

  const paintCells = (cells: Cell[]) => {
    const tiles = uniqueCells(cells).map((cell) => ({
      ...cell,
      tileId: getDefaultTileId(),
    }));

    dispatchAddOrReplace(tiles);
  };

  const eraseCells = (cells: Cell[]) => {
    const targetKeys = new Set(uniqueCells(cells).map(coordinateKey));
    const deletedTiles = getActiveTiles().filter((tile) =>
      targetKeys.has(coordinateKey(tile)),
    );

    if (deletedTiles.length === 0) {
      return;
    }

    onAction({
      type: 'delete',
      layerId: activeLayerId(),
      tiles: deletedTiles,
    });
    setSelection(
      selection().filter((tile) => !targetKeys.has(coordinateKey(tile))),
    );
  };

  const deleteSelection = () => {
    if (selection().length === 0) {
      return;
    }

    const selectedKeys = new Set(selection().map(coordinateKey));
    const deletedTiles = getActiveTiles().filter((tile) =>
      selectedKeys.has(coordinateKey(tile)),
    );

    if (deletedTiles.length === 0) {
      setSelection([]);
      return;
    }

    onAction({
      type: 'delete',
      layerId: activeLayerId(),
      tiles: deletedTiles,
    });
    setSelection([]);
  };

  const moveSelection = (delta: Cell) => {
    if (selection().length === 0 || (delta.x === 0 && delta.y === 0)) {
      return;
    }

    const selectedKeys = new Set(selection().map(coordinateKey));
    const movedTiles = selection().map((tile) => ({
      ...tile,
      x: tile.x + delta.x,
      y: tile.y + delta.y,
    }));
    const movedKeys = new Set(movedTiles.map(coordinateKey));
    const replacedTiles = getActiveTiles().filter(
      (tile) =>
        !selectedKeys.has(coordinateKey(tile)) &&
        movedKeys.has(coordinateKey(tile)),
    );

    if (replacedTiles.length > 0) {
      onAction({
        type: 'replace',
        layerId: activeLayerId(),
        add: movedTiles,
        delete: [...selection(), ...replacedTiles],
      });
    } else {
      onAction({
        type: 'move',
        layerId: activeLayerId(),
        moves: selection().map((tile) => ({
          start: { x: tile.x, y: tile.y },
          end: { x: tile.x + delta.x, y: tile.y + delta.y },
          tileId: tile.tileId,
        })),
      });
    }

    setSelection(movedTiles);
  };

  const copySelection = () => {
    if (selection().length === 0) {
      return;
    }

    const selectedTiles = selection();
    const minX = Math.min(...selectedTiles.map((tile) => tile.x));
    const maxX = Math.max(...selectedTiles.map((tile) => tile.x));
    const minY = Math.min(...selectedTiles.map((tile) => tile.y));
    const maxY = Math.max(...selectedTiles.map((tile) => tile.y));
    const nextClipboard: TileClipboard = {
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      origin: { x: minX, y: minY },
      tiles: selectedTiles.map((tile) => ({
        ...tile,
        x: tile.x - minX,
        y: tile.y - minY,
      })),
    };

    setClipboard(nextClipboard);
    void navigator.clipboard
      ?.writeText(JSON.stringify(nextClipboard, null, 2))
      .catch(() => undefined);
  };

  const pasteClipboard = (cell: Cell) => {
    const currentClipboard = clipboard();

    if (!currentClipboard) {
      return;
    }

    const pastedTiles = currentClipboard.tiles.map((tile) => ({
      ...tile,
      x: cell.x + tile.x,
      y: cell.y + tile.y,
    }));
    const action = createPasteAction(snapshot(), activeLayerId(), pastedTiles);

    if (!action) {
      return;
    }

    onAction(action);
    setSelection(pastedTiles);
  };

  return {
    copySelection,
    deleteSelection,
    eraseCells,
    findTileAt,
    getActiveTiles,
    moveSelection,
    paintCells,
    pasteClipboard,
    selectTilesInRect,
  };
};

export type PixiEditorActions = ReturnType<typeof usePixiEditorActions>;
